from django.contrib import admin
from django.urls import path

from marketplace import api as marketplace_api
from accounts import api as accounts_api

urlpatterns = [
    path("admin/", admin.site.urls),
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
