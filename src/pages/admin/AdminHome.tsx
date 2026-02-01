import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, LayoutDashboard, Users, Store, ShoppingBag, 
  Settings, LogOut, Menu, X, Bell, Truck, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useVendors, 
  useDeliveryPartners, 
  useUsers, 
  usePlatformStats,
  useRecentOrders
} from '@/hooks/useAdminData';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { StatsOverview } from '@/components/admin/StatsOverview';
import { VendorsTab } from '@/components/admin/VendorsTab';
import { DeliveryPartnersTab } from '@/components/admin/DeliveryPartnersTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { RecentOrdersTab } from '@/components/admin/RecentOrdersTab';
import { SettingsTab } from '@/components/admin/SettingsTab';
import { StoreLimitRequestsTab } from '@/components/admin/StoreLimitRequestsTab';
import { VerificationsTab } from '@/components/admin/VerificationsTab';
import { HoverScale } from '@/components/ui/animated-container';

type TabId = 'dashboard' | 'verifications' | 'vendors' | 'delivery' | 'users' | 'orders' | 'store-requests' | 'settings';

const navItems: { icon: React.ComponentType<{ className?: string }>; label: string; id: TabId }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Shield, label: 'Verifications', id: 'verifications' },
  { icon: Store, label: 'Vendors', id: 'vendors' },
  { icon: Truck, label: 'Delivery Partners', id: 'delivery' },
  { icon: Users, label: 'Users', id: 'users' },
  { icon: ShoppingBag, label: 'Orders', id: 'orders' },
  { icon: FileText, label: 'Store Requests', id: 'store-requests' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export function AdminHome() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Enable real-time notifications for admin
  useAdminNotifications();

  // Listen for navigation events from notifications
  useEffect(() => {
    const handleAdminNavigate = (event: CustomEvent<TabId>) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('admin-navigate', handleAdminNavigate as EventListener);
    return () => {
      window.removeEventListener('admin-navigate', handleAdminNavigate as EventListener);
    };
  }, []);

  // Data fetching
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: vendors, isLoading: vendorsLoading } = useVendors();
  const { data: deliveryPartners, isLoading: partnersLoading } = useDeliveryPartners();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: orders, isLoading: ordersLoading } = useRecentOrders(20);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate pending approvals
  const pendingVendors = vendors?.filter(v => !v.is_verified).length || 0;
  const pendingPartners = deliveryPartners?.filter(p => !p.is_verified).length || 0;
  const totalPending = pendingVendors + pendingPartners;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <StatsOverview stats={stats} isLoading={statsLoading} />
            
            {/* Quick access to pending approvals */}
            {totalPending > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded-2xl bg-warning/10 border border-warning/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Approvals</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingVendors} vendors, {pendingPartners} delivery partners waiting
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  className="bg-warning hover:bg-warning/90 text-white"
                  onClick={() => setActiveTab('verifications')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Review All ({totalPending})
                </Button>
              </motion.div>
            )}
            
            {/* Recent Orders Preview */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('orders')}
                >
                  View All
                </Button>
              </div>
              <RecentOrdersTab orders={orders?.slice(0, 5)} isLoading={ordersLoading} />
            </div>
          </>
        );
      
      case 'verifications':
        return (
          <VerificationsTab 
            vendors={vendors} 
            deliveryPartners={deliveryPartners}
            isLoading={vendorsLoading || partnersLoading}
          />
        );
      
      case 'vendors':
        return <VendorsTab vendors={vendors} isLoading={vendorsLoading} />;
      
      case 'delivery':
        return <DeliveryPartnersTab partners={deliveryPartners} isLoading={partnersLoading} />;
      
      case 'users':
        return <UsersTab users={users} isLoading={usersLoading} />;
      
      case 'orders':
        return <RecentOrdersTab orders={orders} isLoading={ordersLoading} />;
      
      case 'store-requests':
        return <StoreLimitRequestsTab />;
      
      case 'settings':
        return <SettingsTab />;
      
      default:
        return null;
    }
  };

  const tabTitles: Record<TabId, { title: string; subtitle: string }> = {
    dashboard: { title: 'Platform Overview', subtitle: 'Monitor and manage your cloud kitchen ecosystem' },
    verifications: { title: 'Account Verifications', subtitle: 'Review and approve pending vendor and delivery partner registrations' },
    vendors: { title: 'Vendor Management', subtitle: 'Approve and manage registered vendors' },
    delivery: { title: 'Delivery Partners', subtitle: 'Manage delivery partner verification and status' },
    users: { title: 'User Management', subtitle: 'View and manage all platform users' },
    orders: { title: 'Orders', subtitle: 'View all orders across the platform' },
    'store-requests': { title: 'Store Limit Requests', subtitle: 'Review vendor requests for additional stores' },
    settings: { title: 'Settings', subtitle: 'Configure platform settings' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/60 to-white flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-amber-100 shadow-[0_22px_60px_-34px_rgba(249,115,22,0.4)] transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
      }`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-amber-100">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200 shadow-[0_10px_30px_-18px_rgba(249,115,22,0.5)]">
                <Shield className="w-6 h-6 text-amber-700" />
              </div>
              {sidebarOpen && <span className="text-amber-900 font-bold">Admin Panel</span>}
            </Link>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-amber-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-[0_16px_38px_-20px_rgba(249,115,22,0.65)]' 
                    : 'text-amber-800 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                )}
                {/* Badge for pending verifications */}
                {sidebarOpen && item.id === 'verifications' && totalPending > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    {totalPending}
                  </span>
                )}
                {sidebarOpen && item.id === 'vendors' && pendingVendors > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    {pendingVendors}
                  </span>
                )}
                {sidebarOpen && item.id === 'delivery' && pendingPartners > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    {pendingPartners}
                  </span>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-amber-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-xl border-b border-amber-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-amber-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">{tabTitles[activeTab].title}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {tabTitles[activeTab].subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <HoverScale>
              <button className="relative p-2.5 rounded-xl bg-white border border-amber-100 hover:border-amber-200 hover:bg-amber-50 transition-colors shadow-[0_12px_26px_-18px_rgba(249,115,22,0.45)]">
                <Bell className="w-5 h-5 text-amber-800" />
                {totalPending > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                    {totalPending}
                  </span>
                )}
              </button>
            </HoverScale>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border-2 border-amber-300 shadow-[0_10px_30px_-18px_rgba(249,115,22,0.5)]">
                <Shield className="w-5 h-5 text-amber-700" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
