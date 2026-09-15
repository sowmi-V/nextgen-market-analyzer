from django.db import models
from django.contrib.auth.models import User


class PortfolioAnalysisHistory(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="portfolio_analysis_history"
    )
    client_id = models.CharField(max_length=100)
    portfolio_name = models.CharField(max_length=200)
    currency = models.CharField(max_length=10, default="INR")
    analysis = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.portfolio_name} - {self.client_id}"