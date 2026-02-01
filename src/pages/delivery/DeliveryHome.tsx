import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bike, MapPin, Clock, Wallet, Package, CheckCircle2, 
  Navigation, Phone, Star, TrendingUp, Zap, ChevronRight,
  Bell, User, LogOut, Home, BarChart3, Settings, History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { 
  useDeliveryProfile, 
  useDeliveryStats, 
  useActiveDelivery, 
  usePendingDeliveries,
  useDeliveryHistory,
  useAcceptDelivery,
  useUpdateDeliveryStatus,
  useToggleAvailability
} from '@/hooks/useDeliveryData';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
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

export function DeliveryHome() {
  const { user } = useAuth();
  
  // Fetch real data
  const { data: profile, isLoading: profileLoading } = useDeliveryProfile();
  const { data: stats, isLoading: statsLoading } = useDeliveryStats();
  const { data: activeDelivery, isLoading: activeLoading } = useActiveDelivery();
  const { data: pendingDeliveries, isLoading: pendingLoading } = usePendingDeliveries();
  const { data: deliveryHistory } = useDeliveryHistory(5);
  
  const acceptDelivery = useAcceptDelivery();
  const updateStatus = useUpdateDeliveryStatus();
  const toggleAvailability = useToggleAvailability();

  const isOnline = profile?.is_available ?? false;
  const isVerified = profile?.is_verified ?? false;

  // Debug logging
  console.log('Profile:', { isOnline, isVerified, profile });
  console.log('Pending deliveries:', pendingDeliveries);

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    try {
      await toggleAvailability.mutateAsync(newStatus);
      // Wait a bit for the mutation to complete and queries to refetch
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(newStatus ? 'You are now online' : 'You are now offline');
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAcceptDelivery = async (assignmentId: string) => {
    try {
      await acceptDelivery.mutateAsync(assignmentId);
      toast.success('🎉 Delivery accepted!', {
        description: 'Navigate to the restaurant to pick up the order',
      });
    } catch (error: any) {
      console.error('Accept delivery error:', error);
      
      // Handle race condition - order was taken by another partner
      if (error.message === 'ORDER_ALREADY_TAKEN') {
        toast.error('Order already taken!', {
          description: 'Another delivery partner accepted this order first. Try another one!',
        });
      } else if (error.message === 'ORDER_NO_LONGER_AVAILABLE') {
        toast.error('Order no longer available', {
          description: 'This order has been cancelled or modified',
        });
      } else {
        toast.error('Failed to accept delivery', {
          description: 'Please try again',
        });
      }
    }
  };

  const handleUpdateStatus = async (assignmentId: string, status: 'picked_up' | 'in_transit' | 'delivered') => {
    try {
      await updateStatus.mutateAsync({ assignmentId, status });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DeliverySidebar />
        
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-foreground">
                    Welcome, {user?.name?.split(' ')[0] || 'Partner'}!
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {isOnline ? 'Ready to earn?' : 'Go online to start earning'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  size="sm"
                  variant={isOnline ? "default" : "outline"}
                  onClick={handleToggleOnline}
                  disabled={toggleAvailability.isPending}
                  className={`text-xs sm:text-sm ${isOnline ? "bg-success hover:bg-success/90" : ""}`}
                >
                  <div className={`w-2 h-2 rounded-full mr-1.5 sm:mr-2 ${isOnline ? 'bg-white' : 'bg-muted-foreground'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Today's Stats */}
            <FadeIn>
              {statsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-foreground">{stats?.todayDeliveries || 0}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Deliveries</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-success/20 flex items-center justify-center">
                          <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                        </div>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-foreground">{formatPrice(stats?.todayEarnings || 0)}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Earned</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-foreground">{stats?.totalDistance || 0} km</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Distance</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hidden sm:block">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                        </div>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-foreground">{stats?.averageRating || 'N/A'}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 border-secondary hidden lg:block">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-lg sm:text-2xl font-bold text-foreground">{stats?.onlineHours || 0}h</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Online</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </FadeIn>

            {/* Active Delivery */}
            {activeLoading ? (
              <Skeleton className="h-64 rounded-2xl" />
            ) : activeDelivery ? (
              <FadeIn delay={0.1}>
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Active Delivery
                      </CardTitle>
                      <Badge className="bg-primary/20 text-primary border-0 text-xs">
                        {activeDelivery.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm sm:text-base">
                          {activeDelivery.order?.store?.name || 'Restaurant'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Order #{activeDelivery.order_id.slice(0, 8)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground text-sm sm:text-base">
                          {formatPrice(Number(activeDelivery.order?.total_amount) || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-2.5 sm:p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                            activeDelivery.status === 'picked_up' || activeDelivery.status === 'in_transit' 
                              ? 'bg-success/20' : 'bg-primary/20'
                          }`}>
                            <CheckCircle2 className={`w-3 h-3 sm:w-4 sm:h-4 ${
                              activeDelivery.status === 'picked_up' || activeDelivery.status === 'in_transit' 
                                ? 'text-success' : 'text-primary'
                            }`} />
                          </div>
                          <span className={`text-[10px] sm:text-xs font-medium ${
                            activeDelivery.status === 'picked_up' || activeDelivery.status === 'in_transit' 
                              ? 'text-success' : 'text-primary'
                          }`}>
                            {activeDelivery.picked_up_at ? 'Picked Up' : 'Pickup Location'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground line-clamp-2">
                          {activeDelivery.order?.store?.address || 'Store address'}
                        </p>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-primary">Deliver To</span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground line-clamp-2">
                          {activeDelivery.order?.delivery_address || 'Delivery address'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs h-9">
                        <Phone className="w-3 h-3 mr-1" />
                        Call Customer
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs h-9">
                        <Navigation className="w-3 h-3 mr-1" />
                        Navigate
                      </Button>
                      
                      {activeDelivery.status === 'accepted' && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-primary text-xs h-9"
                          onClick={() => handleUpdateStatus(activeDelivery.id, 'picked_up')}
                          disabled={updateStatus.isPending}
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Mark Picked Up
                        </Button>
                      )}
                      
                      {(activeDelivery.status === 'picked_up' || activeDelivery.status === 'in_transit') && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-success hover:bg-success/90 text-xs h-9"
                          onClick={() => handleUpdateStatus(activeDelivery.id, 'delivered')}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ) : null}

            {/* Pending Orders */}
            <FadeIn delay={0.2}>
              <Card>
                <CardHeader className="px-4 sm:px-6 py-4">
                  <CardTitle className="text-foreground text-base sm:text-lg">
                    Available Orders {pendingDeliveries && pendingDeliveries.length > 0 && `(${pendingDeliveries.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  {!isVerified ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto text-warning mb-3" />
                      <p className="text-warning font-semibold mb-1">Account Pending Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Your account is under review by the admin. You'll be able to accept orders once verified.
                      </p>
                    </div>
                  ) : !isOnline ? (
                    <div className="text-center py-8">
                      <Zap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground font-semibold mb-1">You're Currently Offline</p>
                      <p className="text-sm text-muted-foreground">
                        Go online to start receiving delivery requests
                      </p>
                    </div>
                  ) : pendingLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                      ))}
                    </div>
                  ) : !pendingDeliveries || pendingDeliveries.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No available orders right now</p>
                      <p className="text-sm text-muted-foreground">Stay online to receive new orders</p>
                    </div>
                  ) : (
                    <FadeInStagger className="space-y-3" staggerDelay={0.05}>
                      {pendingDeliveries.map((delivery) => (
                        <FadeInStaggerItem key={delivery.id}>
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="rounded-xl border border-border hover:border-primary/40 transition-all bg-gradient-to-r from-background to-primary/5 shadow-sm"
                          >
                            <div className="p-3 sm:p-4 flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground text-sm sm:text-base">
                                      {delivery.order?.store?.name || 'Restaurant'}
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xs">
                                      {delivery.order?.delivery_address || 'Address not available'}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-[10px] sm:text-xs capitalize">
                                  {delivery.order?.status || 'dispatched'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                                <div className="bg-background/80 border border-border/60 rounded-lg px-3 py-2">
                                  <p className="text-[10px] sm:text-xs">Order Value</p>
                                  <p className="text-foreground font-semibold">{formatPrice(Number(delivery.order?.total_amount || 0))}</p>
                                </div>
                                <div className="bg-background/80 border border-border/60 rounded-lg px-3 py-2">
                                  <p className="text-[10px] sm:text-xs">Est. Earnings</p>
                                  <p className="text-success font-semibold">+{formatPrice(Number(delivery.order?.total_amount || 0) * 0.1 + 30)}</p>
                                </div>
                                <div className="bg-background/80 border border-border/60 rounded-lg px-3 py-2">
                                  <p className="text-[10px] sm:text-xs">Payout Speed</p>
                                  <p className="text-foreground font-semibold">Instant</p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span>Pickup & drop details in next step</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-xs h-8 sm:h-9"
                                    onClick={() => handleAcceptDelivery(delivery.id)}
                                    disabled={acceptDelivery.isPending || !!activeDelivery}
                                  >
                                    Details
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="text-xs h-8 sm:h-9"
                                    onClick={() => handleAcceptDelivery(delivery.id)}
                                    disabled={acceptDelivery.isPending || !!activeDelivery}
                                  >
                                    Accept
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </FadeInStaggerItem>
                      ))}
                    </FadeInStagger>
                  )}
                </CardContent>
              </Card>
            </FadeIn>

            {/* Recent Deliveries */}
            {deliveryHistory && deliveryHistory.length > 0 && (
              <FadeIn delay={0.3}>
                <Card>
                  <CardHeader className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground text-base sm:text-lg">Recent Deliveries</CardTitle>
                      <Link to="/delivery/history">
                        <Button variant="ghost" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="space-y-3">
                      {deliveryHistory.slice(0, 3).map((delivery) => (
                        <div
                          key={delivery.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              delivery.status === 'delivered' ? 'bg-success/20' : 'bg-destructive/20'
                            }`}>
                              <CheckCircle2 className={`w-4 h-4 ${
                                delivery.status === 'delivered' ? 'text-success' : 'text-destructive'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{delivery.order?.store?.name || 'Restaurant'}</p>
                              <p className="text-xs text-muted-foreground">
                                {delivery.delivered_at 
                                  ? new Date(delivery.delivered_at).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-success">
                            +{formatPrice(Number(delivery.order?.total_amount || 0) * 0.1 + 30)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
