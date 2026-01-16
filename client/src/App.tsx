import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import OAuthDebug from "./pages/OAuthDebug";

import AdminDashboard from "./pages/AdminDashboard";
import CreativeDashboard from "./pages/CreativeDashboard";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import AuditLog from "./pages/AuditLog";
import RoleManagement from "./pages/RoleManagement";
import TenantSettings from "./pages/TenantSettings";
import CommissionManagement from "./pages/CommissionManagement";
import PerformanceTrendsPage from "./pages/PerformanceTrendsPage";
import BenchmarkComparisonPage from "./pages/BenchmarkComparisonPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
       <Route path="/" component={Home} />
      <Route path="/oauth-debug" component={OAuthDebug} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/audit-log" component={AuditLog} />
      <Route path="/roles" component={RoleManagement} />
      <Route path="/performance" component={PerformanceDashboard} />
      <Route path="/creative" component={CreativeDashboard} />
      <Route path="/settings" component={TenantSettings} />
      <Route path="/commission" component={CommissionManagement} />
      <Route path="/trends" component={PerformanceTrendsPage} />
      <Route path="/benchmarks" component={BenchmarkComparisonPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable={true}
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
