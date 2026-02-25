import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

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
import OwnerAIInsights from "./pages/owner/OwnerAIInsights";
import OwnerStaking from "./pages/owner/OwnerStaking";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminServices from "./pages/admin/AdminServices";
import AdminApprovals from "./pages/admin/AdminApprovals";

// Shared
import SettingsPage from "./pages/SettingsPage";
import NotificationPreferences from "./pages/NotificationPreferences";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/book" element={<BookService />} />
          <Route path="/customer/bookings" element={<CustomerBookings />} />
          <Route path="/customer/vehicles" element={<CustomerVehicles />} />
          <Route path="/customer/loyalty" element={<CustomerLoyalty />} />
          <Route path="/customer/payments" element={<CustomerPayments />} />
          <Route path="/customer/wallet" element={<CustomerWallet />} />
          <Route path="/customer/live" element={<CustomerLiveView />} />
          <Route path="/customer/settings" element={<SettingsPage role="customer" userName="James Mwangi" />} />
          <Route path="/customer/notifications" element={<NotificationPreferences role="customer" userName="James Mwangi" />} />

          {/* Detailer */}
          <Route path="/detailer" element={<DetailerDashboard />} />
          <Route path="/detailer/jobs" element={<DetailerJobs />} />
          <Route path="/detailer/schedule" element={<DetailerSchedule />} />
          <Route path="/detailer/earnings" element={<DetailerEarnings />} />
          <Route path="/detailer/settings" element={<SettingsPage role="detailer" userName="Peter Ochieng" />} />
          <Route path="/detailer/notifications" element={<NotificationPreferences role="detailer" userName="Peter Ochieng" />} />

          {/* Owner */}
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/bookings" element={<OwnerBookings />} />
          <Route path="/owner/services" element={<OwnerServices />} />
          <Route path="/owner/staff" element={<OwnerStaff />} />
          <Route path="/owner/locations" element={<OwnerLocations />} />
          <Route path="/owner/analytics" element={<OwnerAnalytics />} />
          <Route path="/owner/payments" element={<OwnerPayments />} />
          <Route path="/owner/ai-insights" element={<OwnerAIInsights />} />
          <Route path="/owner/staking" element={<OwnerStaking />} />
          <Route path="/owner/settings" element={<SettingsPage role="owner" userName="David Kamau" />} />
          <Route path="/owner/notifications" element={<NotificationPreferences role="owner" userName="David Kamau" />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/approvals" element={<AdminApprovals />} />
          <Route path="/admin/settings" element={<SettingsPage role="admin" userName="Sarah Njeri" />} />
          <Route path="/admin/notifications" element={<NotificationPreferences role="admin" userName="Sarah Njeri" />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
