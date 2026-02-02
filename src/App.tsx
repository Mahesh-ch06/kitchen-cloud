import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { LocationModal } from "@/components/LocationModal";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AnimatePresence, motion } from "framer-motion";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { CustomerLanding } from "./pages/CustomerLanding";
import { VendorLanding } from "./pages/VendorLanding";
import { AdminLanding } from "./pages/AdminLanding";
import { DeliveryPartnerLanding } from "./pages/DeliveryPartnerLanding";
import { DeliveryHome } from "./pages/delivery/DeliveryHome";
import { DeliveryEarnings } from "./pages/delivery/DeliveryEarnings";
import { DeliveryHistory } from "./pages/delivery/DeliveryHistory";
import { CustomerLogin } from "./pages/auth/CustomerLogin";
import { CustomerSignup } from "./pages/auth/CustomerSignup";
import { VendorLogin } from "./pages/auth/VendorLogin";
import { DeliveryLogin } from "./pages/auth/DeliveryLogin";
import { DeliverySignup } from "./pages/auth/DeliverySignup";
import { AdminLogin } from "./pages/auth/AdminLogin";
import { CustomerHome } from "./pages/customer/CustomerHome";
import { MenuPage } from "./pages/customer/MenuPage";
import { CartPage } from "./pages/customer/CartPage";
import { CheckoutPage } from "./pages/customer/CheckoutPage";
import { OrdersPage } from "./pages/customer/OrdersPage";
import { OrderTrackingPage } from "./pages/customer/OrderTrackingPage";
import { ReorderPage } from "./pages/customer/ReorderPage";
import { ProfilePage } from "./pages/customer/ProfilePage";
import { AddressesPage } from "./pages/customer/AddressesPage";
import { PaymentsPage } from "./pages/customer/PaymentsPage";
import { FavoritesPage } from "./pages/customer/FavoritesPage";
import { NotificationsPage } from "./pages/customer/NotificationsPage";
import { SettingsPage } from "./pages/customer/SettingsPage";
import { HelpPage } from "./pages/customer/HelpPage";
import { VendorHome } from "./pages/vendor/VendorHome";
import { VendorDashboard } from "./pages/vendor/VendorDashboard";
import { AdminHome } from "./pages/admin/AdminHome";
import { AllPages } from "./pages/admin/AllPages";
import HeroDemo from "./pages/HeroDemo";
import ConnoisseurDemo from "./pages/ConnoisseurDemo";


const queryClient = new QueryClient();

// Root Route Handler - redirects based on user role
function RootRoute() {
  const { user, isAuthenticated } = useAuth();
  
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'vendor':
        return <Navigate to="/vendor" replace />;
      case 'delivery_partner':
        return <Navigate to="/delivery" replace />;
      case 'customer':
      default:
        return <Navigate to="/home" replace />;
    }
  }
  
  return <CustomerLanding />;
}

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user?.role || '')) {
    // Redirect to their appropriate home instead of root
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'vendor':
        return <Navigate to="/vendor" replace />;
      case 'delivery_partner':
        return <Navigate to="/delivery" replace />;
      default:
        return <Navigate to="/home" replace />;
    }
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root Route - Smart redirect based on user role */}
      <Route path="/" element={<RootRoute />} />
      
      {/* Landing Pages */}
      <Route path="/customer/landing" element={<CustomerLanding />} />
      <Route path="/vendor/landing" element={<VendorLanding />} />
      <Route path="/admin/landing" element={<AdminLanding />} />
      <Route path="/delivery/landing" element={<DeliveryPartnerLanding />} />

      {/* Showcase / marketing demos */}
      <Route path="/hero-demo" element={<HeroDemo />} />
      <Route path="/connoisseur-demo" element={<ConnoisseurDemo />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/signup" element={<CustomerSignup />} />
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/delivery/login" element={<DeliveryLogin />} />
      <Route path="/delivery/signup" element={<DeliverySignup />} />
      
      {/* Customer Routes */}
      <Route path="/home" element={<CustomerHome />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:orderId/track" element={<OrderTrackingPage />} />
      <Route path="/reorder" element={<ReorderPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/addresses" element={<AddressesPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/help" element={<HelpPage />} />
      
      {/* Vendor Routes */}
      <Route
        path="/vendor"
        element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <VendorHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pages"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AllPages />
          </ProtectedRoute>
        }
      />
      
      {/* Delivery Partner Routes */}
      <Route
        path="/delivery"
        element={
          <ProtectedRoute allowedRoles={['delivery_partner']}>
            <DeliveryHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery/earnings"
        element={
          <ProtectedRoute allowedRoles={['delivery_partner']}>
            <DeliveryEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery/history"
        element={
          <ProtectedRoute allowedRoles={['delivery_partner']}>
            <DeliveryHistory />
          </ProtectedRoute>
        }
      />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppWithLoading() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loading" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Toaster />
          <Sonner />
          <LocationProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            <LocationModal />
          </LocationProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <AppWithLoading />
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
