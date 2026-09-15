from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentication
    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "api/auth/",
        include("accounts.urls"),
    ),

    # Stock APIs
    path(
        "api/stocks/",
        include("stocks.urls"),
    ),

    # Portfolio APIs
    path(
        "api/portfolios/",
        include("portfolios.urls"),
    ),

    # Analysis / Reports APIs
    path(
        "api/analysis/",
        include("analysis.urls"),
    ),
]