import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import StockEvaluator from "./pages/stocks/StockEvaluator";
import PortfolioAnalyzer from "./pages/portfolio/PortfolioAnalyzer";
import Reports from "./pages/reports/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stocks" element={<StockEvaluator />} />
        <Route path="/portfolio" element={<PortfolioAnalyzer />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
