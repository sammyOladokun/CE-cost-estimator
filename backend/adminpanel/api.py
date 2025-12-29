from __future__ import annotations

from decimal import Decimal

from django.db.models import Count, Sum
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from marketplace.models import License, MarketplaceLead, Tool, WidgetLead
from shared.tenant import Tenant


class ToolAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tool
        fields = ["id", "slug", "name", "summary", "icon_url", "media_url", "price_monthly", "bento_features", "is_active"]


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "name", "slug", "plan"]


class AdminToolViewSet(viewsets.ModelViewSet):
    queryset = Tool.objects.all()
    serializer_class = ToolAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "slug"


class AdminTenantViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tenant.objects.all().annotate(tool_count=Count("licenses"))
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminMetricsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        mrr = License.objects.filter(status=License.Status.ACTIVE).aggregate(
            total=Sum("tool__price_monthly")
        )["total"] or Decimal("0.00")
        pending = Decimal("0.00")
        coupons = 0
        demo_clicks = MarketplaceLead.objects.count()
        widget_uses = WidgetLead.objects.count()
        return Response(
            {
                "mrr": mrr,
                "pending": pending,
                "coupons": coupons,
                "demo_clicks": demo_clicks,
                "widget_uses": widget_uses,
            }
        )


class AdminTicketsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        # Stub data; replace with real ticket model if added
        data = [
            {"id": "#1042", "tenant": "Sky Roofing", "subject": "Issue 1", "status": "Open", "updated": "Today"},
            {"id": "#1043", "tenant": "Bright Solar", "subject": "Issue 2", "status": "In Review", "updated": "Today"},
        ]
        return Response(data)
