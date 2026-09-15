import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  PieChart,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";

import api from "../../services/api";

type HoldingBreakdown = {
  stock: string;
  weight: number;
  value: number;
};

type SectorBreakdown = {
  sector: string;
  weight: number;
  value: number;
};

type Recommendation = {
  priority: number;
  message: string;
};

type StoredAnalysis = {
  portfolioOverview?: {
    portfolioValue?: number;
    funds?: number;
    stocks?: number;
    sectors?: number;
    hhi?: number;
  };
  diversificationScore?: number;
  overlapScore?: number;
  sectorScore?: number;
  riskLevel?: string;
  holdingConcentration?: {
    hhi?: number;
    holdings?: HoldingBreakdown[];
  };
  sectorDiversification?: {
    hhi?: number;
    sectors?: SectorBreakdown[];
  };
  recommendations?: Recommendation[];
};

type HistoryRecord = {
  id: number;
  client_id: string;
  portfolio_name: string;
  currency: string;
  analysis: StoredAnalysis;
  created_at: string;
};

const formatDate = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

const formatCurrencyValue = (
  value: number | undefined,
  currency: string
) => {
  if (!Number.isFinite(value)) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(value as number);
  } catch {
    return String(value);
  }
};

const getRiskClass = (riskLevel?: string) => {
  const normalized = (riskLevel ?? "").toLowerCase();

  if (normalized.includes("low")) {
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      dot: "bg-emerald-500",
    };
  }

  if (
    normalized.includes("medium") ||
    normalized.includes("moderate")
  ) {
    return {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      dot: "bg-amber-500",
    };
  }

  if (normalized.includes("high")) {
    return {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      dot: "bg-red-500",
    };
  }

  return {
    text: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };
};

const getScoreClass = (score: number) => {
  if (score >= 75) {
    return "text-emerald-600";
  }

  if (score >= 50) {
    return "text-amber-600";
  }

  return "text-red-600";
};

const buildReportHtml = (record: HistoryRecord) => {
  const analysis = record.analysis ?? {};
  const overview = analysis.portfolioOverview ?? {};
  const holdings = analysis.holdingConcentration?.holdings ?? [];
  const sectors = analysis.sectorDiversification?.sectors ?? [];
  const recommendations = analysis.recommendations ?? [];

  const holdingRows = holdings
    .map(
      (item) =>
        `<tr>
          <td>${item.stock}</td>
          <td style="text-align:right">${item.weight?.toFixed(2)}%</td>
          <td style="text-align:right">${formatCurrencyValue(
            item.value,
            record.currency
          )}</td>
        </tr>`
    )
    .join("");

  const sectorRows = sectors
    .map(
      (item) =>
        `<tr>
          <td>${item.sector}</td>
          <td style="text-align:right">${item.weight?.toFixed(2)}%</td>
          <td style="text-align:right">${formatCurrencyValue(
            item.value,
            record.currency
          )}</td>
        </tr>`
    )
    .join("");

  const recommendationItems = recommendations
    .map((item) => `<li>${item.message}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Portfolio Report - ${record.portfolio_name}</title>

<style>
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #334155;
    padding: 32px;
    line-height: 1.5;
  }

  h1 {
    color: #2563eb;
    margin-bottom: 4px;
  }

  .meta {
    color: #64748b;
    margin-bottom: 24px;
    font-size: 14px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px;
  }

  .card .label {
    font-size: 11px;
    text-transform: uppercase;
    color: #64748b;
  }

  .card .value {
    font-size: 20px;
    font-weight: 700;
    margin-top: 4px;
    color: #334155;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    font-size: 14px;
  }

  th,
  td {
    border-bottom: 1px solid #e2e8f0;
    padding: 9px;
    text-align: left;
  }

  th {
    background: #f8fafc;
    text-transform: uppercase;
    font-size: 11px;
    color: #64748b;
  }

  h2 {
    font-size: 16px;
    margin-top: 28px;
    color: #334155;
  }

  ul {
    padding-left: 20px;
  }
</style>
</head>

<body>

<h1>Portfolio Analysis Report</h1>

<div class="meta">
  Client ID: ${record.client_id} &nbsp;|&nbsp;
  Portfolio: ${record.portfolio_name} &nbsp;|&nbsp;
  Currency: ${record.currency} &nbsp;|&nbsp;
  Generated: ${formatDate(record.created_at)}
</div>

<div class="grid">

  <div class="card">
    <div class="label">Total Value</div>
    <div class="value">
      ${formatCurrencyValue(
        overview.portfolioValue,
        record.currency
      )}
    </div>
  </div>

  <div class="card">
    <div class="label">Diversification</div>
    <div class="value">
      ${(analysis.diversificationScore ?? 0).toFixed(2)}
    </div>
  </div>

  <div class="card">
    <div class="label">Risk Level</div>
    <div class="value">
      ${analysis.riskLevel ?? "-"}
    </div>
  </div>

  <div class="card">
    <div class="label">HHI</div>
    <div class="value">
      ${(overview.hhi ?? 0).toFixed(4)}
    </div>
  </div>

</div>

<h2>Holding Breakdown</h2>

<table>
  <thead>
    <tr>
      <th>Stock</th>
      <th style="text-align:right">Weight</th>
      <th style="text-align:right">Value</th>
    </tr>
  </thead>

  <tbody>
    ${
      holdingRows ||
      '<tr><td colspan="3">No holdings recorded.</td></tr>'
    }
  </tbody>
</table>

<h2>Sector Breakdown</h2>

<table>
  <thead>
    <tr>
      <th>Sector</th>
      <th style="text-align:right">Weight</th>
      <th style="text-align:right">Value</th>
    </tr>
  </thead>

  <tbody>
    ${
      sectorRows ||
      '<tr><td colspan="3">No sectors recorded.</td></tr>'
    }
  </tbody>
</table>

<h2>Recommendations</h2>

<ul>
  ${
    recommendationItems ||
    "<li>No recommendations.</li>"
  }
</ul>

</body>
</html>`;
};

const downloadFile = (
  filename: string,
  content: string,
  mimeType: string
) => {
  const blob = new Blob([content], {
    type: mimeType,
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();

  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};

function Reports() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRecord, setSelectedRecord] =
    useState<HistoryRecord | null>(null);

  const [generatedFor, setGeneratedFor] =
    useState<number | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/analysis/history/");

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      setRecords(data);
    } catch (requestError: any) {
      const statusCode = requestError?.response?.status;

      if (statusCode === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else if (statusCode === 404) {
        setError(
          "The reports endpoint was not found. Check the Django URL configuration."
        );
      } else if (statusCode && statusCode >= 500) {
        setError(
          "The backend encountered an error while loading reports."
        );
      } else {
        setError("Failed to load saved reports.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const summary = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    const latest = records[0];

    const overview =
      latest.analysis?.portfolioOverview ?? {};

    return {
      totalValue: overview.portfolioValue ?? 0,
      currency: latest.currency,
      diversificationScore:
        latest.analysis?.diversificationScore ?? 0,
      riskLevel:
        latest.analysis?.riskLevel ?? "-",
      reportCount: records.length,
    };
  }, [records]);

  const handleGenerate = (record: HistoryRecord) => {
    setGeneratedFor(record.id);
  };

  const handleDownload = (record: HistoryRecord) => {
    const html = buildReportHtml(record);

    const safeName = (
      `${record.portfolio_name || "portfolio"}-${record.client_id}`
    ).replace(/[^a-z0-9-_]+/gi, "_");

    downloadFile(
      `${safeName}-report.html`,
      html,
      "text/html"
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <div className="rounded-lg bg-blue-50 p-2">
                <FileText
                  size={18}
                  className="text-blue-600"
                />
              </div>

              <span className="text-sm font-medium text-blue-600">
                Portfolio Intelligence
              </span>

            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-700">
              Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review your saved portfolio analyses, monitor
              diversification, and generate detailed reports.
            </p>

          </div>

          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <RefreshCcw size={16} />
            )}

            Refresh
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">

            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <p>{error}</p>

          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="text-center">

              <Loader2
                size={28}
                className="mx-auto animate-spin text-blue-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading saved reports...
              </p>

            </div>

          </div>
        )}

        {!loading && (
          <>

            {/* EMPTY */}

            {!summary && !error && (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">

                  <FileText
                    size={25}
                    className="text-blue-600"
                  />

                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-700">
                  No reports yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Run a portfolio analysis first. Your saved
                  analysis reports will appear here automatically.
                </p>

              </div>
            )}

            {/* SUMMARY */}

            {summary && (
              <>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  {/* VALUE */}

                  <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-sm font-medium text-slate-500">
                          Latest Portfolio Value
                        </p>

                        <p className="mt-2 text-2xl font-bold text-slate-700">
                          {formatCurrencyValue(
                            summary.totalValue,
                            summary.currency
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl bg-blue-50 p-2.5">
                        <PieChart
                          size={20}
                          className="text-blue-600"
                        />
                      </div>

                    </div>

                    <p className="mt-4 text-xs text-slate-400">
                      Based on latest analysis
                    </p>

                  </div>

                  {/* DIVERSIFICATION */}

                  <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-sm font-medium text-slate-500">
                          Diversification
                        </p>

                        <p
                          className={`mt-2 text-2xl font-bold ${getScoreClass(
                            summary.diversificationScore
                          )}`}
                        >
                          {summary.diversificationScore.toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl bg-emerald-50 p-2.5">
                        <TrendingUp
                          size={20}
                          className="text-emerald-600"
                        />
                      </div>

                    </div>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.min(
                            summary.diversificationScore,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* RISK */}

                  <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-sm font-medium text-slate-500">
                          Latest Risk
                        </p>

                        <div
                          className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                            getRiskClass(
                              summary.riskLevel
                            ).bg
                          } ${
                            getRiskClass(
                              summary.riskLevel
                            ).border
                          } ${
                            getRiskClass(
                              summary.riskLevel
                            ).text
                          }`}
                        >

                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              getRiskClass(
                                summary.riskLevel
                              ).dot
                            }`}
                          />

                          {summary.riskLevel}

                        </div>

                      </div>

                      <div className="rounded-xl bg-amber-50 p-2.5">
                        <ShieldCheck
                          size={20}
                          className="text-amber-600"
                        />
                      </div>

                    </div>

                    <p className="mt-4 text-xs text-slate-400">
                      Current portfolio classification
                    </p>

                  </div>

                  {/* REPORT COUNT */}

                  <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">

                    <div className="flex items-start justify-between">

                      <div>

                        <p className="text-sm font-medium text-slate-500">
                          Saved Reports
                        </p>

                        <p className="mt-2 text-2xl font-bold text-slate-700">
                          {summary.reportCount}
                        </p>

                      </div>

                      <div className="rounded-xl bg-violet-50 p-2.5">
                        <FileText
                          size={20}
                          className="text-violet-600"
                        />
                      </div>

                    </div>

                    <p className="mt-4 text-xs text-slate-400">
                      Analyses stored in your account
                    </p>

                  </div>

                </div>

                {/* SAVED REPORTS */}

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="border-b border-slate-100 px-5 py-5 md:px-6">

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                      <div>

                        <h2 className="text-lg font-semibold text-slate-700">
                          Saved Reports
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Select a report to view its analysis
                          details.
                        </p>

                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">

                        <span className="h-2 w-2 rounded-full bg-blue-500" />

                        {records.length} saved{" "}
                        {records.length === 1
                          ? "report"
                          : "reports"}

                      </div>

                    </div>

                  </div>

                  <div className="divide-y divide-slate-100">

                    {records.map((record) => {
                      const score =
                        record.analysis
                          ?.diversificationScore ?? 0;

                      const risk =
                        record.analysis?.riskLevel ?? "-";

                      const riskStyle =
                        getRiskClass(risk);

                      const isGenerated =
                        generatedFor === record.id;

                      return (
                        <div
                          key={record.id}
                          className="group px-5 py-5 transition hover:bg-slate-50 md:px-6"
                        >

                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                            {/* REPORT INFO */}

                            <div className="flex min-w-0 items-start gap-4">

                              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 transition group-hover:bg-blue-100">

                                <FileText
                                  size={20}
                                  className="text-blue-600"
                                />

                              </div>

                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h3 className="truncate font-semibold text-slate-700">
                                    {record.portfolio_name}
                                  </h3>

                                  {record === records[0] && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                                      Latest
                                    </span>
                                  )}

                                </div>

                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">

                                  <span>
                                    Client{" "}
                                    {record.client_id}
                                  </span>

                                  <span className="hidden sm:inline">
                                    •
                                  </span>

                                  <span>
                                    {formatDate(
                                      record.created_at
                                    )}
                                  </span>

                                </div>

                              </div>

                            </div>

                            {/* METRICS */}

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:items-center">

                              <div className="min-w-[120px] rounded-lg bg-slate-50 px-3 py-2">

                                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                  Score
                                </p>

                                <p
                                  className={`mt-1 text-sm font-semibold ${getScoreClass(
                                    score
                                  )}`}
                                >
                                  {score.toFixed(2)}
                                </p>

                              </div>

                              <div className="min-w-[120px] rounded-lg bg-slate-50 px-3 py-2">

                                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                  Risk
                                </p>

                                <span
                                  className={`mt-1 inline-flex items-center gap-1.5 text-sm font-medium ${riskStyle.text}`}
                                >

                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${riskStyle.dot}`}
                                  />

                                  {risk}

                                </span>

                              </div>

                              <div className="flex items-center justify-start gap-2 sm:col-span-1 lg:ml-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedRecord(
                                      record
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  View

                                  <ArrowUpRight
                                    size={14}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleGenerate(record)
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    isGenerated
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  }`}
                                >

                                  {isGenerated ? (
                                    <>
                                      <CheckCircle2
                                        size={15}
                                      />
                                      Ready
                                    </>
                                  ) : (
                                    <>
                                      <FileText
                                        size={15}
                                      />
                                      Generate
                                    </>
                                  )}

                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownload(record)
                                  }
                                  disabled={!isGenerated}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
                                >
                                  <Download size={15} />
                                  Download
                                </button>

                              </div>

                            </div>

                          </div>

                        </div>
                      );
                    })}

                  </div>

                </div>

              </>
            )}

          </>
        )}

      </div>

      {/* VIEW MODAL */}

      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[2px]"
          onClick={() => setSelectedRecord(null)}
        >

          <div
            className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 md:px-7">

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <div className="rounded-lg bg-blue-50 p-2">
                    <FileText
                      size={18}
                      className="text-blue-600"
                    />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Portfolio Report
                  </span>

                </div>

                <h2 className="mt-3 truncate text-xl font-semibold text-slate-700">
                  {selectedRecord.portfolio_name}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Client {selectedRecord.client_id}{" "}
                  · {selectedRecord.currency} ·{" "}
                  {formatDate(
                    selectedRecord.created_at
                  )}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRecord(null)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="max-h-[calc(88vh-150px)] overflow-y-auto px-5 py-6 md:px-7">

              {/* METRICS */}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Total Value
                  </p>

                  <p className="mt-2 text-lg font-semibold text-slate-700">
                    {formatCurrencyValue(
                      selectedRecord.analysis
                        ?.portfolioOverview
                        ?.portfolioValue,
                      selectedRecord.currency
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Diversification
                  </p>

                  <p
                    className={`mt-2 text-lg font-semibold ${getScoreClass(
                      selectedRecord.analysis
                        ?.diversificationScore ?? 0
                    )}`}
                  >
                    {(
                      selectedRecord.analysis
                        ?.diversificationScore ?? 0
                    ).toFixed(2)}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    HHI
                  </p>

                  <p className="mt-2 text-lg font-semibold text-slate-700">
                    {(
                      selectedRecord.analysis
                        ?.portfolioOverview
                        ?.hhi ?? 0
                    ).toFixed(4)}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Risk
                  </p>

                  <div
                    className={`mt-2 inline-flex items-center gap-2 text-sm font-semibold ${
                      getRiskClass(
                        selectedRecord.analysis
                          ?.riskLevel
                      ).text
                    }`}
                  >

                    <span
                      className={`h-2 w-2 rounded-full ${
                        getRiskClass(
                          selectedRecord.analysis
                            ?.riskLevel
                        ).dot
                      }`}
                    />

                    {selectedRecord.analysis
                      ?.riskLevel ?? "-"}

                  </div>

                </div>

              </div>

              {/* PORTFOLIO STATS */}

              <div className="mt-6 grid grid-cols-3 gap-3">

                <div className="rounded-xl border border-slate-200 p-4">

                  <p className="text-xs text-slate-400">
                    Funds
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-700">
                    {selectedRecord.analysis
                      ?.portfolioOverview
                      ?.funds ?? 0}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 p-4">

                  <p className="text-xs text-slate-400">
                    Stocks
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-700">
                    {selectedRecord.analysis
                      ?.portfolioOverview
                      ?.stocks ?? 0}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-200 p-4">

                  <p className="text-xs text-slate-400">
                    Sectors
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-700">
                    {selectedRecord.analysis
                      ?.portfolioOverview
                      ?.sectors ?? 0}
                  </p>

                </div>

              </div>

              {/* HOLDINGS */}

              {(selectedRecord.analysis
                ?.holdingConcentration?.holdings
                ?.length ?? 0) > 0 && (

                <div className="mt-7">

                  <div className="mb-3">

                    <h3 className="font-semibold text-slate-700">
                      Holding Breakdown
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Distribution across individual stocks.
                    </p>

                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">

                    <div className="grid grid-cols-[1fr_100px_140px] bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                      <span>Stock</span>

                      <span className="text-right">
                        Weight
                      </span>

                      <span className="text-right">
                        Value
                      </span>

                    </div>

                    <div className="divide-y divide-slate-100">

                      {selectedRecord.analysis!.holdingConcentration!.holdings!.map(
                        (item, index) => (
                          <div
                            key={`${item.stock}-${index}`}
                            className="grid grid-cols-[1fr_100px_140px] px-4 py-3 text-sm transition hover:bg-slate-50"
                          >

                            <span className="font-medium text-slate-600">
                              {item.stock}
                            </span>

                            <span className="text-right text-slate-500">
                              {item.weight.toFixed(2)}%
                            </span>

                            <span className="text-right text-slate-500">
                              {formatCurrencyValue(
                                item.value,
                                selectedRecord.currency
                              )}
                            </span>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                </div>
              )}

              {/* SECTORS */}

              {(selectedRecord.analysis
                ?.sectorDiversification?.sectors
                ?.length ?? 0) > 0 && (

                <div className="mt-7">

                  <div className="mb-3">

                    <h3 className="font-semibold text-slate-700">
                      Sector Breakdown
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Distribution across portfolio sectors.
                    </p>

                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">

                    <div className="grid grid-cols-[1fr_100px_140px] bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                      <span>Sector</span>

                      <span className="text-right">
                        Weight
                      </span>

                      <span className="text-right">
                        Value
                      </span>

                    </div>

                    <div className="divide-y divide-slate-100">

                      {selectedRecord.analysis!.sectorDiversification!.sectors!.map(
                        (item, index) => (
                          <div
                            key={`${item.sector}-${index}`}
                            className="grid grid-cols-[1fr_100px_140px] px-4 py-3 text-sm transition hover:bg-slate-50"
                          >

                            <span className="font-medium text-slate-600">
                              {item.sector}
                            </span>

                            <span className="text-right text-slate-500">
                              {item.weight.toFixed(2)}%
                            </span>

                            <span className="text-right text-slate-500">
                              {formatCurrencyValue(
                                item.value,
                                selectedRecord.currency
                              )}
                            </span>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                </div>
              )}

              {/* RECOMMENDATIONS */}

              {(selectedRecord.analysis
                ?.recommendations?.length ?? 0) > 0 && (

                <div className="mt-7">

                  <h3 className="font-semibold text-slate-700">
                    Recommendations
                  </h3>

                  <div className="mt-3 space-y-2">

                    {selectedRecord.analysis!.recommendations!.map(
                      (item) => (
                        <div
                          key={item.priority}
                          className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4"
                        >

                          <div className="mt-0.5 shrink-0">
                            <AlertCircle
                              size={17}
                              className="text-blue-600"
                            />
                          </div>

                          <p className="text-sm leading-6 text-slate-600">
                            {item.message}
                          </p>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end md:px-7">

              <button
                type="button"
                onClick={() =>
                  setSelectedRecord(null)
                }
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() =>
                  handleGenerate(selectedRecord)
                }
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  generatedFor === selectedRecord.id
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >

                {generatedFor === selectedRecord.id ? (
                  <>
                    <CheckCircle2 size={16} />
                    Report Ready
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Generate Report
                  </>
                )}

              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownload(selectedRecord)
                }
                disabled={
                  generatedFor !== selectedRecord.id
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Download size={16} />
                Download
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Reports;