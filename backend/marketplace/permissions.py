from __future__ import annotations

from typing import Optional

from rest_framework.permissions import BasePermission

from marketplace.models import License


class HasActiveLicense(BasePermission):
    """
    Enforces active license for tool-specific endpoints.
    Honors sandbox=true for preview flows without blocking.
    """

    message = "An active license is required for this tool."

    def has_permission(self, request, view) -> bool:
        if request.query_params.get("sandbox") == "true":
            return True

        tenant = getattr(request, "tenant", None)
        tool_slug: Optional[str] = (
            getattr(view, "tool_slug", None)
            or request.query_params.get("tool")
            or request.data.get("tool")
        )
        if not tenant or not tool_slug:
            return False

        return License.objects.filter(
            tenant=tenant, tool__slug=tool_slug, status=License.Status.ACTIVE
        ).exists()
