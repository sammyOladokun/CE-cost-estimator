from __future__ import annotations

from decimal import Decimal
from datetime import timedelta

from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth
from django.utils.timezone import now
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from marketplace.models import License, MarketplaceLead, Tool, WidgetLead
from adminpanel.models import Ticket, Credit
from shared.tenant import Tenant


class ToolAdminSerializer(serializers.ModelSerializer):
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
          "bento_features",
          "is_active",
          "coupon_code",
          "coupon_percent_off",
          "coupon_start",
          "coupon_end",
          "coupon_usage_limit",
          "coupon_usage_count",
          "coupon_tenant",
        ]


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "name", "slug", "plan", "active_licenses", "trial_licenses", "canceled_licenses"]


class AdminToolViewSet(viewsets.ModelViewSet):
    queryset = Tool.objects.all()
    serializer_class = ToolAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get("q")
        active = self.request.query_params.get("active")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(slug__icontains=q))
        if active == "true":
            qs = qs.filter(is_active=True)
        if active == "false":
            qs = qs.filter(is_active=False)
        return qs.order_by("name")


class AdminTenantViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tenant.objects.all().annotate(
        tool_count=Count("licenses"),
        active_licenses=Count("licenses", filter=Q(licenses__status=License.Status.ACTIVE)),
        trial_licenses=Count("licenses", filter=Q(licenses__status=License.Status.TRIAL)),
        canceled_licenses=Count("licenses", filter=Q(licenses__status=License.Status.CANCELED)),
    )
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get("q")
        plan = self.request.query_params.get("plan")
        license_status = self.request.query_params.get("license_status")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(slug__icontains=q))
        if plan:
            qs = qs.filter(plan=plan)
        if license_status == "active":
            qs = qs.filter(active_licenses__gt=0)
        if license_status == "trial":
            qs = qs.filter(trial_licenses__gt=0)
        if license_status == "canceled":
            qs = qs.filter(canceled_licenses__gt=0)
        return qs


class AdminLicenseViewSet(viewsets.ModelViewSet):
    queryset = License.objects.select_related("tenant", "tool").all().order_by("-updated_at")
    serializer_class = LicenseSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ["get", "patch", "head", "options"]


class LicenseSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    tool_name = serializers.CharField(source="tool.name", read_only=True)

    class Meta:
        model = License
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "tool",
            "tool_name",
            "status",
            "plan",
            "starts_at",
            "expires_at",
            "metadata",
            "updated_at",
        ]


class TicketSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    tool_name = serializers.CharField(source="tool.name", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "tool",
            "tool_name",
            "subject",
            "description",
            "status",
            "priority",
            "created_at",
            "updated_at",
        ]


class CreditSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    tool_name = serializers.CharField(source="tool.name", read_only=True)

    class Meta:
        model = Credit
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "license",
            "tool",
            "tool_name",
            "amount",
            "currency",
            "reason",
            "status",
            "created_at",
            "updated_at",
        ]


class AdminMetricsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    def _effective_price(self, lic: License) -> Decimal:
        price = lic.tool.price_monthly or Decimal("0.00")
        code = lic.metadata.get("coupon_code") if isinstance(lic.metadata, dict) else None
        tool = lic.tool
        if (
            code
            and tool.coupon_code
            and code == tool.coupon_code
            and (not tool.coupon_usage_limit or (tool.coupon_usage_count or 0) < tool.coupon_usage_limit)
        ):
            discount = price * (tool.coupon_percent_off or Decimal("0.00")) / 100
            price = max(Decimal("0.00"), price - discount)
        return price

    def list(self, request):
        from_date = request.query_params.get("from")
        to_date = request.query_params.get("to")
        active_licenses = License.objects.select_related("tool").filter(status=License.Status.ACTIVE)
        pending_licenses = License.objects.select_related("tool").filter(status=License.Status.PENDING)
        mrr = sum(self._effective_price(lic) for lic in active_licenses)
        pending = sum(self._effective_price(lic) for lic in pending_licenses)
        coupons = 0  # TODO: wire real coupons/discounts
        demo_clicks = MarketplaceLead.objects.count()
        widget_uses = WidgetLead.objects.count()
        # Revenue trend by month
        revenue_series = (
            License.objects.filter(status=License.Status.ACTIVE)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(value=Sum("tool__price_monthly"))
            .order_by("month")
        )
        revenue_series_list = [
            {"month": r["month"].strftime("%Y-%m") if r["month"] else "", "value": float(r["value"] or 0)}
            for r in revenue_series
        ]
        # Usage series last 7 days
        today = now().date()
        demo_series = []
        widget_series = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            demo_qs = MarketplaceLead.objects.filter(created_at__date=day)
            widget_qs = WidgetLead.objects.filter(created_at__date=day)
            if from_date:
                demo_qs = demo_qs.filter(created_at__date__gte=from_date)
                widget_qs = widget_qs.filter(created_at__date__gte=from_date)
            if to_date:
                demo_qs = demo_qs.filter(created_at__date__lte=to_date)
                widget_qs = widget_qs.filter(created_at__date__lte=to_date)
            demo_series.append({"date": day.isoformat(), "count": demo_qs.count()})
            widget_series.append({"date": day.isoformat(), "count": widget_qs.count()})
        top_tools = (
            WidgetLead.objects.values("tool__slug")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )
        return Response(
            {
                "mrr": mrr,
                "pending": pending,
                "coupons": coupons,
                "demo_clicks": demo_clicks,
                "widget_uses": widget_uses,
                "revenue_series": revenue_series_list,
                "demo_series": demo_series,
                "widget_series": widget_series,
                "top_tools": [{"slug": t["tool__slug"], "count": t["count"]} for t in top_tools],
            }
        )


class AdminTicketsViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.select_related("tenant", "tool").all().order_by("-updated_at")
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        tenant = self.request.query_params.get("tenant")
        tool = self.request.query_params.get("tool")
        if status_param:
            qs = qs.filter(status=status_param)
        if tenant:
            qs = qs.filter(tenant_id=tenant)
        if tool:
            qs = qs.filter(tool_id=tool)
        return qs
