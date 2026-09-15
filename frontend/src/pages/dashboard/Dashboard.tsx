import {
  TrendingUp,
  Briefcase,
  FileText,
  LogOut,
  ArrowRight,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

function Dashboard() {
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="font-bold leading-tight">NextGen</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-blue-600">
                MARKET ANALYZER
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-blue-600">
            Financial Analytics
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-500">
            Analyze stocks, portfolios and investment risk from one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Portfolio Value
                </p>

                <p className="mt-2 text-2xl font-bold">
                  ₹25.0L
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Diversification
                </p>

                <p className="mt-2 text-2xl font-bold">
                  97
                  <span className="text-sm font-medium text-gray-400">
                    /100
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Risk Level
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  Low
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Tools */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-bold">
            Analysis Tools
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Stock */}
            <a
              href="/stocks"
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 transition group-hover:bg-blue-600">
                  <TrendingUp className="h-6 w-6 text-blue-600 transition group-hover:text-white" />
                </div>

                <ArrowRight className="h-5 w-5 text-gray-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Stock Evaluator
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Evaluate stock fundamentals and financial ratios.
              </p>

              <p className="mt-4 text-sm font-semibold text-blue-600">
                Evaluate stock →
              </p>
            </a>

            {/* Portfolio */}
            <a
              href="/portfolio"
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 transition group-hover:bg-emerald-600">
                  <Briefcase className="h-6 w-6 text-emerald-600 transition group-hover:text-white" />
                </div>

                <ArrowRight className="h-5 w-5 text-gray-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Portfolio Analyzer
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Analyze diversification, sectors and portfolio risk.
              </p>

              <p className="mt-4 text-sm font-semibold text-emerald-600">
                Analyze portfolio →
              </p>
            </a>

            {/* Reports */}
            <a
              href="/reports"
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 transition group-hover:bg-purple-600">
                  <FileText className="h-6 w-6 text-purple-600 transition group-hover:text-white" />
                </div>

                <ArrowRight className="h-5 w-5 text-gray-300 transition group-hover:translate-x-1 group-hover:text-purple-600" />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Reports
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                View and manage your portfolio analysis reports.
              </p>

              <p className="mt-4 text-sm font-semibold text-purple-600">
                View reports →
              </p>
            </a>
          </div>
        </div>

        {/* Simple Overview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">
                Portfolio Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest portfolio analysis
              </p>
            </div>

            <a
              href="/portfolio"
              className="flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              Open Analyzer
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="mt-6 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-400">
                Portfolio Score
              </p>

              <p className="mt-1 text-xl font-bold">
                97.0
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Investor Profile
              </p>

              <p className="mt-1 text-xl font-bold">
                Conservative
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Estimated 1Y
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-600">
                +10.0%
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          NextGen Market Analyzer • Intelligent Financial Analytics
        </div>
      </main>
    </div>
  );
}

export default Dashboard;