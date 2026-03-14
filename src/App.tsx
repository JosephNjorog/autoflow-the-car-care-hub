import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import UpdatePrompt from "@/components/pwa/UpdatePrompt";
import SplashScreen from "@/components/SplashScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import RoadmapPage from "./pages/RoadmapPage";

// Customer pages
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import BookService from "./pages/customer/BookService";
import CustomerBookings from "./pages/customer/CustomerBookings";
import CustomerVehicles from "./pages/customer/CustomerVehicles";
import CustomerLoyalty from "./pages/customer/CustomerLoyalty";
import CustomerPayments from "./pages/customer/CustomerPayments";
import CustomerWallet from "./pages/customer/CustomerWallet";
import CustomerLiveView from "./pages/customer/CustomerLiveView";

// Detailer pages
import DetailerDashboard from "./pages/detailer/DetailerDashboard";
import DetailerJobs from "./pages/detailer/DetailerJobs";
import DetailerSchedule from "./pages/detailer/DetailerSchedule";
import DetailerEarnings from "./pages/detailer/DetailerEarnings";

// Owner pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerBookings from "./pages/owner/OwnerBookings";
import OwnerServices from "./pages/owner/OwnerServices";
import OwnerStaff from "./pages/owner/OwnerStaff";
import OwnerLocations from "./pages/owner/OwnerLocations";
import OwnerAnalytics from "./pages/owner/OwnerAnalytics";
import OwnerPayments from "./pages/owner/OwnerPayments";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminServices from "./pages/admin/AdminServices";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminWaitlist from "./pages/admin/AdminWaitlist";

// Shared
import SettingsPage from "./pages/SettingsPage";
import NotificationPreferences from "./pages/NotificationPreferences";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Smart root redirect based on auth state
function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <LandingPage />;
  const dashboardMap = {
    customer: '/customer',
    detailer: '/detailer',
    owner: '/owner',
    admin: '/admin',
  };
  return <Navigate to={dashboardMap[user.role]} replace />;
}

const App = () => {
  // Show splash once per browser session
  const [splashDone, setSplashDone] = useState(() =>
    sessionStorage.getItem('afw_splash') === '1'
  );
  const handleSplashDone = () => {
    sessionStorage.setItem('afw_splash', '1');
    setSplashDone(true);
  };

  return (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!splashDone && <SplashScreen onDone={handleSplashDone} />}
        <Toaster />
        <Sonner />
        <UpdatePrompt />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />

              {/* Customer */}
              <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/customer/book" element={<ProtectedRoute allowedRoles={['customer']}><BookService /></ProtectedRoute>} />
              <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={['customer']}><CustomerBookings /></ProtectedRoute>} />
              <Route path="/customer/vehicles" element={<ProtectedRoute allowedRoles={['customer']}><CustomerVehicles /></ProtectedRoute>} />
              <Route path="/customer/loyalty" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLoyalty /></ProtectedRoute>} />
              <Route path="/customer/payments" element={<ProtectedRoute allowedRoles={['customer']}><CustomerPayments /></ProtectedRoute>} />
              <Route path="/customer/wallet" element={<ProtectedRoute allowedRoles={['customer']}><CustomerWallet /></ProtectedRoute>} />
              <Route path="/customer/live" element={<ProtectedRoute allowedRoles={['customer']}><CustomerLiveView /></ProtectedRoute>} />
              <Route path="/customer/settings" element={<ProtectedRoute allowedRoles={['customer']}><SettingsPage /></ProtectedRoute>} />
              <Route path="/customer/notifications" element={<ProtectedRoute allowedRoles={['customer']}><NotificationPreferences /></ProtectedRoute>} />

              {/* Detailer */}
              <Route path="/detailer" element={<ProtectedRoute allowedRoles={['detailer']}><DetailerDashboard /></ProtectedRoute>} />
              <Route path="/detailer/jobs" element={<ProtectedRoute allowedRoles={['detailer']}><DetailerJobs /></ProtectedRoute>} />
              <Route path="/detailer/schedule" element={<ProtectedRoute allowedRoles={['detailer']}><DetailerSchedule /></ProtectedRoute>} />
              <Route path="/detailer/earnings" element={<ProtectedRoute allowedRoles={['detailer']}><DetailerEarnings /></ProtectedRoute>} />
              <Route path="/detailer/settings" element={<ProtectedRoute allowedRoles={['detailer']}><SettingsPage /></ProtectedRoute>} />
              <Route path="/detailer/notifications" element={<ProtectedRoute allowedRoles={['detailer']}><NotificationPreferences /></ProtectedRoute>} />

              {/* Owner */}
              <Route path="/owner" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
              <Route path="/owner/bookings" element={<ProtectedRoute allowedRoles={['owner']}><OwnerBookings /></ProtectedRoute>} />
              <Route path="/owner/services" element={<ProtectedRoute allowedRoles={['owner']}><OwnerServices /></ProtectedRoute>} />
              <Route path="/owner/staff" element={<ProtectedRoute allowedRoles={['owner']}><OwnerStaff /></ProtectedRoute>} />
              <Route path="/owner/locations" element={<ProtectedRoute allowedRoles={['owner']}><OwnerLocations /></ProtectedRoute>} />
              <Route path="/owner/analytics" element={<ProtectedRoute allowedRoles={['owner']}><OwnerAnalytics /></ProtectedRoute>} />
              <Route path="/owner/payments" element={<ProtectedRoute allowedRoles={['owner']}><OwnerPayments /></ProtectedRoute>} />
              <Route path="/owner/settings" element={<ProtectedRoute allowedRoles={['owner']}><SettingsPage /></ProtectedRoute>} />
              <Route path="/owner/notifications" element={<ProtectedRoute allowedRoles={['owner']}><NotificationPreferences /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
              <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['admin']}><AdminTransactions /></ProtectedRoute>} />
              <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['admin']}><AdminServices /></ProtectedRoute>} />
              <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['admin']}><AdminApprovals /></ProtectedRoute>} />
              <Route path="/admin/waitlist" element={<ProtectedRoute allowedRoles={['admin']}><AdminWaitlist /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><NotificationPreferences /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  );
};

export default App;
