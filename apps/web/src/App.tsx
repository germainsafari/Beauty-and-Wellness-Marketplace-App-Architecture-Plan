import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LocaleProvider } from "@hafi/i18n";
import { AppProvider, useApp } from "./context/AppContext";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import ClientLayout from "./layouts/ClientLayout";
import MerchantLayout from "./layouts/MerchantLayout";
import ClientHomePage from "./pages/client/ClientHomePage";
import DiscoverPage from "./pages/client/DiscoverPage";
import ClientMarketplacePage from "./pages/client/ClientMarketplacePage";
import ClientItemDetailPage from "./pages/client/ClientItemDetailPage";
import ClientBookingsPage from "./pages/client/ClientBookingsPage";
import ClientAIPage from "./pages/client/ClientAIPage";
import ClientProfilePage from "./pages/client/ClientProfilePage";
import ClientMessagesPage from "./pages/client/ClientMessagesPage";
import ClientSellPage from "./pages/client/ClientSellPage";
import MerchantDashboardPage from "./pages/merchant/MerchantDashboardPage";
import MerchantCalendarPage from "./pages/merchant/MerchantCalendarPage";
import MerchantServicesPage from "./pages/merchant/MerchantServicesPage";
import MerchantListingsPage from "./pages/merchant/MerchantListingsPage";
import MerchantNewListingPage from "./pages/merchant/MerchantNewListingPage";
import MerchantOffersPage from "./pages/merchant/MerchantOffersPage";
import MerchantAnalyticsPage from "./pages/merchant/MerchantAnalyticsPage";
import MerchantProfilePage from "./pages/merchant/MerchantProfilePage";
import MerchantMessagesPage from "./pages/merchant/MerchantMessagesPage";
import AdminPage from "./pages/admin/AdminPage";

function AppRoutes() {
  const { user, loading, selectedRole } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hafi-bg">
        <div className="w-10 h-10 border-4 border-hafi-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <RoleSelectionPage />;

  if (user.role === "admin") {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  if (selectedRole === "provider") {
    return (
      <Routes>
        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<MerchantDashboardPage />} />
          <Route path="calendar" element={<MerchantCalendarPage />} />
          <Route path="services" element={<MerchantServicesPage />} />
          <Route path="listings" element={<MerchantListingsPage />} />
          <Route path="listings/new" element={<MerchantNewListingPage />} />
          <Route path="offers" element={<MerchantOffersPage />} />
          <Route path="analytics" element={<MerchantAnalyticsPage />} />
          <Route path="messages" element={<MerchantMessagesPage />} />
          <Route path="profile" element={<MerchantProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/merchant" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<ClientHomePage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="marketplace" element={<ClientMarketplacePage />} />
        <Route path="marketplace/:id" element={<ClientItemDetailPage />} />
        <Route path="marketplace/sell" element={<ClientSellPage />} />
        <Route path="bookings" element={<ClientBookingsPage />} />
        <Route path="messages" element={<ClientMessagesPage />} />
        <Route path="ai" element={<ClientAIPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/client" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </LocaleProvider>
  );
}
