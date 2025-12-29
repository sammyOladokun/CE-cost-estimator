from django.contrib import admin
from django.urls import path

from marketplace import api as marketplace_api
from accounts import api as accounts_api
from adminpanel import api as admin_api
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("api/admin/tools", admin_api.AdminToolViewSet, basename="admin-tools")
router.register("api/admin/tenants", admin_api.AdminTenantViewSet, basename="admin-tenants")
router.register("api/admin/metrics", admin_api.AdminMetricsViewSet, basename="admin-metrics")
router.register("api/admin/tickets", admin_api.AdminTicketsViewSet, basename="admin-tickets")

urlpatterns = [
    path("admin/", admin.site.urls),
    *router.urls,
    path("api/marketplace/tools", marketplace_api.ToolListView.as_view(), name="tool-list"),
    path("api/marketplace/tools/new", marketplace_api.ToolCreateView.as_view(), name="tool-create"),
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
    path("api/onboarding/start", marketplace_api.OnboardingStartView.as_view(), name="onboarding-start"),
    path("api/auth/login", accounts_api.LoginView.as_view(), name="auth-login"),
    path("api/auth/register", accounts_api.RegisterView.as_view(), name="auth-register"),
    path("api/auth/me", accounts_api.MeView.as_view(), name="auth-me"),
    path("api/auth/logout", accounts_api.LogoutView.as_view(), name="auth-logout"),
]
