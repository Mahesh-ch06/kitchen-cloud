import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bike, Package, CheckCircle2, XCircle, MapPin, 
  Clock, Calendar, Search, Filter, ChevronRight,
  Bell, LogOut, Home, Wallet, Settings, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { useDeliveryHistory } from '@/hooks/useDeliveryData';
import { formatPrice } from '@/lib/currency';
import { format } from 'date-fns';
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

export function DeliveryHistory() {
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: history, isLoading } = useDeliveryHistory(50);

  const filteredHistory = (history || []).filter(delivery => {
    const matchesFilter = filter === 'all' || delivery.status === filter;
    const matchesSearch = searchQuery === '' || 
      delivery.order?.store?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.order?.delivery_address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const completedCount = history?.filter(d => d.status === 'delivered').length || 0;
  const cancelledCount = history?.filter(d => d.status === 'cancelled').length || 0;

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
                  <h1 className="text-base sm:text-xl font-bold text-foreground">Delivery History</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">View all your past deliveries</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </header>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Stats Summary */}
            <FadeIn>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{history?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedCount}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{cancelledCount}</p>
                        <p className="text-xs text-muted-foreground">Cancelled</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {formatPrice(
                            (history || [])
                              .filter(d => d.status === 'delivered')
                              .reduce((sum, d) => sum + (Number(d.order?.total_amount || 0) * 0.1 + 30), 0)
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">Earned</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </FadeIn>

            {/* Search and Filters */}
            <FadeIn delay={0.1}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by restaurant or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'delivered', 'cancelled'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(status)}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* History List */}
            <FadeIn delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {filter === 'all' ? 'All Deliveries' : filter === 'delivered' ? 'Completed Deliveries' : 'Cancelled Deliveries'}
                    {' '}({filteredHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                      ))}
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No deliveries found</p>
                    </div>
                  ) : (
                    <FadeInStagger className="space-y-3" staggerDelay={0.03}>
                      {filteredHistory.map((delivery) => (
                        <FadeInStaggerItem key={delivery.id}>
                          <motion.div
                            whileHover={{ x: 4 }}
                            className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                delivery.status === 'delivered' 
                                  ? 'bg-success/20' 
                                  : 'bg-destructive/20'
                              }`}>
                                {delivery.status === 'delivered' ? (
                                  <CheckCircle2 className="w-6 h-6 text-success" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-destructive" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{delivery.order?.store?.name || 'Restaurant'}</p>
                                  <Badge variant={delivery.status === 'delivered' ? 'default' : 'destructive'} className="text-xs">
                                    {delivery.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {delivery.order?.delivery_address?.slice(0, 30)}...
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {delivery.delivered_at 
                                      ? format(new Date(delivery.delivered_at), 'MMM d, yyyy')
                                      : 'N/A'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {delivery.delivered_at 
                                      ? format(new Date(delivery.delivered_at), 'HH:mm')
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {delivery.status === 'delivered' && (
                                <p className="font-bold text-success">
                                  +{formatPrice(Number(delivery.order?.total_amount || 0) * 0.1 + 30)}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Order: {formatPrice(Number(delivery.order?.total_amount || 0))}
                              </p>
                            </div>
                          </motion.div>
                        </FadeInStaggerItem>
                      ))}
                    </FadeInStagger>
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
