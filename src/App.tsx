import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useKillswitch } from "@/hooks/useKillswitch";
import { KilledScreen } from "@/components/KilledScreen";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Stocks from "./pages/Stocks";
import Crypto from "./pages/Crypto";
import Portfolio from "./pages/Portfolio";
import KYC from "./pages/KYC";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { isKilled, loading } = useKillswitch();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isKilled) {
    return <KilledScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/stocks" element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
        <Route path="/crypto" element={<ProtectedRoute><Crypto /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
