from __future__ import annotations

from rest_framework import permissions, serializers, status, views
from rest_framework.response import Response

from marketplace.models import Tool
from pricing.models import MaterialSetting


class MaterialSettingSerializer(serializers.ModelSerializer):
    tool = serializers.SlugRelatedField(
        slug_field="slug", queryset=Tool.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = MaterialSetting
        fields = ["id", "tool", "name", "material_rate", "labor_rate"]


class MaterialSettingBulkView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return Response({"detail": "Tenant not resolved"}, status=status.HTTP_400_BAD_REQUEST)
        tool_slug = request.query_params.get("tool")
        qs = MaterialSetting.objects.filter(tenant=tenant)
        if tool_slug:
            qs = qs.filter(tool__slug=tool_slug)
        serializer = MaterialSettingSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        tenant = getattr(request, "tenant", None)
        if tenant is None:
            return Response({"detail": "Tenant not resolved"}, status=status.HTTP_400_BAD_REQUEST)
        materials = request.data.get("materials", [])
        tool_slug = request.data.get("tool")
        tool = None
        if tool_slug:
            tool = Tool.objects.filter(slug=tool_slug).first()

        # Replace existing for this tenant/tool
        MaterialSetting.objects.filter(tenant=tenant, tool=tool).delete()
        serializer = MaterialSettingSerializer(data=materials, many=True)
        serializer.is_valid(raise_exception=True)
        objs = []
        for item in serializer.validated_data:
            objs.append(MaterialSetting(tenant=tenant, tool=tool, **item))
        MaterialSetting.objects.bulk_create(objs)
        return Response(MaterialSettingSerializer(objs, many=True).data, status=status.HTTP_201_CREATED)
