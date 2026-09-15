from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PortfolioAnalysisHistory
from .serializers import PortfolioAnalysisHistorySerializer


class PortfolioAnalysisHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = PortfolioAnalysisHistory.objects.filter(
            user=request.user
        )

        serializer = PortfolioAnalysisHistorySerializer(
            history,
            many=True
        )

        return Response(serializer.data)


    def post(self, request):
        client_id = request.data.get("client_id")
        portfolio_name = request.data.get("portfolio_name")
        currency = request.data.get("currency", "INR")
        analysis = request.data.get("analysis")

        if not client_id:
            return Response(
                {"error": "client_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not portfolio_name:
            return Response(
                {"error": "portfolio_name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not analysis:
            return Response(
                {"error": "analysis is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        history = PortfolioAnalysisHistory.objects.create(
            user=request.user,
            client_id=client_id,
            portfolio_name=portfolio_name,
            currency=currency,
            analysis=analysis,
        )

        serializer = PortfolioAnalysisHistorySerializer(history)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )