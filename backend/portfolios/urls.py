from django.urls import path

from .views import (
    PortfolioAnalyzeView,
    PortfolioDatasetView,
)

urlpatterns = [
    path(
        "analyze/",
        PortfolioAnalyzeView.as_view(),
        name="portfolio-analyze",
    ),

    path(
        "dataset/",
        PortfolioDatasetView.as_view(),
        name="portfolio-dataset",
    ),
]