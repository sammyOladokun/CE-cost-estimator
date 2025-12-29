from __future__ import annotations

import uuid

from django.db import models

from accounts.models import Contractor
from marketplace.models import Tool
from shared.tenant import TenantScopedModel


class MaterialRate(TenantScopedModel):
    """Stores contractor-specific shingle pricing for Good/Better/Best tiers."""

    class Tier(models.TextChoices):
        GOOD = "good", "Good"
        BETTER = "better", "Better"
        BEST = "best", "Best"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contractor = models.ForeignKey(
        Contractor, on_delete=models.CASCADE, related_name="material_rates"
    )
    tier = models.CharField(max_length=12, choices=Tier.choices)
    price_per_sqft = models.DecimalField(max_digits=8, decimal_places=2)
    zip_code = models.CharField(max_length=16, blank=True)
    sourced_via = models.CharField(max_length=32, default="manual")

    class Meta:
        verbose_name = "Material Rate"
        verbose_name_plural = "Material Rates"
        unique_together = ("tenant", "contractor", "tier", "zip_code")
        indexes = [
            models.Index(fields=["tenant", "tier"]),
            models.Index(fields=["tenant", "zip_code"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - repr convenience
        return f"{self.contractor.email} {self.tier} @ {self.price_per_sqft}"


class MaterialSetting(TenantScopedModel):
    """Tenant-specific material + labor rates per tool."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tool = models.ForeignKey(Tool, null=True, blank=True, on_delete=models.SET_NULL, related_name="material_settings")
    name = models.CharField(max_length=128)
    material_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    labor_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Material Setting"
        verbose_name_plural = "Material Settings"
        unique_together = ("tenant", "tool", "name")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.name}: material {self.material_rate} labor {self.labor_rate}"
