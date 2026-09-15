from django.db import models


class Stock(models.Model):
    symbol = models.CharField(max_length=20, unique=True)
    company_name = models.CharField(max_length=200)
    sector = models.CharField(max_length=100, blank=True)
    industry = models.CharField(max_length=150, blank=True)

    pe_ratio = models.FloatField(null=True, blank=True)
    eps = models.FloatField(null=True, blank=True)
    dividend_yield = models.FloatField(null=True, blank=True)
    market_cap = models.FloatField(null=True, blank=True)
    debt_to_equity = models.FloatField(null=True, blank=True)
    roe = models.FloatField(null=True, blank=True)
    roa = models.FloatField(null=True, blank=True)
    current_ratio = models.FloatField(null=True, blank=True)
    quick_ratio = models.FloatField(null=True, blank=True)
    book_value_per_share = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.symbol