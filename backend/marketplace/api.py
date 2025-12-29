from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.http import Http404
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from marketplace.models import (
    License,
    MarketplaceLead,
    Tool,
    WidgetConfig,
    WidgetLead,
)
from shared.tenant import Tenant
from marketplace.permissions import HasActiveLicense
from shared.utils import calculate_actual_area
from django.utils.text import slugify


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
        fields = ["primary_color", "secondary_color", "theme", "logo_url", "mark_text"]


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


class WidgetLeadCreateView(generics.ListCreateAPIView):
    serializer_class = WidgetLeadSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        tenant = getattr(self.request, "tenant", None)
        if tenant is None:
            raise Http404("Tenant not found for this widget request.")
        qs = WidgetLead.objects.filter(tenant=tenant).order_by("-created_at")
        tool_slug = self.request.query_params.get("tool")
        if tool_slug:
            qs = qs.filter(tool__slug=tool_slug)
        return qs

    def perform_create(self, serializer):
        tenant = getattr(self.request, "tenant", None)
        if tenant is None:
            raise Http404("Tenant not found for this widget request.")
        serializer.save(tenant=tenant)


class WidgetConfigView(APIView):
    permission_classes = [permissions.AllowAny]

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
            }
            return Response(data)

        config, _ = WidgetConfig.objects.get_or_create(
            tenant=tenant,
            defaults={
                "primary_color": tenant.primary_color,
                "secondary_color": tenant.secondary_color,
                "theme": tenant.widget_theme,
                "logo_url": tenant.brand_logo_url,
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
        estimate_amount = round(actual_area * rate, 2)

        return Response(
            {
                "tool": payload.get("tool"),
                "ground_area": ground_area,
                "pitch": pitch,
                "actual_area": actual_area,
                "estimate_amount": estimate_amount,
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

        license_obj, _ = License.objects.get_or_create(
            tenant=tenant, tool=tool, defaults={"status": License.Status.ACTIVE}
        )

        payment_url = f"https://payments.example.com/checkout?tenant={tenant.id}&tool={tool.slug}"
        return Response(
            {
                "tenant_id": str(tenant.id),
                "license_id": str(license_obj.id),
                "status": license_obj.status,
                "payment_url": payment_url,
            },
            status=status.HTTP_201_CREATED,
        )
