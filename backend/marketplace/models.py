from __future__ import annotations

import uuid
from decimal import Decimal

from django.db import models

from shared.tenant import Tenant, TenantScopedModel, TimeStampedModel


class Tool(TimeStampedModel):
    """Catalog entry for marketplace tools."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    icon_url = models.URLField(blank=True)
    media_url = models.URLField(
        blank=True, help_text="Looping mp4/gif for hero section previews"
    )
    price_monthly = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    config_schema = models.JSONField(default=dict, blank=True)
    bento_features = models.JSONField(
        default=list,
        blank=True,
        help_text="List of feature cards for bento layout; shape: [{title, copy, icon}]",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Tool"
        verbose_name_plural = "Tools"

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class License(TenantScopedModel):
    """Tenant's subscription to a given tool."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CANCELED = "canceled", "Canceled"
        EXPIRED = "expired", "Expired"
        TRIAL = "trial", "Trial"
        PENDING = "pending", "Pending"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name="licenses")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.TRIAL, db_index=True
    )
    plan = models.CharField(max_length=32, default="standard")
    seats = models.PositiveIntegerField(default=1)
    starts_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "License"
        verbose_name_plural = "Licenses"
        unique_together = ("tenant", "tool")
        indexes = [
            models.Index(fields=["tenant", "status"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.tenant} → {self.tool} ({self.status})"


class WidgetConfig(TenantScopedModel):
    """Per-tenant theming for the embeddable widget."""

    class Theme(models.TextChoices):
        FROSTED = "frosted", "Frosted Glass (Light)"
        SMOKED = "smoked", "Smoked Glass (Dark)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    primary_color = models.CharField(max_length=16, default="#0A0F1A")
    secondary_color = models.CharField(max_length=16, default="#1F6BFF")
    theme = models.CharField(
        max_length=16, choices=Theme.choices, default=Theme.FROSTED
    )
    logo_url = models.URLField(blank=True)
    mark_text = models.CharField(
        max_length=16, default="neX", help_text="Watermark shown in widget corner"
    )

    class Meta:
        verbose_name = "Widget Config"
        verbose_name_plural = "Widget Configs"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.tenant} widget config"


class MarketplaceLead(TimeStampedModel):
    """Global lead capture from the public landing/gated demo."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant, null=True, blank=True, on_delete=models.SET_NULL, related_name="marketplace_leads"
    )
    tool = models.ForeignKey(
        Tool, null=True, blank=True, on_delete=models.SET_NULL, related_name="leads"
    )
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True)
    address = models.CharField(max_length=255)
    source = models.CharField(max_length=64, default="landing")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Marketplace Lead"
        verbose_name_plural = "Marketplace Leads"
        indexes = [
            models.Index(fields=["email"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.full_name} ({self.email})"


class WidgetLead(TenantScopedModel):
    """Lead captured via the embedded widget for a tenant."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tool = models.ForeignKey(
        Tool, null=True, blank=True, on_delete=models.SET_NULL, related_name="widget_leads"
    )
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True)
    address = models.CharField(max_length=255)
    estimate_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    ground_area = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    pitch = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    actual_area = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    source_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "Widget Lead"
        verbose_name_plural = "Widget Leads"
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.full_name} ({self.email})"
