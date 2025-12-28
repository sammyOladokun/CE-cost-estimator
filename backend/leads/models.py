from __future__ import annotations

import uuid

from django.db import models

from accounts.models import Contractor
from shared.tenant import TenantScopedModel


class Lead(TenantScopedModel):
    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        CLOSED_WON = "closed_won", "Closed Won"
        CLOSED_LOST = "closed_lost", "Closed Lost"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contractor = models.ForeignKey(
        Contractor, on_delete=models.CASCADE, related_name="leads"
    )
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=32)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=128, blank=True)
    state = models.CharField(max_length=64, blank=True)
    zip_code = models.CharField(max_length=16)
    roof_type = models.CharField(max_length=32, blank=True)
    pitch = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    base_area = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actual_area = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_good = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_better = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_best = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subscription_tier = models.CharField(max_length=20, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW, db_index=True
    )
    locked_for_quota = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Lead"
        verbose_name_plural = "Leads"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "created_at"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - repr convenience
        return f"{self.contact_name} ({self.zip_code})"
