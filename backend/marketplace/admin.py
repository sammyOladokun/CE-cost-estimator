from django.contrib import admin

from marketplace.models import License, MarketplaceLead, Tool, WidgetConfig, WidgetLead


@admin.register(Tool)
class ToolAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "price_monthly", "is_active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    list_filter = ("is_active",)


@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = ("tenant", "tool", "status", "plan", "starts_at", "expires_at")
    list_filter = ("status", "plan")
    search_fields = ("tenant__name", "tool__name")


@admin.register(WidgetConfig)
class WidgetConfigAdmin(admin.ModelAdmin):
    list_display = ("tenant", "theme", "primary_color", "secondary_color")
    list_filter = ("theme",)


@admin.register(MarketplaceLead)
class MarketplaceLeadAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "tool", "source", "created_at")
    search_fields = ("full_name", "email", "address")
    list_filter = ("source",)


@admin.register(WidgetLead)
class WidgetLeadAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "tenant", "tool", "estimate_amount", "created_at")
    search_fields = ("full_name", "email", "address")
    list_filter = ("tenant", "tool")
