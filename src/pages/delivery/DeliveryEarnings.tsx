import { motion } from 'framer-motion';
import { 
  Bike, Wallet, TrendingUp, Calendar, ArrowUpRight, 
  ArrowDownRight, Clock, Package, Star, ChevronRight,
  Bell, User, LogOut, Home, BarChart3, Settings, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { useDeliveryStats, useDeliveryHistory } from '@/hooks/useDeliveryData';
import { formatPrice } from '@/lib/currency';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';

const sidebarItems = [
  { title: 'Dashboard', url: '/delivery', icon: Home },
  { title: 'Earnings', url: '/delivery/earnings', icon: Wallet },
  { title: 'History', url: '/delivery/history', icon: History },
  { title: 'Settings', url: '/delivery/settings', icon: Settings },
];

function DeliverySidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bike className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Delivery Hub</h2>
              <p className="text-xs text-muted-foreground">Partner Dashboard</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function DeliveryEarnings() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDeliveryStats();
  const { data: history } = useDeliveryHistory(10);

  // Mock weekly data for chart visualization
  const weeklyData = [
    { day: 'Mon', earnings: 450 },
    { day: 'Tue', earnings: 620 },
    { day: 'Wed', earnings: 380 },
    { day: 'Thu', earnings: 720 },
    { day: 'Fri', earnings: 890 },
    { day: 'Sat', earnings: 1100 },
    { day: 'Sun', earnings: 650 },
  ];

  const maxEarning = Math.max(...weeklyData.map(d => d.earnings));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DeliverySidebar />
        
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-foreground">Earnings</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Track your income and payouts</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </header>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Earnings Overview */}
            <FadeIn>
              {statsLoading ? (
                <div className="grid sm:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-success" />
                        </div>
                        <div className="flex items-center gap-1 text-success text-sm font-medium">
                          <ArrowUpRight className="w-4 h-4" />
                          +12%
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-foreground">{formatPrice(stats?.todayEarnings || 0)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Today's Earnings</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-1 text-success text-sm font-medium">
                          <ArrowUpRight className="w-4 h-4" />
                          +8%
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-foreground">{formatPrice(stats?.weeklyEarnings || 0)}</p>
                      <p className="text-sm text-muted-foreground mt-1">This Week</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-accent-foreground" />
                        </div>
                        <div className="flex items-center gap-1 text-success text-sm font-medium">
                          <ArrowUpRight className="w-4 h-4" />
                          +15%
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-foreground">{formatPrice(stats?.monthlyEarnings || 0)}</p>
                      <p className="text-sm text-muted-foreground mt-1">This Month</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </FadeIn>

            {/* Weekly Chart */}
            <FadeIn delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2 h-48">
                    {weeklyData.map((day, i) => (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(day.earnings / maxEarning) * 100}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className="w-full max-w-12 bg-primary/20 rounded-t-lg relative group cursor-pointer hover:bg-primary/30 transition-colors"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-medium bg-card border border-border px-2 py-1 rounded shadow-sm whitespace-nowrap">
                              {formatPrice(day.earnings)}
                            </span>
                          </div>
                        </motion.div>
                        <span className="text-xs text-muted-foreground">{day.day}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Recent Transactions */}
            <FadeIn delay={0.2}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    <Link to="/delivery/history">
                      <Button variant="ghost" size="sm">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {history && history.length > 0 ? (
                    <div className="space-y-3">
                      {history.slice(0, 5).map((delivery) => (
                        <div
                          key={delivery.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                              <Package className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">{delivery.order?.store?.name || 'Delivery'}</p>
                              <p className="text-xs text-muted-foreground">
                                {delivery.delivered_at 
                                  ? new Date(delivery.delivered_at).toLocaleString()
                                  : 'Completed'}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-success">
                            +{formatPrice(Number(delivery.order?.total_amount || 0) * 0.1 + 30)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No transactions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
