from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    CustomTokenObtainPairView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    UserProfileDetailView,
    UserProfileView,
    UserPreferencesView,
    logout_view,
)

urlpatterns = [
    # Authentication
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # User
    path('auth/me/', UserProfileView.as_view(), name='user_profile'),
    path('auth/me/profile/', UserProfileDetailView.as_view(), name='user_profile_detail'),
    path('auth/me/preferences/', UserPreferencesView.as_view(), name='user_preferences'),
]
