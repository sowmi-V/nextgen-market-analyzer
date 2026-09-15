from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Stock
from .serializers import StockSerializer


class StockEvaluateView(APIView):

    def post(self, request):
        serializer = StockSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        feedback = []
        score = 0
        evaluated = 0

        # P/E Ratio
        if data.get("pe_ratio") is not None:
            pe = data["pe_ratio"]
            evaluated += 1

            if pe < 15:
                score += 10
                feedback.append("P/E ratio is relatively attractive.")
            elif pe <= 25:
                score += 7
                feedback.append("P/E ratio is within a moderate range.")
            else:
                score += 4
                feedback.append("P/E ratio is relatively high.")

        # EPS
        if data.get("eps") is not None:
            eps = data["eps"]
            evaluated += 1

            if eps > 0:
                score += 10
                feedback.append("EPS is positive.")
            else:
                feedback.append("EPS is negative.")

        # Dividend Yield
        if data.get("dividend_yield") is not None:
            dividend = data["dividend_yield"]
            evaluated += 1

            if dividend >= 3:
                score += 10
                feedback.append("Dividend yield is strong.")
            elif dividend >= 1:
                score += 7
                feedback.append("Dividend yield is moderate.")
            else:
                score += 4
                feedback.append("Dividend yield is relatively low.")

        # Debt-to-Equity
        if data.get("debt_to_equity") is not None:
            de = data["debt_to_equity"]
            evaluated += 1

            if de < 1:
                score += 10
                feedback.append("Debt-to-equity indicates relatively low leverage.")
            elif de <= 2:
                score += 7
                feedback.append("Debt-to-equity indicates moderate leverage.")
            else:
                score += 4
                feedback.append("Debt-to-equity indicates relatively high leverage.")

        # ROE
        if data.get("roe") is not None:
            roe = data["roe"]
            evaluated += 1

            if roe >= 15:
                score += 10
                feedback.append("ROE indicates strong profitability.")
            elif roe >= 8:
                score += 7
                feedback.append("ROE indicates moderate profitability.")
            else:
                score += 4
                feedback.append("ROE is relatively weak.")

        # ROA
        if data.get("roa") is not None:
            roa = data["roa"]
            evaluated += 1

            if roa >= 10:
                score += 10
                feedback.append("ROA indicates strong asset efficiency.")
            elif roa >= 5:
                score += 7
                feedback.append("ROA indicates moderate asset efficiency.")
            else:
                score += 4
                feedback.append("ROA is relatively low.")

        # Current Ratio
        if data.get("current_ratio") is not None:
            current = data["current_ratio"]
            evaluated += 1

            if current >= 1.5:
                score += 10
                feedback.append("Current ratio indicates healthy liquidity.")
            elif current >= 1:
                score += 7
                feedback.append("Current ratio indicates acceptable liquidity.")
            else:
                score += 4
                feedback.append("Current ratio indicates potential liquidity pressure.")

        # Quick Ratio
        if data.get("quick_ratio") is not None:
            quick = data["quick_ratio"]
            evaluated += 1

            if quick >= 1:
                score += 10
                feedback.append("Quick ratio indicates good short-term liquidity.")
            elif quick >= 0.7:
                score += 7
                feedback.append("Quick ratio indicates moderate short-term liquidity.")
            else:
                score += 4
                feedback.append("Quick ratio indicates weaker short-term liquidity.")

        # Book Value per Share
        if data.get("book_value_per_share") is not None:
            book_value = data["book_value_per_share"]
            evaluated += 1

            if book_value > 0:
                score += 10
                feedback.append("Book value per share is positive.")
            else:
                feedback.append("Book value per share is negative.")

        # Overall score
        if evaluated > 0:
            overall_score = round((score / (evaluated * 10)) * 100, 2)
        else:
            overall_score = 0

        # Risk
        if overall_score >= 75:
            risk_level = "Low"
            recommendation = "Positive"
        elif overall_score >= 50:
            risk_level = "Moderate"
            recommendation = "Hold / Monitor"
        else:
            risk_level = "High"
            recommendation = "Caution"

        summary = (
            f"{data['company_name']} ({data['symbol'].upper()}) "
            f"received an overall financial score of {overall_score}/100. "
            f"Risk level: {risk_level}. "
            f"Recommendation: {recommendation}."
        )

        # Save stock
        stock, created = Stock.objects.update_or_create(
            symbol=data["symbol"].upper(),
            defaults=data,
        )

        return Response(
            {
                "success": True,
                "stock": StockSerializer(stock).data,
                "analysis": {
                    "overall_score": overall_score,
                    "risk_level": risk_level,
                    "recommendation": recommendation,
                    "feedback": feedback,
                    "summary": summary,
                },
            },
            status=status.HTTP_201_CREATED,
        )