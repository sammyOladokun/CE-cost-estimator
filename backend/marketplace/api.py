from __future__ import annotations

import os
import uuid
from decimal import Decimal
from typing import Any

import requests
from django.http import Http404
from django.utils.text import slugify
from rest_framework import generics, permissions, serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime

from marketplace.models import (
    License,
    MarketplaceLead,
    Tool,
    WidgetConfig,
    WidgetLead,
)
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from marketplace.permissions import HasActiveLicense
from pricing.models import MaterialSetting
from shared.tenant import Tenant
from shared.utils import apply_rate_from_settings, calculate_actual_area


class ToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tool
        fields = [
            "id",
            "slug",
            "name",
            "summary",
            "icon_url",
            "media_url",
            "price_monthly",
            "config_schema",
            "bento_features",
            "coupon_code",
            "coupon_percent_off",
            "coupon_start",
            "coupon_end",
            "coupon_usage_limit",
            "coupon_usage_count",
            "coupon_tenant",
        ]


class MarketplaceLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceLead
        fields = ["id", "full_name", "email", "phone", "address", "source", "tool", "metadata"]


class WidgetLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = WidgetLead
        fields = [
            "id",
            "tool",
            "full_name",
            "email",
            "phone",
            "address",
            "estimate_amount",
            "ground_area",
            "pitch",
            "actual_area",
            "source_url",
        ]
        read_only_fields = ["estimate_amount", "actual_area"]


class WidgetConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WidgetConfig
        fields = ["primary_color", "secondary_color", "theme", "logo_url", "mark_text", "marketing_hook"]


class PricingRequestSerializer(serializers.Serializer):
    tool = serializers.SlugField(required=False, allow_blank=True)
    ground_area = serializers.DecimalField(max_digits=10, decimal_places=2)
    pitch = serializers.DecimalField(max_digits=6, decimal_places=2)
    rate_per_sqft = serializers.DecimalField(
        max_digits=8, decimal_places=2, required=False, default=Decimal("1.00")
    )


class ToolListView(generics.ListAPIView):
    queryset = Tool.objects.filter(is_active=True)
    serializer_class = ToolSerializer
    permission_classes = [permissions.AllowAny]


class ToolDetailView(generics.RetrieveAPIView):
    queryset = Tool.objects.filter(is_active=True)
    serializer_class = ToolSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class MarketplaceLeadCreateView(generics.CreateAPIView):
    serializer_class = MarketplaceLeadSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        serializer.save()


class ToolCreateView(generics.CreateAPIView):
    """
    Admin-only creation endpoint to publish new tools without touching code.
    """

    queryset = Tool.objects.all()
    serializer_class = ToolSerializer
    permission_classes = [permissions.IsAdminUser]


class WidgetLeadPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class WidgetLeadCreateView(generics.ListCreateAPIView):
    serializer_class = WidgetLeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = WidgetLeadPagination

    def get_queryset(self):
        tenant = getattr(self.request, "tenant", None)
        if tenant is None:
            raise Http404("Tenant not found for this widget request.")
        qs = WidgetLead.objects.filter(tenant=tenant).order_by("-created_at")
        tool_slug = self.request.query_params.get("tool")
        if tool_slug:
            qs = qs.filter(tool__slug=tool_slug)
        email = self.request.query_params.get("email")
        if email:
            qs = qs.filter(email__icontains=email)
        date_from = self.request.query_params.get("from")
        date_to = self.request.query_params.get("to")
        try:
            if date_from:
                qs = qs.filter(created_at__date__gte=datetime.fromisoformat(date_from).date())
            if date_to:
                qs = qs.filter(created_at__date__lte=datetime.fromisoformat(date_to).date())
        except ValueError:
            pass
        return qs

    def perform_create(self, serializer):
        tenant = getattr(self.request, "tenant", None)
        if tenant is None:
            raise Http404("Tenant not found for this widget request.")
        lead = serializer.save(tenant=tenant)
        webhook = getattr(tenant, "n8n_webhook_url", "") or getattr(tenant, "domain", "")
        if webhook and webhook.startswith("http"):
            try:
                requests.post(
                    webhook,
                    json={
                        "full_name": lead.full_name,
                        "email": lead.email,
                        "phone": lead.phone,
                        "address": lead.address,
                        "estimate_amount": str(lead.estimate_amount),
                        "tool": lead.tool.slug if lead.tool else None,
                    },
                    timeout=5,
                )
            except Exception:
                pass


class WidgetConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            # Fallback default palette for public preview
            data = {
                "primary_color": "#0A0F1A",
                "secondary_color": "#1F6BFF",
                "theme": "frosted",
                "logo_url": "",
                "mark_text": "neX",
                "marketing_hook": "See Your Roof from Space & Get a Technical Estimate in 60 Seconds.",
            }
            return Response(data)

        config, _ = WidgetConfig.objects.get_or_create(
            tenant=tenant,
            defaults={
                "primary_color": tenant.primary_color,
                "secondary_color": tenant.secondary_color,
                "theme": tenant.widget_theme,
                "logo_url": tenant.brand_logo_url,
                "marketing_hook": "See Your Roof from Space & Get a Technical Estimate in 60 Seconds.",
            },
        )
        return Response(WidgetConfigSerializer(config).data)

    def put(self, request, *args, **kwargs):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            raise Http404("Tenant not found for update.")
        config, _ = WidgetConfig.objects.get_or_create(
            tenant=tenant,
            defaults={
                "primary_color": tenant.primary_color,
                "secondary_color": tenant.secondary_color,
                "theme": tenant.widget_theme,
                "logo_url": tenant.brand_logo_url,
            },
        )
        serializer = WidgetConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LicenseCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        tenant = getattr(request, "tenant", None)
        tool_slug = request.query_params.get("tool")
        has_license = False
        if tenant and tool_slug:
            has_license = License.objects.filter(
                tenant=tenant, tool__slug=tool_slug, status=License.Status.ACTIVE
            ).exists()
        return Response({"licensed": has_license})


class PricingEstimateView(APIView):
    permission_classes = [HasActiveLicense]

    def post(self, request, *args, **kwargs):
        serializer = PricingRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload: dict[str, Any] = serializer.validated_data

        ground_area = float(payload["ground_area"])
        pitch = float(payload["pitch"])
        actual_area = calculate_actual_area(ground_area, pitch)
        rate = float(payload.get("rate_per_sqft") or 0)

        tenant = getattr(request, "tenant", None)
        tool_slug = payload.get("tool")
        material_name = request.query_params.get("material") or request.data.get("material")
        material_used = None
        if tenant and tool_slug:
            qs = MaterialSetting.objects.filter(tenant=tenant, tool__slug=tool_slug)
            if material_name:
                qs = qs.filter(name__iexact=material_name)
            ms = qs.order_by("name").first()
            if ms:
                rate = float(ms.material_rate + ms.labor_rate)
                material_used = ms.name
        estimate_amount = apply_rate_from_settings(actual_area, rate, 0)

        return Response(
            {
                "tool": payload.get("tool"),
                "ground_area": ground_area,
                "pitch": pitch,
                "actual_area": actual_area,
                "estimate_amount": estimate_amount,
                "material_used": material_used,
                "rate_per_sqft": rate,
            },
            status=status.HTTP_200_OK,
        )


class OnboardingStartSerializer(serializers.Serializer):
    tool = serializers.SlugField()
    tenant_name = serializers.CharField(required=False, allow_blank=True)
    existing_tenant_id = serializers.UUIDField(required=False)
    full_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(required=False, allow_blank=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True)


class OnboardingStartView(APIView):
    """
    Creates a tenant + contractor + license for new users, or adds a license for existing tenants.
    Returns a placeholder payment_url (to be swapped with real checkout).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = OnboardingStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        tool_slug = data["tool"]
        tool = Tool.objects.filter(slug=tool_slug, is_active=True).first()
        if not tool:
            raise Http404("Tool not found")

        tenant: Tenant | None = None
        if data.get("existing_tenant_id"):
            tenant = Tenant.objects.filter(id=data["existing_tenant_id"]).first()
            if tenant is None:
                raise Http404("Tenant not found")
        else:
            if not data.get("tenant_name") or not data.get("full_name"):
                raise serializers.ValidationError("tenant_name and full_name are required for new accounts.")
            slug_base = slugify(data["tenant_name"])
            slug_candidate = slug_base
            idx = 1
            while Tenant.objects.filter(slug=slug_candidate).exists():
                idx += 1
                slug_candidate = f"{slug_base}-{idx}"
            tenant = Tenant.objects.create(name=data["tenant_name"], slug=slug_candidate)

        discount, coupon_ok = self._apply_coupon(tool, tenant, data.get("coupon_code"))
        metadata = {"coupon_code": data.get("coupon_code")} if coupon_ok else {}
        license_obj, _ = License.objects.get_or_create(
            tenant=tenant, tool=tool, defaults={"status": License.Status.PENDING, "metadata": metadata}
        )

        payment_url = self._create_flutterwave_link(tenant, tool, data["email"], discount)
        return Response(
            {
                "tenant_id": str(tenant.id),
                "license_id": str(license_obj.id),
                "status": license_obj.status,
                "payment_url": payment_url,
            },
            status=status.HTTP_201_CREATED,
        )

    def _create_flutterwave_link(self, tenant, tool, email: str, discount: Decimal) -> str:
        secret = os.getenv("FLW_SECRET_KEY")
        callback = os.getenv("FLW_CALLBACK_URL", "")
        if not secret:
            return f"https://payments.example.com/checkout?tenant={tenant.id}&tool={tool.slug}"

        tx_ref = f"{tenant.id}-{tool.slug}-{uuid.uuid4()}"
        amount = max(Decimal("0.00"), (tool.price_monthly or Decimal("0.00")) - discount)
        payload = {
            "tx_ref": tx_ref,
            "amount": float(amount),
            "currency": "USD",
            "redirect_url": callback,
            "customer": {"email": email},
            "customizations": {"title": f"{tool.name} Subscription", "description": f"Tenant {tenant.name}"},
        }
        try:
            resp = requests.post(
                "https://api.flutterwave.com/v3/payments",
                headers={"Authorization": f"Bearer {secret}"},
                json=payload,
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", {}).get("link") or f"https://checkout.flutterwave.com/{tx_ref}"
        except Exception:
            return f"https://checkout.flutterwave.com/{tx_ref}"

    def _apply_coupon(self, tool: Tool, tenant: Tenant, code: str | None):
        if not code or code != tool.coupon_code:
            return Decimal("0.00"), False
        today = datetime.utcnow().date()
        if tool.coupon_start and today < tool.coupon_start:
            return Decimal("0.00"), False
        if tool.coupon_end and today > tool.coupon_end:
            return Decimal("0.00"), False
        if tool.coupon_tenant and tool.coupon_tenant != tenant:
            return Decimal("0.00"), False
        if tool.coupon_usage_limit and tool.coupon_usage_count >= tool.coupon_usage_limit:
            return Decimal("0.00"), False
        discount = (tool.price_monthly or Decimal("0.00")) * (tool.coupon_percent_off or Decimal("0.00")) / 100
        return discount, True


@method_decorator(csrf_exempt, name="dispatch")
class FlutterwaveWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        status_str = data.get("status")
        tx_ref = data.get("tx_ref") or ""
        if not tx_ref:
            return Response({"detail": "missing tx_ref"}, status=status.HTTP_400_BAD_REQUEST)

        parts = tx_ref.split("-")
        tenant_id = parts[0] if parts else None
        tool_slug = parts[1] if len(parts) > 1 else None

        if status_str == "successful" and tenant_id and tool_slug:
            licenses = License.objects.filter(tenant_id=tenant_id, tool__slug=tool_slug)
            licenses.update(status=License.Status.ACTIVE)
            tool = Tool.objects.filter(slug=tool_slug).first()
            for lic in licenses:
                if tool and tool.coupon_code and lic.metadata.get("coupon_code") == tool.coupon_code:
                    if tool.coupon_usage_limit == 0 or tool.coupon_usage_count < tool.coupon_usage_limit:
                        tool.coupon_usage_count = (tool.coupon_usage_count or 0) + 1
                        tool.save(update_fields=["coupon_usage_count"])
            return Response({"detail": "license activated"}, status=status.HTTP_200_OK)

        License.objects.filter(tenant_id=tenant_id, tool__slug=tool_slug).update(status=License.Status.CANCELED)
        return Response({"detail": "license canceled"}, status=status.HTTP_200_OK)


class TenantOriginView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return Response({"detail": "Tenant not resolved"}, status=status.HTTP_400_BAD_REQUEST)
        domain = request.data.get("domain")
        if not domain:
            return Response({"detail": "domain required"}, status=status.HTTP_400_BAD_REQUEST)
        tenant.domain = domain
        tenant.save(update_fields=["domain"])
        cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
        csrf_origins = os.getenv("CSRF_TRUSTED_ORIGINS", "")
        note = "Ensure this domain is added to CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS in your environment."
        if tenant.domain in cors_origins or tenant.domain in csrf_origins:
            note = "Domain saved and appears in your allowed origins."
        return Response({"domain": tenant.domain, "note": note})
