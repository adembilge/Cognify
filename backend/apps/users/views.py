from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = UserSerializer.Meta.model.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer
