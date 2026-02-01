import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChefHat, LayoutDashboard, ShoppingBag, Package, BarChart3, 
  Settings, LogOut, Menu, X, Bell, TrendingUp, Clock, DollarSign,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders, mockInventory, mockMenuItems } from '@/data/mockData';

export function VendorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Dashboard stats
  const todayOrders = mockOrders.filter(o => 
    new Date(o.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const pendingOrders = mockOrders.filter(o => 
    ['pending', 'confirmed', 'preparing'].includes(o.status)
  ).length;
  const todayRevenue = mockOrders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0);
  const lowStockItems = mockInventory.filter(i => i.quantity <= i.minThreshold).length;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: ShoppingBag, label: 'Orders', active: false },
    { icon: ChefHat, label: 'Menu', active: false },
    { icon: Package, label: 'Inventory', active: false },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

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
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary-foreground" />
              </div>
              {sidebarOpen && <span className="text-sidebar-foreground font-bold">CloudKitchen</span>}
            </Link>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
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

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                {user?.name?.charAt(0) || 'V'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.name || 'Vendor'}</p>
                <p className="text-xs text-muted-foreground">Vendor</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-success font-medium">+12%</span>
              </div>
              <p className="text-2xl font-bold">{todayOrders || 5}</p>
              <p className="text-sm text-muted-foreground">Today's Orders</p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <span className="text-xs text-accent font-medium">Active</span>
              </div>
              <p className="text-2xl font-bold">{pendingOrders || 3}</p>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <span className="text-xs text-success font-medium">+8%</span>
              </div>
              <p className="text-2xl font-bold">${(todayRevenue || 542.50).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Today's Revenue</p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-destructive" />
                </div>
                {lowStockItems > 0 && (
                  <span className="text-xs text-destructive font-medium">Alert</span>
                )}
              </div>
              <p className="text-2xl font-bold">{lowStockItems}</p>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              
              <div className="space-y-4">
                {mockOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items • ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'preparing' ? 'bg-accent/20 text-accent' :
                      order.status === 'delivered' ? 'bg-success/20 text-success' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Inventory Alerts</h2>
                <Button variant="ghost" size="sm">Manage</Button>
              </div>
              
              <div className="space-y-4">
                {mockInventory.filter(i => i.quantity <= i.minThreshold).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} remaining
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                      Reorder
                    </Button>
                  </div>
                ))}
                {mockInventory.filter(i => i.quantity > i.minThreshold).slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} in stock
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
