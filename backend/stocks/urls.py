from django.urls import path
from .views import StockEvaluateView

urlpatterns = [
    path("evaluate/", StockEvaluateView.as_view(), name="stock-evaluate"),
]