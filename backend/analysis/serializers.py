from rest_framework import serializers

from .models import PortfolioAnalysisHistory


class PortfolioAnalysisHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioAnalysisHistory
        fields = [
            "id",
            "client_id",
            "portfolio_name",
            "currency",
            "analysis",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]