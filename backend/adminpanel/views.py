from __future__ import annotations

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView


class MediaUploadView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)
        path = default_storage.save(f"tool_media/{file_obj.name}", ContentFile(file_obj.read()))
        return Response({"url": default_storage.url(path)}, status=status.HTTP_201_CREATED)
