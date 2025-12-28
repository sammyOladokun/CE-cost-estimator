from __future__ import annotations

import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Reusable timestamps for auditing."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Tenant(TimeStampedModel):
    class Plan(models.TextChoices):
        FREEMIUM = "freemium", "Freemium"
        STANDARD = "standard", "Standard"
        PRO = "pro", "Pro"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    domain = models.CharField(max_length=255, blank=True)
    plan = models.CharField(
        max_length=20, choices=Plan.choices, default=Plan.FREEMIUM, db_index=True
    )
    flutterwave_customer_id = models.CharField(max_length=255, blank=True)
    n8n_webhook_url = models.URLField(blank=True)
    leads_quota = models.PositiveIntegerField(default=3)
    brand_logo_url = models.URLField(blank=True)
    primary_color = models.CharField(max_length=16, default="#0A0F1A")
    secondary_color = models.CharField(max_length=16, default="#1F6BFF")
    widget_theme = models.CharField(
        max_length=16,
        choices=[("frosted", "Frosted Glass (Light)"), ("smoked", "Smoked Glass (Dark)")],
        default="frosted",
    )

    def __str__(self) -> str:  # pragma: no cover - repr convenience
        return f"{self.name} ({self.slug})"


class TenantScopedModel(TimeStampedModel):
    """Base class that enforces tenant scoping on all core tables."""

    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="%(class)ss"
    )

    class Meta:
        abstract = True
        indexes = [models.Index(fields=["tenant"])]
