from django.db import models
from stocks.models import Stock


class Portfolio(models.Model):
    name = models.CharField(max_length=200)

    # BNP Paribas fields
    client_id = models.CharField(max_length=100, blank=True)
    currency = models.CharField(max_length=10, default="INR")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.client_id:
            return f"{self.client_id} - {self.name}"
        return self.name


class PortfolioHolding(models.Model):
    """
    Legacy model.
    Kept temporarily so we don't break existing data.
    """

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="holdings"
    )

    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE
    )

    quantity = models.FloatField()
    purchase_price = models.FloatField()

    def __str__(self):
        return f"{self.portfolio.name} - {self.stock.symbol}"


class Fund(models.Model):
    """
    A fund inside a BNP client portfolio.
    """

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="funds"
    )

    fund_code = models.CharField(max_length=100)
    amount = models.FloatField()

    def __str__(self):
        return f"{self.portfolio.client_id} - {self.fund_code}"


class FundHolding(models.Model):
    """
    Stock allocation inside a fund.

    Example:
    0.30 = 30%
    0.50 = 50%
    """

    fund = models.ForeignKey(
        Fund,
        on_delete=models.CASCADE,
        related_name="fund_holdings"
    )

    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name="fund_holdings"
    )

    weight = models.FloatField()

    class Meta:
        unique_together = ("fund", "stock")

    def __str__(self):
        return f"{self.fund.fund_code} - {self.stock.symbol}"


class FundSector(models.Model):
    """
    Sector allocation inside a fund.

    Example:
    0.30 = 30%
    0.50 = 50%
    """

    fund = models.ForeignKey(
        Fund,
        on_delete=models.CASCADE,
        related_name="fund_sectors"
    )

    sector = models.CharField(max_length=150)
    weight = models.FloatField()

    class Meta:
        unique_together = ("fund", "sector")

    def __str__(self):
        return f"{self.fund.fund_code} - {self.sector}"