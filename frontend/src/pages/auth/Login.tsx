import { useState } from "react";
import api from "../../services/api";
import {
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Sparkles,
  LockKeyhole,
  UserPlus,
  LogIn,
} from "lucide-react";

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/token/", {
        username,
        password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      window.location.href = "/dashboard";
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SIGN UP
  // =========================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!username || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Create account
      await api.post("/auth/register/", {
        username,
        password,
      });

      // Automatically log the new user in
      const response = await api.post("/auth/token/", {
        username,
        password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      // Go directly to dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SWITCH LOGIN / SIGN UP
  // =========================
  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      {/* Background glow */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />

      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* =========================
          FLOATING CARDS
      ========================= */}

      <div className="absolute left-[7%] top-[18%] hidden animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>

          <div>
            <p className="text-xs text-gray-400">Market Trend</p>
            <p className="font-semibold text-emerald-400">+8.42%</p>
          </div>
        </div>
      </div>

      <div className="absolute right-[7%] top-[24%] hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/15 p-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>

          <div>
            <p className="text-xs text-gray-400">Portfolio Score</p>
            <p className="font-semibold">97.0 / 100</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[17%] left-[12%] hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-500/15 p-2">
            <ShieldCheck className="h-5 w-5 text-purple-400" />
          </div>

          <div>
            <p className="text-xs text-gray-400">Risk Analysis</p>
            <p className="font-semibold text-purple-300">Low Risk</p>
          </div>
        </div>
      </div>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-2">

          {/* =========================
              LEFT SIDE
          ========================= */}

          <div className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
            <div>
              {/* Logo */}
              <div className="mb-10 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-lg font-bold tracking-tight">
                    NextGen
                  </p>

                  <p className="text-xs tracking-[0.25em] text-blue-300">
                    MARKET ANALYZER
                  </p>
                </div>
              </div>

              <div className="max-w-lg">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-300">
                  <Sparkles className="h-4 w-4" />
                  Intelligent Portfolio Analytics
                </div>

                <h2 className="text-5xl font-bold leading-tight">
                  Make smarter
                  <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                    investment decisions.
                  </span>
                </h2>

                <p className="mt-6 max-w-md text-base leading-7 text-gray-400">
                  Analyze stocks, understand portfolio risk, measure
                  diversification and uncover better investment insights
                  from one intelligent platform.
                </p>
              </div>
            </div>

            {/* Bottom features */}
            <div className="mt-12 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <BarChart3 className="mb-3 h-5 w-5 text-blue-400" />

                <p className="text-sm font-medium">
                  Analytics
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Deep insights
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-emerald-400" />

                <p className="text-sm font-medium">
                  Risk
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Smart analysis
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <TrendingUp className="mb-3 h-5 w-5 text-cyan-400" />

                <p className="text-sm font-medium">
                  Performance
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Clear metrics
                </p>
              </div>
            </div>
          </div>

          {/* =========================
              RIGHT SIDE
          ========================= */}

          <div className="flex items-center justify-center bg-white/[0.97] p-6 text-gray-900 sm:p-10">
            <div className="w-full max-w-md">

              {/* Mobile logo */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>

                <div>
                  <p className="font-bold">
                    NextGen Market Analyzer
                  </p>

                  <p className="text-xs text-gray-500">
                    Intelligent Financial Analytics
                  </p>
                </div>
              </div>

              {/* =========================
                  SIGN IN / SIGN UP TOGGLE
              ========================= */}

              <div className="mb-8 flex rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError("");
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    !isSignUp
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    isSignUp
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </button>
              </div>

              {/* Heading */}
              <div className="mb-7">
                <h1 className="text-3xl font-bold tracking-tight">
                  {isSignUp
                    ? "Create your account"
                    : "Welcome back"}
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  {isSignUp
                    ? "Start analyzing your portfolio smarter."
                    : "Sign in to continue to your market dashboard."}
                </p>
              </div>

              {/* =========================
                  FORM
              ========================= */}

              <form
                onSubmit={
                  isSignUp
                    ? handleSignUp
                    : handleLogin
                }
                className="space-y-5"
              >

                {/* Username */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Username
                  </label>

                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                {isSignUp && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Confirm Password
                    </label>

                    <div className="relative">
                      <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      {isSignUp
                        ? "Creating account..."
                        : "Signing in..."}
                    </>
                  ) : (
                    <>
                      {isSignUp
                        ? "Create Account"
                        : "Sign In"}

                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <p className="mt-7 text-center text-xs text-gray-400">
                By continuing, you agree to use NextGen Market
                Analyzer responsibly.
              </p>

              {/* Switch */}
              <p className="mt-5 text-center text-sm text-gray-500">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}

                <button
                  type="button"
                  onClick={switchMode}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  {isSignUp
                    ? "Sign In"
                    : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;