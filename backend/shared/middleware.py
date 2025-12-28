from __future__ import annotations

from typing import Optional

from django.http import HttpRequest

from shared.tenant import Tenant


def resolve_tenant(request: HttpRequest) -> Optional[Tenant]:
    """
    Resolve the current tenant from Host header or X-Tenant-ID.
    Keep lightweight to avoid DB churn; used across API and widget embed.
    """
    host = request.get_host().split(":")[0] if request.get_host() else ""
    header_tenant_id = request.headers.get("X-Tenant-ID")

    tenant: Optional[Tenant] = None
    if host:
        tenant = Tenant.objects.filter(domain__iexact=host).first()
    if tenant is None and header_tenant_id:
        tenant = Tenant.objects.filter(id=header_tenant_id).first()
    return tenant


class TenantResolverMiddleware:
    """
    Attaches request.tenant for downstream views/permissions.
    Falls back to None when no match to keep public marketplace accessible.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        request.tenant = resolve_tenant(request)
        return self.get_response(request)
