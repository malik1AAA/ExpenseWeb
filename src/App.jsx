import { Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "./context/FinanceContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Debts from "./pages/Debts";
import Settings from "./pages/Settings";

function App() {
  return (
    <FinanceProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </FinanceProvider>
  );
}

export default App;
