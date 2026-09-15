from itertools import combinations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .dataset import load_client_portfolios


class PortfolioDatasetView(APIView):
    """Unchanged - still serves the static demo/reference dataset."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        result = load_client_portfolios()

        if not result.get("valid"):
            return Response(
                {"error": result.get("error")},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            result["data"],
            status=status.HTTP_200_OK,
        )


class PortfolioAnalyzeView(APIView):
    """
    Analyzes the portfolio the client actually submits in the request body.

    Expected input JSON:
    {
        "clientId": "C101",
        "portfolioName": "My Portfolio",
        "currency": "INR",
        "funds": [
            {
                "fundCode": "FUND_A",
                "amount": 1000000,
                "holdings": {
                    "INFY": 0.30,
                    "HDFCBANK": 0.50,
                    "ITC": 0.20
                },
                "sectors": {
                    "IT": 0.30,
                    "Banking": 0.50,
                    "FMCG": 0.20
                }
            }
        ]
    }

    Holdings/sectors weights are fractions of THAT fund and must
    sum to approximately 1.0.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        client_id = request.data.get("clientId")
        currency = request.data.get("currency", "INR")
        funds = request.data.get("funds")

        if not client_id:
            return Response(
                {"error": "clientId is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not funds or not isinstance(funds, list):
            return Response(
                {"error": "funds must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validation_error = self.validate_funds(funds)

        if validation_error:
            return Response(
                {"error": validation_error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client = {
            "clientId": client_id,
            "currency": currency,
            "funds": funds,
        }

        try:
            analysis = self.analyze_portfolio(client)

        except ValueError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "clientId": client_id,
                "currency": currency,
                "analysis": analysis,
            },
            status=status.HTTP_200_OK,
        )

    # ---------------------------------------------------------------
    # VALIDATION
    # ---------------------------------------------------------------

    def validate_funds(self, funds):
        seen_codes = set()

        for index, fund in enumerate(funds):
            fund_number = index + 1

            if not isinstance(fund, dict):
                return f"Fund {fund_number} is invalid."

            fund_code = fund.get("fundCode")

            if not fund_code or not str(fund_code).strip():
                return f"Fund {fund_number}: fundCode is required."

            fund_code = str(fund_code).strip().upper()

            if fund_code in seen_codes:
                return f"Duplicate fundCode '{fund_code}'."

            seen_codes.add(fund_code)

            try:
                amount = float(fund.get("amount", 0))
            except (TypeError, ValueError):
                return f"Fund {fund_number}: amount must be a number."

            if amount <= 0:
                return f"Fund {fund_number}: amount must be greater than zero."

            holdings = fund.get("holdings")

            if not isinstance(holdings, dict) or not holdings:
                return (
                    f"Fund {fund_number}: holdings must be "
                    "a non-empty object."
                )

            holdings_error, holdings_total = self._validate_weight_map(
                holdings,
                fund_number,
                "holding",
            )

            if holdings_error:
                return holdings_error

            if abs(holdings_total - 1.0) > 0.01:
                return (
                    f"Fund {fund_number}: holding weights must sum to 1.0 "
                    f"(got {holdings_total:.4f})."
                )

            sectors = fund.get("sectors")

            if not isinstance(sectors, dict) or not sectors:
                return (
                    f"Fund {fund_number}: sectors must be "
                    "a non-empty object."
                )

            sectors_error, sectors_total = self._validate_weight_map(
                sectors,
                fund_number,
                "sector",
            )

            if sectors_error:
                return sectors_error

            if abs(sectors_total - 1.0) > 0.01:
                return (
                    f"Fund {fund_number}: sector weights must sum to 1.0 "
                    f"(got {sectors_total:.4f})."
                )

        return None

    def _validate_weight_map(self, weight_map, fund_number, label):
        total = 0.0

        for key, weight in weight_map.items():
            try:
                weight = float(weight)

            except (TypeError, ValueError):
                return (
                    f"Fund {fund_number}: {label} weight for "
                    f"'{key}' must be a number.",
                    total,
                )

            if weight <= 0 or weight > 1:
                return (
                    f"Fund {fund_number}: {label} weight for "
                    f"'{key}' must be between 0 and 1 "
                    "(fraction, not percent).",
                    total,
                )

            total += weight

        return None, total

    # ---------------------------------------------------------------
    # ANALYSIS
    # ---------------------------------------------------------------

    def analyze_portfolio(self, client):
        funds = client.get("funds", [])

        if not funds:
            raise ValueError(
                "Client portfolio contains no funds."
            )

        # ---------------------------------------------------------
        # PORTFOLIO VALUE
        # ---------------------------------------------------------

        portfolio_value = sum(
            float(fund.get("amount", 0))
            for fund in funds
        )

        if portfolio_value <= 0:
            raise ValueError(
                "Portfolio value must be greater than zero."
            )

        # ---------------------------------------------------------
        # FUND WEIGHTS
        # ---------------------------------------------------------

        fund_weights = {}

        for fund in funds:
            fund_code = fund.get("fundCode")
            amount = float(fund.get("amount", 0))

            fund_weights[fund_code] = (
                amount / portfolio_value
            )

        # ---------------------------------------------------------
        # HOLDING AGGREGATION
        # ---------------------------------------------------------

        portfolio_holdings = {}

        for fund in funds:
            fund_code = fund.get("fundCode")

            fund_weight = fund_weights.get(
                fund_code,
                0,
            )

            holdings = fund.get(
                "holdings",
                {},
            )

            for stock, allocation in holdings.items():
                allocation = float(allocation)

                portfolio_holdings[stock] = (
                    portfolio_holdings.get(stock, 0)
                    + fund_weight * allocation
                )

        # ---------------------------------------------------------
        # SECTOR AGGREGATION
        # ---------------------------------------------------------

        portfolio_sectors = {}

        for fund in funds:
            fund_code = fund.get("fundCode")

            fund_weight = fund_weights.get(
                fund_code,
                0,
            )

            sectors = fund.get(
                "sectors",
                {},
            )

            for sector, allocation in sectors.items():

                if not isinstance(sector, str):
                    continue

                sector = sector.strip()

                if not sector:
                    continue

                try:
                    allocation = float(allocation)

                except (TypeError, ValueError):
                    continue

                portfolio_sectors[sector] = (
                    portfolio_sectors.get(sector, 0)
                    + fund_weight * allocation
                )

        # ---------------------------------------------------------
        # FUND OVERLAP
        # ---------------------------------------------------------

        overlap_results = []

        for fund_a, fund_b in combinations(
            funds,
            2,
        ):
            holdings_a = fund_a.get(
                "holdings",
                {},
            )

            holdings_b = fund_b.get(
                "holdings",
                {},
            )

            common_stocks = (
                set(holdings_a.keys())
                & set(holdings_b.keys())
            )

            overlap = sum(
                min(
                    float(holdings_a[stock]),
                    float(holdings_b[stock]),
                )
                for stock in common_stocks
            )

            overlap_results.append(
                {
                    "fundA": fund_a.get("fundCode"),
                    "fundB": fund_b.get("fundCode"),
                    "overlap": round(
                        overlap * 100,
                        2,
                    ),
                }
            )

        if overlap_results:
            average_overlap = (
                sum(
                    item["overlap"]
                    for item in overlap_results
                )
                / len(overlap_results)
            )

        else:
            average_overlap = 0

        overlap_score = max(
            0,
            min(
                100,
                100 - average_overlap,
            ),
        )

        # ---------------------------------------------------------
        # HOLDING HHI
        # ---------------------------------------------------------

        holding_hhi = sum(
            weight ** 2
            for weight in portfolio_holdings.values()
        )

        holding_count = len(
            portfolio_holdings
        )

        if holding_count > 1:
            minimum_hhi = 1 / holding_count

        else:
            minimum_hhi = 1

        if holding_count > 1:
            normalized_hhi = (
                (holding_hhi - minimum_hhi)
                / (1 - minimum_hhi)
            )

        else:
            normalized_hhi = 1

        normalized_hhi = max(
            0,
            min(
                1,
                normalized_hhi,
            ),
        )

        holding_diversification_score = (
            100 * (1 - normalized_hhi)
        )

        # ---------------------------------------------------------
        # SECTOR HHI
        # ---------------------------------------------------------

        sector_hhi = sum(
            weight ** 2
            for weight in portfolio_sectors.values()
        )

        sector_count = len(
            portfolio_sectors
        )

        if sector_count > 1:
            minimum_sector_hhi = (
                1 / sector_count
            )

        else:
            minimum_sector_hhi = 1

        if sector_count > 1:
            normalized_sector_hhi = (
                (sector_hhi - minimum_sector_hhi)
                / (1 - minimum_sector_hhi)
            )

        else:
            normalized_sector_hhi = 1

        normalized_sector_hhi = max(
            0,
            min(
                1,
                normalized_sector_hhi,
            ),
        )

        sector_score = (
            100 * (1 - normalized_sector_hhi)
        )

        # ---------------------------------------------------------
        # DIVERSIFICATION SCORE
        # ---------------------------------------------------------

        diversification_score = (
            overlap_score * 0.35
            + holding_diversification_score * 0.30
            + sector_score * 0.35
        )

        diversification_score = max(
            0,
            min(
                100,
                diversification_score,
            ),
        )

        # ---------------------------------------------------------
        # RISK LEVEL
        # ---------------------------------------------------------

        if diversification_score >= 75:
            risk_level = "Low"

        elif diversification_score >= 50:
            risk_level = "Moderate"

        else:
            risk_level = "High"

        # ---------------------------------------------------------
        # HOLDING DETAILS
        # ---------------------------------------------------------

        holding_details = []

        for stock, weight in sorted(
            portfolio_holdings.items(),
            key=lambda item: item[1],
            reverse=True,
        ):
            holding_details.append(
                {
                    "stock": stock,
                    "weight": round(
                        weight * 100,
                        2,
                    ),
                    "value": round(
                        portfolio_value * weight,
                        2,
                    ),
                }
            )

        # ---------------------------------------------------------
        # SECTOR DETAILS
        # ---------------------------------------------------------

        sector_details = []

        for sector, weight in sorted(
            portfolio_sectors.items(),
            key=lambda item: item[1],
            reverse=True,
        ):
            sector_details.append(
                {
                    "sector": sector,
                    "weight": round(
                        weight * 100,
                        2,
                    ),
                    "value": round(
                        portfolio_value * weight,
                        2,
                    ),
                }
            )

        # ---------------------------------------------------------
        # RECOMMENDATIONS
        # ---------------------------------------------------------

        recommendations = []

        if average_overlap >= 50:
            recommendations.append(
                "Fund overlap is high. Consider reducing "
                "exposure to funds with similar underlying holdings."
            )

        elif average_overlap >= 25:
            recommendations.append(
                "Moderate fund overlap detected. Review "
                "common holdings across the underlying funds."
            )

        if holding_details:
            largest_holding = holding_details[0]

            if largest_holding["weight"] >= 30:
                recommendations.append(
                    f"{largest_holding['stock']} has a relatively "
                    f"high portfolio weight of "
                    f"{largest_holding['weight']:.1f}%."
                )

        if sector_hhi >= 0.25:
            recommendations.append(
                "Sector concentration is high based on HHI. "
                "Consider spreading exposure across additional sectors."
            )

        elif sector_hhi >= 0.18:
            recommendations.append(
                "Sector concentration is moderate. "
                "Review exposure to the largest sectors."
            )

        if not recommendations:
            recommendations.append(
                "The portfolio is reasonably diversified. "
                "Continue monitoring fund overlap and concentration."
            )

        # ---------------------------------------------------------
        # ESTIMATED PERFORMANCE
        # ---------------------------------------------------------
        #
        # These values are model-based estimates.
        # They are NOT historical market returns.
        #
        # This allows the application to expose the performance
        # structure requested by the problem statement without
        # falsely claiming that the portfolio actually earned
        # these returns.
        #

        if diversification_score >= 75:
            estimated_one_year = 10.0
            estimated_three_year = 32.0
            estimated_five_year = 55.0

        elif diversification_score >= 50:
            estimated_one_year = 7.0
            estimated_three_year = 22.0
            estimated_five_year = 40.0

        else:
            estimated_one_year = 3.0
            estimated_three_year = 10.0
            estimated_five_year = 20.0

        # ---------------------------------------------------------
        # TRADER TYPE
        # ---------------------------------------------------------

        if diversification_score >= 75:
            trader_type = "Conservative"

        elif diversification_score >= 50:
            trader_type = "Moderate"

        else:
            trader_type = "Aggressive"

        # ---------------------------------------------------------
        # PORTFOLIO SUMMARY
        # ---------------------------------------------------------

        portfolio_summary = (
            f"The portfolio has a diversification score of "
            f"{diversification_score:.2f}/100 and is classified as "
            f"{risk_level} risk. The portfolio is categorized as "
            f"{trader_type} based on its diversification and "
            f"concentration characteristics."
        )

        # ---------------------------------------------------------
        # FINAL RESPONSE
        # ---------------------------------------------------------

        return {
            "portfolioOverview": {
                "portfolioValue": round(
                    portfolio_value,
                    2,
                ),
                "funds": len(funds),
                "stocks": len(
                    portfolio_holdings
                ),
                "sectors": len(
                    portfolio_sectors
                ),
                "hhi": round(
                    holding_hhi,
                    4,
                ),
            },

            "diversificationScore": round(
                diversification_score,
                2,
            ),

            "riskLevel": risk_level,

            "performance": {
                "oneYear": estimated_one_year,
                "threeYear": estimated_three_year,
                "fiveYear": estimated_five_year,
                "type": "estimated",
            },

            "traderType": trader_type,

            "summary": portfolio_summary,

            "overlapScore": round(
                overlap_score,
                2,
            ),

            "sectorScore": round(
                sector_score,
                2,
            ),

            "fundOverlap": {
                "averageOverlap": round(
                    average_overlap,
                    2,
                ),
                "funds": overlap_results,
            },

            "sectorDiversification": {
                "sectorScore": round(
                    sector_score,
                    2,
                ),
                "hhi": round(
                    sector_hhi,
                    4,
                ),
                "sectors": sector_details,
            },

            "holdingConcentration": {
                "hhi": round(
                    holding_hhi,
                    4,
                ),
                "holdings": holding_details,
            },

            "recommendations": [
                {
                    "priority": index + 1,
                    "message": message,
                }
                for index, message in enumerate(
                    recommendations
                )
            ],
        }