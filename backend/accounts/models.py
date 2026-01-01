from __future__ import annotations

import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from shared.tenant import Tenant, TenantScopedModel


class ContractorManager(BaseUserManager):
    """Manager for the custom Contractor user model."""

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("The email address must be set")
        email = self.normalize_email(email)
        tenant = extra_fields.get("tenant")
        is_superuser = bool(extra_fields.get("is_superuser"))
        if tenant is None and not is_superuser:
            raise ValueError("tenant is required for Contractor users")
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True or extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_staff=True and is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class Contractor(TenantScopedModel, AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        MANAGER = "manager", "Manager"
        ESTIMATOR = "estimator", "Estimator"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.OWNER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="contractors", null=True, blank=True)

    objects = ContractorManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        verbose_name = "Contractor"
        verbose_name_plural = "Contractors"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["tenant", "email"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - repr convenience
        return self.email
