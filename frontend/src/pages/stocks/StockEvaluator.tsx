import { useState } from "react";
import api from "../../services/api";
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

type EvaluationResult = {
  overall_score: number;
  risk_level: string;
  recommendation: string;
  summary: string;
  feedback: string[];
};

function StockEvaluator() {
  const [form, setForm] = useState({
    symbol: "",
    company_name: "",
    sector: "",
    industry: "",
    pe_ratio: "",
    eps: "",
    dividend_yield: "",
    market_cap: "",
    debt_to_equity: "",
    roe: "",
    roa: "",
    current_ratio: "",
    quick_ratio: "",
    book_value_per_share: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const loadDemoValues = () => {
    setForm({
      symbol: "AAPL",
      company_name: "Apple Inc.",
      sector: "Technology",
      industry: "Consumer Electronics",
      pe_ratio: "29.5",
      eps: "6.42",
      dividend_yield: "0.45",
      market_cap: "3500000000000",
      debt_to_equity: "1.87",
      roe: "157.4",
      roa: "28.2",
      current_ratio: "0.98",
      quick_ratio: "0.94",
      book_value_per_share: "4.21",
    });

    setResult(null);
  };

  const clearAll = () => {
    setForm({
      symbol: "",
      company_name: "",
      sector: "",
      industry: "",
      pe_ratio: "",
      eps: "",
      dividend_yield: "",
      market_cap: "",
      debt_to_equity: "",
      roe: "",
      roa: "",
      current_ratio: "",
      quick_ratio: "",
      book_value_per_share: "",
    });

    setResult(null);
  };

  const handleEvaluate = async () => {
    if (!form.symbol.trim() || !form.company_name.trim()) {
      alert("Stock symbol and company name are required");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post("/stocks/evaluate/", {
        ...form,
        symbol: form.symbol.toUpperCase(),

        pe_ratio: form.pe_ratio
          ? Number(form.pe_ratio)
          : null,

        eps: form.eps
          ? Number(form.eps)
          : null,

        dividend_yield: form.dividend_yield
          ? Number(form.dividend_yield)
          : null,

        market_cap: form.market_cap
          ? Number(form.market_cap)
          : null,

        debt_to_equity: form.debt_to_equity
          ? Number(form.debt_to_equity)
          : null,

        roe: form.roe
          ? Number(form.roe)
          : null,

        roa: form.roa
          ? Number(form.roa)
          : null,

        current_ratio: form.current_ratio
          ? Number(form.current_ratio)
          : null,

        quick_ratio: form.quick_ratio
          ? Number(form.quick_ratio)
          : null,

        book_value_per_share: form.book_value_per_share
          ? Number(form.book_value_per_share)
          : null,
      });

      setResult(response.data.analysis);
    } catch (error) {
      console.error(error);
      alert("Stock evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    ["pe_ratio", "P/E Ratio"],
    ["eps", "EPS"],
    ["dividend_yield", "Dividend Yield (%)"],
    ["market_cap", "Market Cap"],
    ["debt_to_equity", "Debt-to-Equity"],
    ["roe", "ROE (%)"],
    ["roa", "ROA (%)"],
    ["current_ratio", "Current Ratio"],
    ["quick_ratio", "Quick Ratio"],
    ["book_value_per_share", "Book Value / Share"],
  ];

  const score = result?.overall_score ?? 0;

  const getScoreColor = () => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBar = () => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getRiskStyle = () => {
    const risk = result?.risk_level?.toLowerCase();

    if (risk === "low") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (risk === "moderate") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                <BarChart3
                  size={20}
                  className="text-white"
                />
              </div>

              <div>
                <p className="text-sm font-bold tracking-wide text-gray-900">
                  NEXTGEN MARKET ANALYZER
                </p>

                <p className="mt-0.5 text-xs font-medium text-blue-600">
                  Financial Analysis Platform
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
              Stock Evaluator
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700 md:text-base">
              Evaluate a company's financial strength using key
              fundamental indicators and financial ratios.
            </p>
          </div>

          {/* Status */}
          <div className="flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-gray-700">
              Analysis Ready
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Company Header */}
          <div className="border-b border-gray-200 bg-white px-6 py-6 md:px-8">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <BarChart3
                      size={17}
                      className="text-blue-600"
                    />
                  </div>

                  <h2 className="text-lg font-bold text-gray-950">
                    Stock Information
                  </h2>
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Enter the company details before providing its
                  financial parameters.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={loadDemoValues}
                  className="group flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-md active:translate-y-0"
                >
                  <Sparkles
                    size={15}
                    className="transition-transform duration-200 group-hover:rotate-12"
                  />

                  Load Demo Values
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 active:translate-y-0"
                >
                  Clear All
                </button>

              </div>
            </div>
          </div>

          <div className="px-6 py-7 md:px-8">

            {/* Company Fields */}
            <div className="grid gap-6 md:grid-cols-2">

              <div className="group">
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Stock Symbol
                  <span className="ml-1 text-blue-600">*</span>
                </label>

                <input
                  name="symbol"
                  value={form.symbol}
                  onChange={handleChange}
                  placeholder="e.g. AAPL"
                  className="w-full rounded-lg border border-gray-300 bg-white p-3.5 text-sm font-medium text-gray-950 placeholder:text-gray-500 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Enter the company's stock ticker.
                </p>
              </div>

              <div className="group">
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Company Name
                  <span className="ml-1 text-blue-600">*</span>
                </label>

                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Apple Inc."
                  className="w-full rounded-lg border border-gray-300 bg-white p-3.5 text-sm font-medium text-gray-950 placeholder:text-gray-500 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Enter the full company name.
                </p>
              </div>

              <div className="group">
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Sector
                </label>

                <input
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  placeholder="e.g. Technology"
                  className="w-full rounded-lg border border-gray-300 bg-white p-3.5 text-sm font-medium text-gray-950 placeholder:text-gray-500 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="group">
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Industry
                </label>

                <input
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="e.g. Consumer Electronics"
                  className="w-full rounded-lg border border-gray-300 bg-white p-3.5 text-sm font-medium text-gray-950 placeholder:text-gray-500 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

            </div>

            {/* Divider */}
            <div className="my-10 border-t border-gray-200" />

            {/* Financial Parameters */}
            <div className="mb-6">

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <TrendingUp
                    size={17}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-950">
                    Financial Parameters
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Enter the financial ratios used for evaluation.
                  </p>
                </div>
              </div>

            </div>

            {/* Financial Fields */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {fields.map(([name, label]) => (
                <div
                  key={name}
                  className="group"
                >
                  <label className="mb-2 block text-sm font-bold text-gray-800">
                    {label}
                  </label>

                  <input
                    type="number"
                    step="any"
                    name={name}
                    value={form[name as keyof typeof form]}
                    onChange={handleChange}
                    placeholder="Enter value"
                    className="w-full rounded-lg border border-gray-300 bg-white p-3.5 text-sm font-medium text-gray-950 placeholder:text-gray-500 outline-none transition duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              ))}

            </div>

            {/* Evaluate */}
            <div className="mt-9 flex justify-end border-t border-gray-200 pt-7">

              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="group flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >

                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <TrendingUp
                      size={17}
                      className="transition-transform duration-200 group-hover:-translate-y-0.5"
                    />
                    Evaluate Stock
                  </>
                )}

              </button>

            </div>

            {/* Result */}
            {result && (
              <div className="mt-10 border-t border-gray-200 pt-9">

                {/* Result Header */}
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <div className="flex items-center gap-2">

                      <CheckCircle2
                        size={21}
                        className="text-emerald-600"
                      />

                      <h2 className="text-2xl font-bold text-gray-950">
                        Evaluation Result
                      </h2>

                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      Financial assessment based on the parameters
                      provided.
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                    {form.symbol.toUpperCase()}
                  </div>

                </div>

                {/* Result Cards */}
                <div className="grid gap-5 md:grid-cols-3">

                  {/* Score */}
                  <div className="group rounded-xl border border-gray-200 bg-gray-50 p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-md">

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Overall Score
                    </p>

                    <div className="mt-3 flex items-baseline gap-1">

                      <p
                        className={`text-4xl font-bold ${getScoreColor()}`}
                      >
                        {result.overall_score}
                      </p>

                      <span className="text-lg font-medium text-gray-600">
                        /100
                      </span>

                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200">

                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getScoreBar()}`}
                        style={{
                          width: `${Math.min(
                            result.overall_score,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                    <p className="mt-3 text-xs font-medium text-gray-600">
                      Financial strength score
                    </p>

                  </div>

                  {/* Risk */}
                  <div className="group rounded-xl border border-gray-200 bg-gray-50 p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-md">

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Risk Level
                    </p>

                    <div className="mt-4 flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 transition duration-200 group-hover:scale-105">
                        <ShieldCheck
                          size={21}
                          className="text-blue-700"
                        />
                      </div>

                      <div>
                        <p className="text-xl font-bold text-gray-950">
                          {result.risk_level}
                        </p>

                        <p className="mt-0.5 text-xs font-medium text-gray-600">
                          Assessed risk profile
                        </p>
                      </div>

                    </div>

                    <div className="mt-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskStyle()}`}
                      >
                        {result.risk_level} Risk
                      </span>
                    </div>

                  </div>

                  {/* Recommendation */}
                  <div className="group rounded-xl border border-gray-200 bg-gray-50 p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-md">

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Recommendation
                    </p>

                    <p className="mt-4 text-2xl font-bold text-gray-950">
                      {result.recommendation}
                    </p>

                    <p className="mt-2 text-xs font-medium leading-5 text-gray-600">
                      Based on the overall financial assessment.
                    </p>

                  </div>

                </div>

                {/* Summary */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6 transition duration-200 hover:border-gray-300 hover:bg-white hover:shadow-sm">

                  <h3 className="text-lg font-bold text-gray-950">
                    Summary
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-700">
                    {result.summary}
                  </p>

                </div>

                {/* Financial Analysis */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-6">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                      <AlertCircle
                        size={18}
                        className="text-blue-700"
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-950">
                        Financial Analysis
                      </h3>

                      <p className="mt-0.5 text-xs font-medium text-gray-600">
                        Key observations from the evaluation
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 space-y-3">

                    {result.feedback.map((item, index) => (
                      <div
                        key={index}
                        className="group flex cursor-default gap-4 rounded-lg border border-gray-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                      >

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                          {index + 1}
                        </div>

                        <p className="text-sm font-medium leading-6 text-gray-700">
                          {item}
                        </p>

                      </div>
                    ))}

                  </div>

                </div>

              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-gray-600">
          <ShieldCheck size={13} />
          NextGen Market Analyzer · Fundamental stock analysis
        </div>

      </div>
    </div>
  );
}

export default StockEvaluator;