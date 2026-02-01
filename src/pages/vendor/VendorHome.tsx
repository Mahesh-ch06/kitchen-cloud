import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChefHat, LayoutDashboard, ShoppingBag, Package, BarChart3, 
  Settings, LogOut, Menu, X, Bell, Clock, DollarSign,
  TrendingUp, Utensils, MapPin, Plus, Store, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useVendorStats, useVendorOrders, useVendorStores, useVendorMenuItems } from '@/hooks/useVendorData';
import { FadeIn, FadeInStagger, FadeInStaggerItem, HoverScale } from '@/components/ui/animated-container';
import { Skeleton } from '@/components/ui/skeleton';
import { OrdersTab } from '@/components/vendor/OrdersTab';
import { MenuTab } from '@/components/vendor/MenuTab';
import { StoresTab } from '@/components/vendor/StoresTab';
import { OffersTab } from '@/components/vendor/OffersTab';

type TabId = 'dashboard' | 'orders' | 'menu' | 'inventory' | 'stores' | 'offers' | 'analytics' | 'settings';

export function VendorHome() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch real data from Supabase
  const { data: stats, isLoading: statsLoading } = useVendorStats();
  const { data: orders, isLoading: ordersLoading } = useVendorOrders(50);
  const { data: stores, isLoading: storesLoading } = useVendorStores();
  const { data: menuItems, isLoading: menuLoading } = useVendorMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems: { icon: React.ComponentType<{ className?: string }>; label: string; id: TabId; badge?: number }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: ShoppingBag, label: 'Orders', id: 'orders', badge: stats?.pendingOrders },
    { icon: Utensils, label: 'Menu', id: 'menu' },
    { icon: Package, label: 'Inventory', id: 'inventory' },
    { icon: MapPin, label: 'Stores', id: 'stores' },
    { icon: Tag, label: 'Offers', id: 'offers' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    { icon: Settings, label: 'Settings', id: 'settings' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersTab orders={orders} isLoading={ordersLoading} />;
      case 'menu':
        return <MenuTab menuItems={menuItems} isLoading={menuLoading} />;
      case 'stores':
        return <StoresTab stores={stores} menuItems={menuItems} isLoading={storesLoading} />;
      case 'offers':
        return <OffersTab stores={stores} isLoading={storesLoading} />;
      case 'inventory':
        return (
          <FadeIn>
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inventory Management</h3>
              <p className="text-muted-foreground">Track stock levels and manage ingredients coming soon</p>
            </div>
          </FadeIn>
        );
      case 'analytics':
        return (
          <FadeIn>
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">Detailed sales and performance analytics coming soon</p>
            </div>
          </FadeIn>
        );
      case 'settings':
        return (
          <FadeIn>
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Vendor Settings</h3>
              <p className="text-muted-foreground">Manage your profile and preferences coming soon</p>
            </div>
          </FadeIn>
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      {/* Stats Cards */}
      <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" staggerDelay={0.05}>
        <FadeInStaggerItem>
          {statsLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <motion.div 
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-border hover:border-primary/40 hover:shadow-strong transition-all cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 gradient-primary opacity-10 blur-3xl group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center transition-colors shadow-md">
                    <ShoppingBag className="w-7 h-7 text-primary" />
                  </div>
                  {stats?.todayOrders ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-success font-semibold bg-success/10">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="text-4xl font-extrabold mb-1">{stats?.todayOrders || 0}</p>
                <p className="text-sm text-muted-foreground font-medium">Today's Orders</p>
                <div className="mt-4 h-1 w-full bg-border rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: stats?.todayOrders ? '60%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </FadeInStaggerItem>

        <FadeInStaggerItem>
          {statsLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <motion.div 
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-accent/10 via-card to-card border border-border hover:border-accent/40 hover:shadow-strong transition-all cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 opacity-10 blur-3xl group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center transition-colors shadow-md">
                    <Clock className="w-7 h-7 text-accent-foreground" />
                  </div>
                  {(stats?.pendingOrders || 0) > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/20 text-warning animate-pulse">
                      {stats.pendingOrders} Pending
                    </span>
                  )}
                </div>
                <p className="text-4xl font-extrabold mb-1">{stats?.pendingOrders || 0}</p>
                <p className="text-sm text-muted-foreground font-medium">Pending Orders</p>
                <div className="mt-4 h-1 w-full bg-border rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: stats?.pendingOrders ? '40%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </FadeInStaggerItem>

        <FadeInStaggerItem>
          {statsLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <motion.div 
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-success/10 via-card to-card border border-border hover:border-success/40 hover:shadow-strong transition-all cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-success/20 opacity-10 blur-3xl group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-success/20 group-hover:bg-success/30 flex items-center justify-center transition-colors shadow-md">
                    <DollarSign className="w-7 h-7 text-success" />
                  </div>
                  {(stats?.todayRevenue || 0) > 0 && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-success font-semibold bg-success/10">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{((stats.todayRevenue / 10000) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="text-4xl font-extrabold mb-1">₹{(stats?.todayRevenue || 0).toFixed(0)}</p>
                <p className="text-sm text-muted-foreground font-medium">Today's Revenue</p>
                <div className="mt-4 h-1 w-full bg-border rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-success to-success/50 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: stats?.todayRevenue ? '80%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </FadeInStaggerItem>

        <FadeInStaggerItem>
          {statsLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <motion.div 
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-muted/30 via-card to-card border border-border hover:border-primary/20 hover:shadow-strong transition-all cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-muted/20 opacity-10 blur-3xl group-hover:opacity-20 transition-opacity" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-muted/40 group-hover:bg-muted/60 flex items-center justify-center transition-colors shadow-md">
                    <Utensils className="w-7 h-7 text-foreground" />
                  </div>
                  {(stats?.totalMenuItems || 0) > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted/40 text-foreground">
                      Items
                    </span>
                  )}
                </div>
                <p className="text-4xl font-extrabold mb-1">{stats?.totalMenuItems || 0}</p>
                <p className="text-sm text-muted-foreground font-medium">Menu Items</p>
                <div className="mt-4 h-1 w-full bg-border rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-muted-foreground to-muted-foreground/50 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: stats?.totalMenuItems ? '70%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </FadeInStaggerItem>
      </FadeInStagger>

      {/* Quick Actions */}
      <FadeIn delay={0.2}>
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            Quick Actions
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Plus, label: 'Add Menu Item', color: 'primary', tab: 'menu' as TabId, gradient: 'from-primary/20 to-primary/5' },
              { icon: ShoppingBag, label: 'View Orders', color: 'accent', tab: 'orders' as TabId, gradient: 'from-accent/20 to-accent/5' },
              { icon: Store, label: 'Manage Stores', color: 'success', tab: 'stores' as TabId, gradient: 'from-success/20 to-success/5' },
              { icon: BarChart3, label: 'View Reports', color: 'muted', tab: 'analytics' as TabId, gradient: 'from-muted/30 to-muted/5' },
            ].map((action, i) => (
              <HoverScale key={i}>
                <motion.button 
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(action.tab)}
                  className={`group w-full p-5 rounded-xl bg-gradient-to-br ${action.gradient} border border-border hover:border-${action.color}/30 hover:shadow-medium flex items-center gap-4 transition-all relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-700" />
                  <div className={`w-12 h-12 rounded-xl bg-${action.color}/20 group-hover:bg-${action.color}/30 flex items-center justify-center transition-all shadow-md group-hover:scale-110`}>
                    <action.icon className={`w-6 h-6 text-${action.color}`} />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">{action.label}</span>
                    <span className="text-xs text-muted-foreground">Click to access</span>
                  </div>
                </motion.button>
              </HoverScale>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <FadeIn delay={0.3}>
          <div className="rounded-2xl bg-card border border-border shadow-soft p-6 hover:shadow-medium transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Recent Orders</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')} className="hover:bg-primary/10">
                View All →
              </Button>
            </div>
            
            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/5 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-lg font-medium mb-2">No orders yet</p>
                <p className="text-sm text-muted-foreground mb-4">Orders will appear here once customers start placing them</p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('menu')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Items
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order, idx) => (
                  <motion.div 
                    key={order.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ x: 4, backgroundColor: 'hsl(var(--secondary))' }}
                    className="group flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:shadow-soft transition-all cursor-pointer border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold group-hover:text-primary transition-colors">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.order_items?.length || 0} items • <span className="font-medium">₹{Number(order.total_amount).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        order.status === 'preparing' ? 'bg-accent/20 text-accent-foreground' :
                        order.status === 'delivered' ? 'bg-success/20 text-success' :
                        order.status === 'pending' ? 'bg-warning/20 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Stores */}
        <FadeIn delay={0.4}>
          <div className="rounded-2xl bg-card border border-border shadow-soft p-6 hover:shadow-medium transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-success" />
                </div>
                <h2 className="text-lg font-semibold">Your Stores</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('stores')} className="hover:bg-success/10">
                Manage →
              </Button>
            </div>
            
            {storesLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : !stores || stores.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/5 flex items-center justify-center">
                  <Store className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <p className="text-lg font-medium mb-2">No stores yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create your first store to start selling</p>
                <Button variant="default" size="sm" onClick={() => setActiveTab('stores')} className="shadow-glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Store
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stores.slice(0, 3).map((store, idx) => (
                  <motion.div 
                    key={store.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="group p-5 rounded-xl bg-gradient-to-r from-secondary/30 to-secondary/10 hover:from-secondary/50 hover:to-secondary/20 border border-border hover:border-success/30 hover:shadow-soft transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {store.logo_url ? (
                        <motion.img 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          src={store.logo_url} 
                          alt={store.name} 
                          className="w-12 h-12 rounded-xl object-cover shadow-md" 
                        />
                      ) : (
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md"
                        >
                          <MapPin className="w-6 h-6 text-primary-foreground" />
                        </motion.div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-lg group-hover:text-primary transition-colors">{store.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{store.address}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        store.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                      }`}>
                        {store.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{menuItems?.filter(m => m.store_id === store.id).length || 0}</span>
                        <span className="text-muted-foreground">items</span>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>•</span>
                          <span className="text-xs">{store.phone}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </>
  );

  const tabTitles: Record<TabId, { title: string; subtitle: string }> = {
    dashboard: { title: `Welcome back, ${user?.name || 'Chef'}!`, subtitle: "Here's what's happening in your kitchen today" },
    orders: { title: 'Order Management', subtitle: 'Track and manage customer orders' },
    menu: { title: 'Menu Management', subtitle: 'Add, edit, and organize your menu items' },
    inventory: { title: 'Inventory', subtitle: 'Track stock levels and ingredients' },
    stores: { title: 'Store Management', subtitle: 'Manage your kitchen locations' },
    offers: { title: 'Offers & Coupons', subtitle: 'Create and manage promotional offers' },
    analytics: { title: 'Analytics', subtitle: 'View sales and performance metrics' },
    settings: { title: 'Settings', subtitle: 'Configure your vendor account' },
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
      }`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <ChefHat className="w-6 h-6 text-primary-foreground" />
              </div>
              {sidebarOpen && <span className="text-sidebar-foreground font-bold">Kitchen Hub</span>}
            </Link>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-sidebar-foreground"
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
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-warning text-warning-foreground text-xs font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
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
        <header className="sticky top-0 z-40 h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">{tabTitles[activeTab].title}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">{tabTitles[activeTab].subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <HoverScale>
              <button className="relative p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <Bell className="w-5 h-5" />
                {(stats?.pendingOrders || 0) > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-background" />
                )}
              </button>
            </HoverScale>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                {user?.name?.charAt(0) || 'V'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">{user?.name || 'Vendor'}</p>
                <p className="text-xs text-muted-foreground">Kitchen Manager</p>
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
