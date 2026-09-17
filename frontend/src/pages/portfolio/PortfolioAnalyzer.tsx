import React, { useMemo, useState } from "react";
import {
AlertCircle,
BarChart3,
CheckCircle2,
ChevronDown,
ChevronUp,
FileText,
Loader2,
Plus,
RefreshCcw,
Trash2,
TrendingUp,
PieChart,
ShieldCheck,
Layers3,
} from "lucide-react";

import api from "../../services/api";

type Currency = "INR" | "USD" | "EUR" | "GBP" | "JPY";

type Holding = {
stock: string;
weight: string;
};

type Sector = {
sector: string;
weight: string;
};

type Fund = {
fundCode: string;
fundName: string;
amount: string;
holdings: Holding[];
sectors: Sector[];
};

type PortfolioPayload = {
clientId: string;
portfolioName: string;
currency: Currency;
funds: {
fundCode: string;
fundName: string;
amount: number;
holdings: Record<string, number>;
sectors: Record<string, number>;
}[];
};

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

type Performance = {
oneYear: number;
threeYear: number;
fiveYear: number;
type: string;
};

type AnalysisResult = {
clientId: string;
portfolioName: string;
currency: string;

totalValue: number;
numberOfStocks: number;
numberOfFunds: number;
numberOfSectors: number;

diversificationScore: number;
overlapScore: number;
sectorScore: number;
hhi: number;

riskLevel: string;

largestHolding: {
stock: string;
weight: number;
};

largestSector: {
sector: string;
weight: number;
};

holdingBreakdown: HoldingBreakdown[];
sectorBreakdown: SectorBreakdown[];

recommendations: string[];

performance: Performance;
traderType: string;
summary: string;
};

const emptyFund = (): Fund => ({
fundCode: "",
fundName: "",
amount: "",
holdings: [
{
stock: "",
weight: "",
},
],
sectors: [
{
sector: "",
weight: "",
},
],
});

const DEMO_PORTFOLIO = {
clientId: "C101",
portfolioName: "Demo Balanced Portfolio",
currency: "INR" as Currency,

funds: [
{
fundCode: "FUND001",
fundName: "Demo Equity Fund",
amount: "1000000",

  holdings: [
    { stock: "RELIANCE", weight: "35" },
    { stock: "TCS", weight: "30" },
    { stock: "HDFCBANK", weight: "20" },
    { stock: "INFY", weight: "15" },
  ],

  sectors: [
    { sector: "Energy", weight: "35" },
    { sector: "Information Technology", weight: "45" },
    { sector: "Financial Services", weight: "20" },
  ],
},

{
  fundCode: "FUND002",
  fundName: "Demo Growth Fund",
  amount: "500000",

  holdings: [
    { stock: "ICICIBANK", weight: "30" },
    { stock: "BHARTIARTL", weight: "25" },
    { stock: "HINDUNILVR", weight: "20" },
    { stock: "LT", weight: "25" },
  ],

  sectors: [
    { sector: "Financial Services", weight: "30" },
    { sector: "Telecommunication", weight: "25" },
    { sector: "Consumer Goods", weight: "20" },
    { sector: "Industrials", weight: "25" },
  ],
},

],
};

const normalizeAnalysis = (
data: any
): Omit<AnalysisResult, "clientId" | "portfolioName" | "currency"> => {
const source = data ?? {};
const overview = source.portfolioOverview ?? {};

const holdings: any[] = Array.isArray(
source.holdingConcentration?.holdings
)
? source.holdingConcentration.holdings
: [];

const sectors: any[] = Array.isArray(
source.sectorDiversification?.sectors
)
? source.sectorDiversification.sectors
: [];

const recommendationsSource: any[] = Array.isArray(
source.recommendations
)
? source.recommendations
: [];

const topHolding = holdings[0];
const topSector = sectors[0];

return {
totalValue: Number(overview.portfolioValue ?? 0),
numberOfStocks: Number(overview.stocks ?? 0),
numberOfFunds: Number(overview.funds ?? 0),
numberOfSectors: Number(overview.sectors ?? 0),

diversificationScore: Number(
  source.diversificationScore ?? 0
),

overlapScore: Number(source.overlapScore ?? 0),

sectorScore: Number(source.sectorScore ?? 0),

hhi: Number(
  overview.hhi ??
    source.holdingConcentration?.hhi ??
    0
),

riskLevel: source.riskLevel ?? "Unknown",

largestHolding: {
  stock: topHolding?.stock ?? "-",
  weight: Number(topHolding?.weight ?? 0),
},

largestSector: {
  sector: topSector?.sector ?? "-",
  weight: Number(topSector?.weight ?? 0),
},

holdingBreakdown: holdings.map((item) => ({
  stock: item.stock ?? "",
  weight: Number(item.weight ?? 0),
  value: Number(item.value ?? 0),
})),

sectorBreakdown: sectors.map((item) => ({
  sector: item.sector ?? "",
  weight: Number(item.weight ?? 0),
  value: Number(item.value ?? 0),
})),

recommendations: recommendationsSource.map((item) =>
  typeof item === "string"
    ? item
    : String(item?.message ?? "")
),

performance: {
  oneYear: Number(source.performance?.oneYear ?? 0),
  threeYear: Number(
    source.performance?.threeYear ?? 0
  ),
  fiveYear: Number(
    source.performance?.fiveYear ?? 0
  ),
  type: source.performance?.type ?? "estimated",
},

traderType: source.traderType ?? "Unknown",

summary: source.summary ?? "",

};
};

const PortfolioAnalyzer: React.FC = () => {
const [clientId, setClientId] = useState("");
const [portfolioName, setPortfolioName] =
useState("");
const [currency, setCurrency] =
useState<Currency>("INR");

const [funds, setFunds] = useState<Fund[]>([
emptyFund(),
]);

const [expandedFunds, setExpandedFunds] =
useState<Record<number, boolean>>({
0: true,
});

const [activeSection, setActiveSection] =
useState<"portfolio" | "funds" | "results">(
"portfolio"
);

const [result, setResult] =
useState<AnalysisResult | null>(null);

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [successMessage, setSuccessMessage] =
useState("");

const [selectedMetric, setSelectedMetric] =
useState<string | null>(null);

const formatCurrency = (value: number) => {
if (!Number.isFinite(value)) {
return "-";
}

try {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
} catch {
  return value.toLocaleString("en-IN");
}

};

const toggleFund = (index: number) => {
setExpandedFunds((current) => ({
...current,
[index]: !current[index],
}));
};

const addFund = () => {
const newIndex = funds.length;

setFunds((current) => [
  ...current,
  emptyFund(),
]);

setExpandedFunds((current) => ({
  ...current,
  [newIndex]: true,
}));

};

const removeFund = (fundIndex: number) => {
if (funds.length === 1) {
return;
}

setFunds((current) =>
  current.filter((_, index) => index !== fundIndex)
);

};

const updateFund = (
fundIndex: number,
field: keyof Fund,
value: string
) => {
setFunds((current) =>
current.map((fund, index) =>
index === fundIndex
? {
...fund,
[field]: value,
}
: fund
)
);
};

const addHolding = (fundIndex: number) => {
setFunds((current) =>
current.map((fund, index) =>
index === fundIndex
? {
...fund,
holdings: [
...fund.holdings,
{
stock: "",
weight: "",
},
],
}
: fund
)
);
};

const removeHolding = (
fundIndex: number,
holdingIndex: number
) => {
setFunds((current) =>
current.map((fund, index) => {
if (index !== fundIndex) {
return fund;
}

    if (fund.holdings.length === 1) {
      return fund;
    }

    return {
      ...fund,
      holdings: fund.holdings.filter(
        (_, index) => index !== holdingIndex
      ),
    };
  })
);

};

const updateHolding = (
fundIndex: number,
holdingIndex: number,
field: keyof Holding,
value: string
) => {
setFunds((current) =>
current.map((fund, index) => {
if (index !== fundIndex) {
return fund;
}

    return {
      ...fund,

      holdings: fund.holdings.map(
        (holding, index) =>
          index === holdingIndex
            ? {
                ...holding,
                [field]: value,
              }
            : holding
      ),
    };
  })
);

};

const addSector = (fundIndex: number) => {
setFunds((current) =>
current.map((fund, index) =>
index === fundIndex
? {
...fund,

          sectors: [
            ...fund.sectors,
            {
              sector: "",
              weight: "",
            },
          ],
        }
      : fund
  )
);

};

const removeSector = (
fundIndex: number,
sectorIndex: number
) => {
setFunds((current) =>
current.map((fund, index) => {
if (index !== fundIndex) {
return fund;
}

    if (fund.sectors.length === 1) {
      return fund;
    }

    return {
      ...fund,

      sectors: fund.sectors.filter(
        (_, index) => index !== sectorIndex
      ),
    };
  })
);

};

const updateSector = (
fundIndex: number,
sectorIndex: number,
field: keyof Sector,
value: string
) => {
setFunds((current) =>
current.map((fund, index) => {
if (index !== fundIndex) {
return fund;
}

    return {
      ...fund,

      sectors: fund.sectors.map(
        (sector, index) =>
          index === sectorIndex
            ? {
                ...sector,
                [field]: value,
              }
            : sector
      ),
    };
  })
);

};

const loadDemoPortfolio = () => {
setClientId(DEMO_PORTFOLIO.clientId);
setPortfolioName(
DEMO_PORTFOLIO.portfolioName
);
setCurrency(DEMO_PORTFOLIO.currency);

setFunds(
  DEMO_PORTFOLIO.funds.map((fund) => ({
    fundCode: fund.fundCode,
    fundName: fund.fundName,
    amount: fund.amount,

    holdings: fund.holdings.map((holding) => ({
      ...holding,
    })),

    sectors: fund.sectors.map((sector) => ({
      ...sector,
    })),
  }))
);

setExpandedFunds({
  0: true,
  1: true,
});

setResult(null);
setError("");

setActiveSection("funds");

setSuccessMessage(
  "Demo portfolio loaded. Review the allocation and run the analysis."
);

};

const clearAll = () => {
setClientId("");
setPortfolioName("");
setCurrency("INR");

setFunds([emptyFund()]);

setExpandedFunds({
  0: true,
});

setResult(null);
setError("");
setSuccessMessage("");

setActiveSection("portfolio");
setSelectedMetric(null);

};

const validatePortfolio = (): string | null => {
if (!clientId.trim()) {
return "Client ID is required.";
}

if (!portfolioName.trim()) {
  return "Portfolio name is required.";
}

if (funds.length === 0) {
  return "At least one fund is required.";
}

const fundCodes = new Set<string>();

for (
  let fundIndex = 0;
  fundIndex < funds.length;
  fundIndex++
) {
  const fund = funds[fundIndex];

  const fundNumber = fundIndex + 1;

  const fundCode =
    fund.fundCode.trim().toUpperCase();

  if (!fundCode) {
    return `Fund ${fundNumber}: fund code is required.`;
  }

  if (fundCodes.has(fundCode)) {
    return `Duplicate fund code "${fundCode}" found.`;
  }

  fundCodes.add(fundCode);

  if (!fund.fundName.trim()) {
    return `Fund ${fundNumber}: fund name is required.`;
  }

  const amount = Number(fund.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return `Fund ${fundNumber}: amount must be greater than 0.`;
  }

  if (fund.holdings.length === 0) {
    return `Fund ${fundNumber}: at least one holding is required.`;
  }

  if (fund.sectors.length === 0) {
    return `Fund ${fundNumber}: at least one sector is required.`;
  }

  const holdingSymbols = new Set<string>();

  let holdingWeightTotal = 0;

  for (
    let holdingIndex = 0;
    holdingIndex < fund.holdings.length;
    holdingIndex++
  ) {
    const holding =
      fund.holdings[holdingIndex];

    const rowNumber = holdingIndex + 1;

    const symbol =
      holding.stock.trim().toUpperCase();

    if (!symbol) {
      return `Fund ${fundNumber}, Holding ${rowNumber}: stock symbol is required.`;
    }

    if (holdingSymbols.has(symbol)) {
      return `Fund ${fundNumber}: duplicate stock "${symbol}" found.`;
    }

    holdingSymbols.add(symbol);

    const weight = Number(holding.weight);

    if (
      !Number.isFinite(weight) ||
      weight <= 0 ||
      weight > 100
    ) {
      return `Fund ${fundNumber}, Holding ${rowNumber}: weight must be between 0 and 100.`;
    }

    holdingWeightTotal += weight;
  }

  if (
    Math.abs(holdingWeightTotal - 100) >
    0.0001
  ) {
    return `Fund ${fundNumber}: holding weights must total 100%. Current total: ${holdingWeightTotal.toFixed(
      2
    )}%.`;
  }

  const sectorNames = new Set<string>();

  let sectorWeightTotal = 0;

  for (
    let sectorIndex = 0;
    sectorIndex < fund.sectors.length;
    sectorIndex++
  ) {
    const sector =
      fund.sectors[sectorIndex];

    const rowNumber = sectorIndex + 1;

    const sectorName =
      sector.sector.trim().toLowerCase();

    if (!sectorName) {
      return `Fund ${fundNumber}, Sector ${rowNumber}: sector name is required.`;
    }

    if (sectorNames.has(sectorName)) {
      return `Fund ${fundNumber}: duplicate sector "${sector.sector.trim()}" found.`;
    }

    sectorNames.add(sectorName);

    const weight = Number(sector.weight);

    if (
      !Number.isFinite(weight) ||
      weight <= 0 ||
      weight > 100
    ) {
      return `Fund ${fundNumber}, Sector ${rowNumber}: weight must be between 0 and 100.`;
    }

    sectorWeightTotal += weight;
  }

  if (
    Math.abs(sectorWeightTotal - 100) >
    0.0001
  ) {
    return `Fund ${fundNumber}: sector weights must total 100%. Current total: ${sectorWeightTotal.toFixed(
      2
    )}%.`;
  }
}

return null;

};

const buildPayload = (): PortfolioPayload => ({
clientId: clientId.trim(),

portfolioName: portfolioName.trim(),

currency,

funds: funds.map((fund) => {
  const holdings: Record<string, number> =
    {};

  fund.holdings.forEach((holding) => {
    const symbol =
      holding.stock.trim().toUpperCase();

    holdings[symbol] =
      Number(holding.weight) / 100;
  });

  const sectors: Record<string, number> = {};

  fund.sectors.forEach((sector) => {
    const name = sector.sector.trim();

    sectors[name] =
      Number(sector.weight) / 100;
  });

  return {
    fundCode:
      fund.fundCode.trim().toUpperCase(),

    fundName: fund.fundName.trim(),

    amount: Number(fund.amount),

    holdings,

    sectors,
  };
}),

});

const handleAnalyze = async () => {
setError("");
setSuccessMessage("");

const validationError =
  validatePortfolio();

if (validationError) {
  setError(validationError);
  setActiveSection("funds");
  return;
}

const payload = buildPayload();

setLoading(true);

try {
  const response = await api.post(
    "/portfolios/analyze/",
    payload
  );

  const actualAnalysis =
    response?.data?.analysis;

  if (!actualAnalysis) {
    throw new Error(
      "The backend returned no analysis data."
    );
  }

  const normalized =
    normalizeAnalysis(actualAnalysis);

  setResult({
    clientId: payload.clientId,

    portfolioName:
      payload.portfolioName,

    currency: payload.currency,

    ...normalized,
  });

  setActiveSection("results");

  try {
    await api.post(
      "/analysis/history/",
      {
        client_id: payload.clientId,

        portfolio_name:
          payload.portfolioName,

        currency: payload.currency,

        analysis: actualAnalysis,
      }
    );

    setSuccessMessage(
      "Portfolio analyzed successfully and the report was saved."
    );
  } catch (historyError) {
    console.error(
      "Failed to save analysis history:",
      historyError
    );

    setSuccessMessage(
      "Analysis completed, but the report could not be saved."
    );
  }
} catch (requestError: any) {
  console.error(
    "Portfolio analysis failed:",
    requestError
  );

  const statusCode =
    requestError?.response?.status;

  if (statusCode === 400) {
    const backendError =
      requestError?.response?.data;

    if (typeof backendError === "string") {
      setError(backendError);
    } else if (backendError?.error) {
      setError(
        String(backendError.error)
      );
    } else if (backendError?.detail) {
      setError(
        String(backendError.detail)
      );
    } else {
      setError(
        "The backend rejected the portfolio data. Check the entered values."
      );
    }
  } else if (statusCode === 401) {
    setError(
      "Your session has expired. Please log in again."
    );
  } else if (statusCode === 404) {
    setError(
      "Portfolio analysis endpoint was not found. Check the Django URL configuration."
    );
  } else if (
    statusCode &&
    statusCode >= 500
  ) {
    setError(
      "The backend encountered an error while analyzing the portfolio."
    );
  } else {
    setError(
      requestError?.message ||
        "Portfolio analysis failed. Please try again."
    );
  }

  setActiveSection("funds");
} finally {
  setLoading(false);
}

};

const holdingWeightTotal = useMemo(() => {
return funds.reduce(
(fundTotal, fund) =>
fundTotal +
fund.holdings.reduce(
(total, holding) =>
total +
(Number(holding.weight) || 0),
0
),
0
);
}, [funds]);

const getAllocationStatus = (
value: number
) => {
if (Math.abs(value - 100) < 0.001) {
return {
text: "Complete",
className:
"text-emerald-700 bg-emerald-50 border-emerald-200",
bar:
"bg-emerald-500",
};
}

if (value > 100) {
  return {
    text: "Over 100%",
    className:
      "text-red-700 bg-red-50 border-red-200",
    bar:
      "bg-red-500",
  };
}

return {
  text: `${value.toFixed(1)}% allocated`,
  className:
    "text-amber-700 bg-amber-50 border-amber-200",
  bar:
    "bg-amber-500",
};

};



const getTraderTypeClass = (
traderType: string
) => {
const normalized =
traderType.toLowerCase();

if (
  normalized.includes("conservative")
) {
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

if (normalized.includes("moderate")) {
  return "bg-amber-50 text-amber-700 border-amber-200";
}

if (
  normalized.includes("aggressive")
) {
  return "bg-red-50 text-red-700 border-red-200";
}

return "bg-gray-100 text-gray-700 border-gray-200";

};

const inputClass =
"w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-sm font-medium text-gray-950 placeholder outline-none transition-all duration-150 hover focus focus focus";

return (
<div className="min-h-screen bg-gray-50 text-gray-950">
{/* PAGE HEADER */}
<div className="border-b border-gray-200 bg-white">
<div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
<div>
<div className="flex items-center gap-3">
<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
<BarChart3
                 size={22}
                 className="text-white"
               />
</div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-950">
                Portfolio Analyzer
              </h1>

              <p className="mt-1 text-sm font-medium text-gray-600">
                Analyze concentration,
                diversification and portfolio
                risk.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadDemoPortfolio}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 active:scale-[0.98]"
          >
            <RefreshCcw size={16} />
            Load Demo
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>

  <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
    {/* STEP NAVIGATION */}
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-3">
        {[
          {
            id: "portfolio",
            number: "01",
            title: "Portfolio",
            subtitle: "Basic details",
          },
          {
            id: "funds",
            number: "02",
            title: "Allocation",
            subtitle: "Funds & holdings",
          },
          {
            id: "results",
            number: "03",
            title: "Analysis",
            subtitle: "Risk & insights",
          },
        ].map((step, index) => {
          const active =
            activeSection ===
            step.id;

          const disabled =
            step.id === "results" &&
            !result;

          return (
            <button
              key={step.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                setActiveSection(
                  step.id as
                    | "portfolio"
                    | "funds"
                    | "results"
                )
              }
              className={`relative flex items-center gap-3 px-4 py-4 text-left transition ${
                active
                  ? "bg-blue-50"
                  : "bg-white hover:bg-gray-50"
              } ${
                disabled
                  ? "cursor-not-allowed opacity-40"
                  : ""
              } ${
                index !== 0
                  ? "border-l border-gray-200"
                  : ""
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {step.number}
              </div>

              <div className="hidden sm:block">
                <p
                  className={`text-sm font-extrabold ${
                    active
                      ? "text-blue-700"
                      : "text-gray-800"
                  }`}
                >
                  {step.title}
                </p>

                <p className="text-xs font-medium text-gray-500">
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>

    {/* MESSAGES */}
    {error && (
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
        <AlertCircle
          size={20}
          className="mt-0.5 shrink-0 text-red-600"
        />

        <div>
          <p className="text-sm font-extrabold text-red-800">
            Something needs attention
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-red-700">
            {error}
          </p>
        </div>
      </div>
    )}

    {successMessage && (
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <CheckCircle2
          size={20}
          className="mt-0.5 shrink-0 text-emerald-600"
        />

        <div>
          <p className="text-sm font-extrabold text-emerald-800">
            Done
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-emerald-700">
            {successMessage}
          </p>
        </div>
      </div>
    )}

    {/* PORTFOLIO SECTION */}
    {activeSection === "portfolio" && (
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <FileText
                size={18}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-gray-950">
                Portfolio Details
              </h2>

              <p className="mt-0.5 text-sm font-medium text-gray-600">
                Start by identifying the portfolio.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Client ID
              </label>

              <input
                value={clientId}
                onChange={(e) =>
                  setClientId(
                    e.target.value
                  )
                }
                placeholder="C101"
                className={inputClass}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Portfolio Name
              </label>

              <input
                value={portfolioName}
                onChange={(e) =>
                  setPortfolioName(
                    e.target.value
                  )
                }
                placeholder="Balanced Growth Portfolio"
                className={inputClass}
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                Currency
              </label>

              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(
                    e.target
                      .value as Currency
                  )
                }
                className={inputClass}
                disabled={loading}
              >
                <option value="INR">
                  INR - Indian Rupee
                </option>

                <option value="USD">
                  USD - US Dollar
                </option>

                <option value="EUR">
                  EUR - Euro
                </option>

                <option value="GBP">
                  GBP - British Pound
                </option>

                <option value="JPY">
                  JPY - Japanese Yen
                </option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "funds"
                )
              }
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
            >
              Continue to Allocation →
            </button>
          </div>
        </div>
      </section>
    )}

    {/* FUNDS SECTION */}
    {activeSection === "funds" && (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-950">
              Fund Allocation
            </h2>

            <p className="mt-1 text-sm font-medium text-gray-600">
              Build your portfolio fund by fund.
              Each fund must total 100%.
            </p>
          </div>

          <button
            type="button"
            onClick={addFund}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-[0.98]"
          >
            <Plus size={17} />
            Add Fund
          </button>
        </div>

        {/* FUND CARDS */}
        {funds.map((fund, fundIndex) => {
          const holdingTotal =
            fund.holdings.reduce(
              (total, item) =>
                total +
                (Number(item.weight) ||
                  0),
              0
            );

          const sectorTotal =
            fund.sectors.reduce(
              (total, item) =>
                total +
                (Number(item.weight) ||
                  0),
              0
            );

          const holdingStatus =
            getAllocationStatus(
              holdingTotal
            );

          const sectorStatus =
            getAllocationStatus(
              sectorTotal
            );

          const expanded =
            expandedFunds[fundIndex];

          return (
            <section
              key={`fund-${fundIndex}`}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                expanded
                  ? "border-blue-200 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* FUND TOP */}
              <div
                className={`flex cursor-pointer items-center justify-between px-5 py-4 transition ${
                  expanded
                    ? "bg-blue-50/50"
                    : "bg-white hover:bg-gray-50"
                }`}
                onClick={() =>
                  toggleFund(fundIndex)
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold ${
                      expanded
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {fundIndex + 1}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-gray-950">
                        {fund.fundName ||
                          `Fund ${
                            fundIndex +
                            1
                          }`}
                      </h3>

                      {fund.fundCode && (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-700">
                          {fund.fundCode}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600">
                      <span>
                        {fund.amount
                          ? formatCurrency(
                              Number(
                                fund.amount
                              )
                            )
                          : "Amount not set"}
                      </span>

                      <span className="text-gray-300">
                        •
                      </span>

                      <span
                        className={
                          holdingStatus.className
                        }
                      >
                        {holdingTotal.toFixed(
                          1
                        )}
                        % holdings
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {funds.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        removeFund(
                          fundIndex
                        );
                      }}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                      title="Remove fund"
                    >
                      <Trash2
                        size={17}
                      />
                    </button>
                  )}

                  <div className="rounded-lg bg-white p-2 text-gray-600 shadow-sm">
                    {expanded ? (
                      <ChevronUp
                        size={18}
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                      />
                    )}
                  </div>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-gray-200 p-5">
                  {/* FUND DETAILS */}
                  <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gray-700">
                        Fund Code
                      </label>

                      <input
                        value={
                          fund.fundCode
                        }
                        onChange={(e) =>
                          updateFund(
                            fundIndex,
                            "fundCode",
                            e.target
                              .value
                          )
                        }
                        placeholder="FUND001"
                        className={`${inputClass} uppercase`}
                        disabled={
                          loading
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gray-700">
                        Fund Name
                      </label>

                      <input
                        value={
                          fund.fundName
                        }
                        onChange={(e) =>
                          updateFund(
                            fundIndex,
                            "fundName",
                            e.target
                              .value
                          )
                        }
                        placeholder="Equity Growth Fund"
                        className={inputClass}
                        disabled={
                          loading
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-gray-700">
                        Fund Amount
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          fund.amount
                        }
                        onChange={(e) =>
                          updateFund(
                            fundIndex,
                            "amount",
                            e.target
                              .value
                          )
                        }
                        placeholder="1000000"
                        className={inputClass}
                        disabled={
                          loading
                        }
                      />
                    </div>
                  </div>

                  {/* HOLDINGS */}
                  <div className="mt-7">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100">
                            <Layers3
                              size={15}
                              className="text-blue-700"
                            />
                          </div>

                          <h4 className="text-sm font-extrabold text-gray-950">
                            Stock Holdings
                          </h4>
                        </div>

                        <p className="mt-1 text-xs font-medium text-gray-600">
                          Your stock allocation
                          should equal 100%.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${holdingStatus.className}`}
                        >
                          {holdingStatus.text}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            addHolding(
                              fundIndex
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100"
                        >
                          <Plus
                            size={14}
                          />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* HOLDING PROGRESS */}
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${holdingStatus.bar}`}
                        style={{
                          width: `${Math.min(
                            holdingTotal,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <div className="hidden grid-cols-[1fr_180px_50px] bg-gray-100 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-gray-700 sm:grid">
                        <span>
                          Stock Symbol
                        </span>
                        <span>
                          Weight
                        </span>
                        <span />
                      </div>

                      <div className="divide-y divide-gray-200">
                        {fund.holdings.map(
                          (
                            holding,
                            holdingIndex
                          ) => (
                            <div
                              key={`${fundIndex}-${holdingIndex}`}
                              className="grid grid-cols-1 gap-2 px-4 py-3 transition hover:bg-blue-50/40 sm:grid-cols-[1fr_180px_50px] sm:items-center"
                            >
                              <div>
                                <label className="mb-1 block text-[10px] font-extrabold uppercase text-gray-500 sm:hidden">
                                  Stock
                                </label>

                                <input
                                  value={
                                    holding.stock
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateHolding(
                                      fundIndex,
                                      holdingIndex,
                                      "stock",
                                      e.target
                                        .value
                                    )
                                  }
                                  placeholder="RELIANCE"
                                  className={`${inputClass} uppercase`}
                                  disabled={
                                    loading
                                  }
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-[10px] font-extrabold uppercase text-gray-500 sm:hidden">
                                  Weight %
                                </label>

                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={
                                      holding.weight
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateHolding(
                                        fundIndex,
                                        holdingIndex,
                                        "weight",
                                        e.target
                                          .value
                                      )
                                    }
                                    placeholder="25"
                                    className={`${inputClass} pr-9`}
                                    disabled={
                                      loading
                                    }
                                  />

                                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                                    %
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeHolding(
                                    fundIndex,
                                    holdingIndex
                                  )
                                }
                                disabled={
                                  fund.holdings
                                    .length ===
                                  1
                                }
                                className="absolute right-4 hidden rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 sm:static sm:block"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTORS */}
                  <div className="mt-8">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100">
                            <PieChart
                              size={15}
                              className="text-violet-700"
                            />
                          </div>

                          <h4 className="text-sm font-extrabold text-gray-950">
                            Sector Allocation
                          </h4>
                        </div>

                        <p className="mt-1 text-xs font-medium text-gray-600">
                          Distribute the fund across
                          sectors.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${sectorStatus.className}`}
                        >
                          {sectorStatus.text}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            addSector(
                              fundIndex
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700 transition hover:bg-violet-100"
                        >
                          <Plus
                            size={14}
                          />
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${sectorStatus.bar}`}
                        style={{
                          width: `${Math.min(
                            sectorTotal,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <div className="hidden grid-cols-[1fr_180px_50px] bg-gray-100 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-gray-700 sm:grid">
                        <span>
                          Sector
                        </span>

                        <span>
                          Weight
                        </span>

                        <span />
                      </div>

                      <div className="divide-y divide-gray-200">
                        {fund.sectors.map(
                          (
                            sector,
                            sectorIndex
                          ) => (
                            <div
                              key={`${fundIndex}-${sectorIndex}`}
                              className="grid grid-cols-1 gap-2 px-4 py-3 transition hover:bg-violet-50/30 sm:grid-cols-[1fr_180px_50px] sm:items-center"
                            >
                              <div>
                                <label className="mb-1 block text-[10px] font-extrabold uppercase text-gray-500 sm:hidden">
                                  Sector
                                </label>

                                <input
                                  value={
                                    sector.sector
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    updateSector(
                                      fundIndex,
                                      sectorIndex,
                                      "sector",
                                      e.target
                                        .value
                                    )
                                  }
                                  placeholder="Financial Services"
                                  className={inputClass}
                                  disabled={
                                    loading
                                  }
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-[10px] font-extrabold uppercase text-gray-500 sm:hidden">
                                  Weight %
                                </label>

                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={
                                      sector.weight
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateSector(
                                        fundIndex,
                                        sectorIndex,
                                        "weight",
                                        e.target
                                          .value
                                    )
                                    }
                                    placeholder="25"
                                    className={`${inputClass} pr-9`}
                                    disabled={
                                      loading
                                    }
                                  />

                                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                                    %
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSector(
                                    fundIndex,
                                    sectorIndex
                                  )
                                }
                                disabled={
                                  fund.sectors
                                    .length ===
                                  1
                                }
                                className="hidden rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 sm:block"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* ALLOCATION FOOTER */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                Portfolio Input Status
              </p>

              <p className="mt-1 text-lg font-extrabold text-gray-950">
                {funds.length}{" "}
                {funds.length === 1
                  ? "Fund"
                  : "Funds"}
                <span className="mx-2 text-gray-300">
                  •
                </span>
                {holdingWeightTotal.toFixed(
                  1
                )}
                % total entered
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 size={18} />
                  Analyze Portfolio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* RESULTS */}
    {activeSection === "results" &&
      result && (
        <div className="space-y-5">
          {/* RESULT HEADER */}
          <div className="overflow-hidden rounded-2xl bg-gray-950 text-white shadow-lg">
            <div className="p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                      ANALYSIS COMPLETE
                    </span>

                    <span className="text-xs font-semibold text-gray-400">
                      {result.clientId}
                    </span>
                  </div>

                  <h2 className="text-2xl font-extrabold">
                    {result.portfolioName}
                  </h2>

                  <p className="mt-2 text-sm font-medium text-gray-400">
                    Portfolio health and
                    diversification overview
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
                    <p className="text-xs font-bold text-gray-400">
                      RISK LEVEL
                    </p>

                    <p className="mt-1 text-lg font-extrabold">
                      {result.riskLevel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
                    <p className="text-xs font-bold text-gray-400">
                      DIVERSIFICATION
                    </p>

                    <p className="mt-1 text-lg font-extrabold text-blue-300">
                      {result.diversificationScore.toFixed(
                        1
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* METRIC CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                id: "diversification",
                label: "Diversification",
                value:
                  result.diversificationScore.toFixed(
                    2
                  ),
                description:
                  "Overall portfolio balance",
                icon: ShieldCheck,
                iconClass:
                  "bg-blue-100 text-blue-700",
              },
              {
                id: "overlap",
                label: "Overlap Score",
                value:
                  result.overlapScore.toFixed(
                    2
                  ),
                description:
                  "Lower stock overlap",
                icon: Layers3,
                iconClass:
                  "bg-violet-100 text-violet-700",
              },
              {
                id: "sector",
                label: "Sector Score",
                value:
                  result.sectorScore.toFixed(
                    2
                  ),
                description:
                  "Sector diversification",
                icon: PieChart,
                iconClass:
                  "bg-emerald-100 text-emerald-700",
              },
              {
                id: "hhi",
                label: "HHI",
                value:
                  result.hhi.toFixed(4),
                description:
                  "Concentration indicator",
                icon: TrendingUp,
                iconClass:
                  "bg-amber-100 text-amber-700",
              },
            ].map((metric) => {
              const Icon = metric.icon;

              const active =
                selectedMetric ===
                metric.id;

              return (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() =>
                    setSelectedMetric(
                      active
                        ? null
                        : metric.id
                    )
                  }
                  className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${
                    active
                      ? "border-blue-400 ring-4 ring-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${metric.iconClass}`}
                    >
                      <Icon size={18} />
                    </div>

                    <span className="text-xs font-bold text-gray-400">
                      VIEW
                    </span>
                  </div>

                  <p className="mt-5 text-xs font-extrabold uppercase tracking-wide text-gray-500">
                    {metric.label}
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-gray-950">
                    {metric.value}
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {metric.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* SELECTED METRIC EXPLANATION */}
          {selectedMetric && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-extrabold text-blue-900">
                {selectedMetric ===
                  "diversification" &&
                  "Diversification Score"}

                {selectedMetric ===
                  "overlap" &&
                  "Overlap Score"}

                {selectedMetric ===
                  "sector" &&
                  "Sector Score"}

                {selectedMetric ===
                  "hhi" && "HHI"}
              </p>

              <p className="mt-1 text-sm font-medium leading-6 text-blue-800">
                {selectedMetric ===
                  "diversification" &&
                  "This combines overlap, holding concentration and sector diversification to give an overall portfolio diversification score."}

                {selectedMetric ===
                  "overlap" &&
                  "This indicates how much the funds share the same stocks. A higher score indicates lower overlap."}

                {selectedMetric ===
                  "sector" &&
                  "This measures how evenly the portfolio is distributed across sectors."}

                {selectedMetric ===
                  "hhi" &&
                  "The Herfindahl-Hirschman Index measures concentration. Higher values generally indicate greater concentration."}
              </p>
            </div>
          )}

          {/* OVERVIEW */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: "Portfolio Value",
                value:
                  formatCurrency(
                    result.totalValue
                  ),
              },
              {
                label: "Stocks",
                value:
                  result.numberOfStocks,
              },
              {
                label: "Funds",
                value:
                  result.numberOfFunds,
              },
              {
                label: "Sectors",
                value:
                  result.numberOfSectors,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                  {item.label}
                </p>

                <p className="mt-2 text-lg font-extrabold text-gray-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* LARGEST POSITIONS */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                Largest Holding
              </p>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-extrabold text-gray-950">
                    {
                      result
                        .largestHolding
                        .stock
                    }
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-500">
                    Highest individual stock
                    exposure
                  </p>
                </div>

                <span className="text-2xl font-extrabold text-blue-600">
                  {result.largestHolding.weight.toFixed(
                    1
                  )}
                  %
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${Math.min(
                      result
                        .largestHolding
                        .weight,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                Largest Sector
              </p>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-extrabold text-gray-950">
                    {
                      result
                        .largestSector
                        .sector
                    }
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-500">
                    Highest sector exposure
                  </p>
                </div>

                <span className="text-2xl font-extrabold text-violet-600">
                  {result.largestSector.weight.toFixed(
                    1
                  )}
                  %
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-violet-600"
                  style={{
                    width: `${Math.min(
                      result
                        .largestSector
                        .weight,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* SUMMARY + PROFILE */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 lg:col-span-2">
              <div className="flex items-start gap-3">
                <FileText
                  size={20}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <h3 className="text-base font-extrabold text-gray-950">
                    Portfolio Summary
                  </h3>

                  <p className="mt-3 text-sm font-medium leading-7 text-gray-700">
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                Investor Profile
              </p>

              <div className="mt-5">
                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-sm font-extrabold ${getTraderTypeClass(
                    result.traderType
                  )}`}
                >
                  {result.traderType}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium leading-6 text-gray-600">
                Based on the current
                diversification and concentration
                characteristics.
              </p>
            </div>
          </div>

          {/* PERFORMANCE */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-gray-950">
                  Estimated Performance
                </h3>

                <p className="mt-1 text-sm font-medium text-gray-600">
                  Model-based estimates from the
                  portfolio analysis.
                </p>
              </div>

              <span className="text-xs font-bold text-gray-400">
                ESTIMATE
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  label: "1 Year",
                  value:
                    result.performance
                      .oneYear,
                },
                {
                  label: "3 Years",
                  value:
                    result.performance
                      .threeYear,
                },
                {
                  label: "5 Years",
                  value:
                    result.performance
                      .fiveYear,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                    {item.label}
                  </p>

                  <p className="mt-3 text-3xl font-extrabold text-gray-950">
                    {item.value.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-bold leading-5 text-amber-800">
                ⚠ These are estimated/model-based
                values and should not be interpreted as
                actual historical returns.
              </p>
            </div>
          </div>

          {/* HOLDINGS TABLE */}
          {result.holdingBreakdown.length >
            0 && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h3 className="text-base font-extrabold text-gray-950">
                  Holding Breakdown
                </h3>

                <p className="mt-1 text-sm font-medium text-gray-600">
                  Individual stock exposure.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-gray-600">
                        Stock
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-gray-600">
                        Weight
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-gray-600">
                        Value
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {result.holdingBreakdown.map(
                      (item, index) => (
                        <tr
                          key={`${item.stock}-${index}`}
                          className="transition hover:bg-blue-50/40"
                        >
                          <td className="px-6 py-4 font-extrabold text-gray-950">
                            {item.stock}
                          </td>

                          <td className="px-6 py-4 text-right font-bold text-gray-700">
                            {item.weight.toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="px-6 py-4 text-right font-bold text-gray-800">
                            {formatCurrency(
                              item.value
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTOR TABLE */}
          {result.sectorBreakdown.length >
            0 && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h3 className="text-base font-extrabold text-gray-950">
                  Sector Breakdown
                </h3>

                <p className="mt-1 text-sm font-medium text-gray-600">
                  Distribution across portfolio sectors.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-gray-600">
                        Sector
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-gray-600">
                        Weight
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-gray-600">
                        Value
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {result.sectorBreakdown.map(
                      (item, index) => (
                        <tr
                          key={`${item.sector}-${index}`}
                          className="transition hover:bg-violet-50/40"
                        >
                          <td className="px-6 py-4 font-extrabold text-gray-950">
                            {item.sector}
                          </td>

                          <td className="px-6 py-4 text-right font-bold text-gray-700">
                            {item.weight.toFixed(
                              2
                            )}
                            %
                          </td>

                          <td className="px-6 py-4 text-right font-bold text-gray-800">
                            {formatCurrency(
                              item.value
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RECOMMENDATIONS */}
          {result.recommendations.length >
            0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-extrabold text-gray-950">
                  Recommendations
                </h3>

                <p className="mt-1 text-sm font-medium text-gray-600">
                  Actions suggested from the analysis.
                </p>
              </div>

              <div className="space-y-3">
                {result.recommendations.map(
                  (
                    recommendation,
                    index
                  ) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <CheckCircle2
                        size={19}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />

                      <p className="text-sm font-semibold leading-6 text-gray-700">
                        {recommendation}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* BACK TO EDIT */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "funds"
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-extrabold text-gray-800 transition hover:bg-gray-50"
            >
              ← Edit Portfolio
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <RefreshCcw
                    size={17}
                  />
                  Re-analyze
                </>
              )}
            </button>
          </div>
        </div>
      )}
  </div>
</div>

);
};

export default PortfolioAnalyzer;