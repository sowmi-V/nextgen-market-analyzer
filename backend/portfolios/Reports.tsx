import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
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

// Matches the REAL analysis JSON produced by POST /api/portfolios/analyze/
// and stored as-is by POST /api/analysis/history/.
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
    return new Date(isoString).toLocaleString();
  } catch {
    return isoString;
  }
};

const formatCurrencyValue = (value: number | undefined, currency: string) => {
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
    return "text-green-600 bg-green-50";
  }

  if (normalized.includes("medium") || normalized.includes("moderate")) {
    return "text-yellow-600 bg-yellow-50";
  }

  if (normalized.includes("high")) {
    return "text-red-600 bg-red-50";
  }

  return "text-gray-600 bg-gray-50";
};

// Builds a self-contained, printable HTML report from a saved record.
// No new dependency (jsPDF etc.) - browsers can "Print to PDF" this directly,
// and it downloads as a real file via Blob.
const buildReportHtml = (record: HistoryRecord) => {
  const analysis = record.analysis ?? {};
  const overview = analysis.portfolioOverview ?? {};
  const holdings = analysis.holdingConcentration?.holdings ?? [];
  const sectors = analysis.sectorDiversification?.sectors ?? [];
  const recommendations = analysis.recommendations ?? [];

  const holdingRows = holdings
    .map(
      (item) =>
        `<tr><td>${item.stock}</td><td style="text-align:right">${item.weight?.toFixed(
          2
        )}%</td><td style="text-align:right">${formatCurrencyValue(
          item.value,
          record.currency
        )}</td></tr>`
    )
    .join("");

  const sectorRows = sectors
    .map(
      (item) =>
        `<tr><td>${item.sector}</td><td style="text-align:right">${item.weight?.toFixed(
          2
        )}%</td><td style="text-align:right">${formatCurrencyValue(
          item.value,
          record.currency
        )}</td></tr>`
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
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; padding: 32px; }
  h1 { color: #1d4ed8; margin-bottom: 4px; }
  .meta { color: #6b7280; margin-bottom: 24px; font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
  .card .label { font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .card .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
  th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; }
  th { background: #f9fafb; text-transform: uppercase; font-size: 11px; color: #6b7280; }
  h2 { font-size: 16px; margin-top: 28px; }
  ul { padding-left: 20px; }
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
    <div class="card"><div class="label">Total Value</div><div class="value">${formatCurrencyValue(
      overview.portfolioValue,
      record.currency
    )}</div></div>
    <div class="card"><div class="label">Diversification</div><div class="value">${(
      analysis.diversificationScore ?? 0
    ).toFixed(2)}</div></div>
    <div class="card"><div class="label">Risk Level</div><div class="value">${
      analysis.riskLevel ?? "-"
    }</div></div>
    <div class="card"><div class="label">HHI</div><div class="value">${(
      overview.hhi ?? 0
    ).toFixed(4)}</div></div>
  </div>

  <h2>Holding Breakdown</h2>
  <table>
    <thead><tr><th>Stock</th><th style="text-align:right">Weight</th><th style="text-align:right">Value</th></tr></thead>
    <tbody>${holdingRows || '<tr><td colspan="3">No holdings recorded.</td></tr>'}</tbody>
  </table>

  <h2>Sector Breakdown</h2>
  <table>
    <thead><tr><th>Sector</th><th style="text-align:right">Weight</th><th style="text-align:right">Value</th></tr></thead>
    <tbody>${sectorRows || '<tr><td colspan="3">No sectors recorded.</td></tr>'}</tbody>
  </table>

  <h2>Recommendations</h2>
  <ul>${recommendationItems || "<li>No recommendations.</li>"}</ul>
</body>
</html>`;
};

const downloadFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
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

  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [generatedFor, setGeneratedFor] = useState<number | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/analysis/history/");
      const data = Array.isArray(response?.data) ? response.data : [];
      setRecords(data);
    } catch (requestError: any) {
      const statusCode = requestError?.response?.status;

      if (statusCode === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (statusCode === 404) {
        setError("The reports endpoint was not found. Check the Django URL configuration.");
      } else if (statusCode && statusCode >= 500) {
        setError("The backend encountered an error while loading reports.");
      } else {
        setError("Failed to load saved reports.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    if (records.length === 0) {
      return null;
    }

    // Most recent record (backend orders by -created_at already).
    const latest = records[0];
    const overview = latest.analysis?.portfolioOverview ?? {};

    return {
      totalValue: overview.portfolioValue ?? 0,
      currency: latest.currency,
      diversificationScore: latest.analysis?.diversificationScore ?? 0,
      riskLevel: latest.analysis?.riskLevel ?? "-",
      reportCount: records.length,
    };
  }, [records]);

  const handleGenerate = (record: HistoryRecord) => {
    setGeneratedFor(record.id);
  };

  const handleDownload = (record: HistoryRecord) => {
    const html = buildReportHtml(record);
    const safeName = `${record.portfolio_name || "portfolio"}-${record.client_id}`.replace(
      /[^a-z0-9-_]+/gi,
      "_"
    );

    downloadFile(`${safeName}-report.html`, html, "text/html");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>

            <p className="mt-2 text-gray-600">
              Review saved portfolio analyses generated by the backend.
            </p>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex items-center justify-center rounded-xl bg-white p-12 shadow-sm">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading reports...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* SUMMARY CARDS - derived from the most recent real saved report */}
            {summary ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Latest Portfolio Value</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {formatCurrencyValue(summary.totalValue, summary.currency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3">
                      <PieChart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Latest Diversification</p>
                      <p className="mt-2 text-2xl font-bold text-green-600">
                        {summary.diversificationScore.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Latest Risk Level</p>
                      <p
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-lg font-bold ${getRiskClass(
                          summary.riskLevel
                        )}`}
                      >
                        {summary.riskLevel}
                      </p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-3">
                      <ShieldCheck className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Saved Reports</p>
                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {summary.reportCount}
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              !error && (
                <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                  No saved reports yet. Run an analysis on the Portfolio Analyzer page to
                  generate one.
                </div>
              )
            )}

            {/* SAVED REPORTS TABLE */}
            {records.length > 0 && (
              <div className="mt-8 rounded-xl bg-white p-6 shadow-sm md:p-8">
                <h2 className="text-xl font-semibold text-gray-900">Saved Reports</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Actual portfolio analyses saved to the database.
                </p>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-sm text-gray-500">
                        <th className="pb-3">Portfolio</th>
                        <th className="pb-3">Client</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Diversification</th>
                        <th className="pb-3">Risk</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100">
                          <td className="py-4 font-semibold text-gray-900">
                            {record.portfolio_name}
                          </td>

                          <td className="py-4 text-gray-600">{record.client_id}</td>

                          <td className="py-4 text-gray-600">
                            {formatDate(record.created_at)}
                          </td>

                          <td className="py-4 text-gray-600">
                            {(record.analysis?.diversificationScore ?? 0).toFixed(2)}
                          </td>

                          <td className="py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getRiskClass(
                                record.analysis?.riskLevel
                              )}`}
                            >
                              {record.analysis?.riskLevel ?? "-"}
                            </span>
                          </td>

                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(record)}
                                className="font-semibold text-blue-600 hover:text-blue-700"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() => handleGenerate(record)}
                                className="font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Generate
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownload(record)}
                                disabled={generatedFor !== record.id}
                                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-300"
                                title={
                                  generatedFor !== record.id
                                    ? "Click Generate first"
                                    : "Download report"
                                }
                              >
                                <Download size={14} />
                                Download
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* VIEW MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl md:p-8">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedRecord.portfolio_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedRecord.client_id} · {selectedRecord.currency} ·{" "}
                  {formatDate(selectedRecord.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Total Value</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatCurrencyValue(
                    selectedRecord.analysis?.portfolioOverview?.portfolioValue,
                    selectedRecord.currency
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Diversification</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {(selectedRecord.analysis?.diversificationScore ?? 0).toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">HHI</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {(selectedRecord.analysis?.portfolioOverview?.hhi ?? 0).toFixed(4)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Risk</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-1 text-sm font-semibold ${getRiskClass(
                    selectedRecord.analysis?.riskLevel
                  )}`}
                >
                  {selectedRecord.analysis?.riskLevel ?? "-"}
                </span>
              </div>
            </div>

            {(selectedRecord.analysis?.holdingConcentration?.holdings?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 font-semibold text-gray-900">Holding Breakdown</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="grid grid-cols-[1fr_100px_140px] bg-gray-50 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                    <span>Stock</span>
                    <span className="text-right">Weight</span>
                    <span className="text-right">Value</span>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {selectedRecord.analysis!.holdingConcentration!.holdings!.map(
                      (item, index) => (
                        <div
                          key={`${item.stock}-${index}`}
                          className="grid grid-cols-[1fr_100px_140px] px-4 py-2 text-sm"
                        >
                          <span className="font-medium text-gray-900">{item.stock}</span>
                          <span className="text-right text-gray-700">
                            {item.weight.toFixed(2)}%
                          </span>
                          <span className="text-right text-gray-700">
                            {formatCurrencyValue(item.value, selectedRecord.currency)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {(selectedRecord.analysis?.sectorDiversification?.sectors?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 font-semibold text-gray-900">Sector Breakdown</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="grid grid-cols-[1fr_100px_140px] bg-gray-50 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                    <span>Sector</span>
                    <span className="text-right">Weight</span>
                    <span className="text-right">Value</span>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {selectedRecord.analysis!.sectorDiversification!.sectors!.map(
                      (item, index) => (
                        <div
                          key={`${item.sector}-${index}`}
                          className="grid grid-cols-[1fr_100px_140px] px-4 py-2 text-sm"
                        >
                          <span className="font-medium text-gray-900">{item.sector}</span>
                          <span className="text-right text-gray-700">
                            {item.weight.toFixed(2)}%
                          </span>
                          <span className="text-right text-gray-700">
                            {formatCurrencyValue(item.value, selectedRecord.currency)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {(selectedRecord.analysis?.recommendations?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 font-semibold text-gray-900">Recommendations</h3>
                <ul className="space-y-2">
                  {selectedRecord.analysis!.recommendations!.map((item) => (
                    <li
                      key={item.priority}
                      className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700"
                    >
                      {item.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleGenerate(selectedRecord)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => handleDownload(selectedRecord)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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
