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
from marketplace.permissions import HasActiveLicense
from shared.utils import calculate_actual_area


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


class WidgetLeadCreateView(generics.CreateAPIView):
    serializer_class = WidgetLeadSerializer
    permission_classes = [permissions.AllowAny]

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
