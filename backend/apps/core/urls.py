from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    CustomTokenObtainPairView,
    RegisterView,
    UserProfileDetailView,
    UserProfileView,
    UserPreferencesView,
    logout_view,
)

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_view, name='logout'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    # User
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('me/profile/', UserProfileDetailView.as_view(), name='user_profile_detail'),
    path('me/preferences/', UserPreferencesView.as_view(), name='user_preferences'),
]
