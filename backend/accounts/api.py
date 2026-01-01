from __future__ import annotations

from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Contractor
from shared.tenant import Tenant


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    tenant_name = serializers.CharField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []

    @csrf_exempt
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = authenticate(request, email=data["email"], password=data["password"])
        if user is None:
            return Response({"detail": "Invalid email or password", "status": "error"}, status=status.HTTP_400_BAD_REQUEST)
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "status": "success",
                "message": "Login successful",
                "email": user.email,
                "full_name": user.full_name,
                "tenant_id": str(user.tenant_id),
                "is_superuser": user.is_superuser,
                "token": token.key,
            }
        )


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []

    @csrf_exempt
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        tenant, _ = Tenant.objects.get_or_create(
            slug=data["tenant_name"].lower().replace(" ", "-"),
            defaults={"name": data["tenant_name"]},
        )
        user = Contractor.objects.create_user(
            email=data["email"],
            password=data["password"],
            full_name=data["full_name"],
            tenant=tenant,
        )
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "email": user.email,
                "full_name": user.full_name,
                "tenant_id": str(user.tenant_id),
                "is_superuser": user.is_superuser,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user: Contractor = request.user
        return Response(
            {
                "email": user.email,
                "full_name": user.full_name,
                "tenant_id": str(user.tenant_id),
                "is_superuser": user.is_superuser,
            }
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
