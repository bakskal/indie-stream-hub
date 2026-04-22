import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import PressRelease from "./pages/PressRelease";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Library from "./pages/Library";
import Watch from "./pages/Watch";
import DevWatch from "./pages/DevWatch";
import Account from "./pages/Account";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/press" element={<PressRelease />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/watch/:rentalId" element={<ProtectedRoute><Watch /></ProtectedRoute>} />
            <Route path="/dev/watch" element={<DevWatch />} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
