from django.urls import path

from .views import PortfolioAnalysisHistoryView


urlpatterns = [
    path(
        "history/",
        PortfolioAnalysisHistoryView.as_view(),
        name="portfolio-analysis-history",
    ),
]
