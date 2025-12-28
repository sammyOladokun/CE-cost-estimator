from django.contrib import admin
from django.urls import path

from marketplace import api as marketplace_api

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/marketplace/tools", marketplace_api.ToolListView.as_view(), name="tool-list"),
    path(
        "api/marketplace/tools/<slug:slug>",
        marketplace_api.ToolDetailView.as_view(),
        name="tool-detail",
    ),
    path(
        "api/leads/marketplace",
        marketplace_api.MarketplaceLeadCreateView.as_view(),
        name="marketplace-lead-create",
    ),
    path(
        "api/leads/widget",
        marketplace_api.WidgetLeadCreateView.as_view(),
        name="widget-lead-create",
    ),
    path("api/widget/config", marketplace_api.WidgetConfigView.as_view(), name="widget-config"),
    path("api/license/check", marketplace_api.LicenseCheckView.as_view(), name="license-check"),
    path("api/pricing/estimate", marketplace_api.PricingEstimateView.as_view(), name="pricing-estimate"),
]
