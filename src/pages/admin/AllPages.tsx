import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Home, 
  ShoppingCart, 
  User, 
  MapPin, 
  CreditCard, 
  Heart, 
  Bell, 
  Settings, 
  HelpCircle, 
  Package, 
  Menu,
  Truck,
  DollarSign,
  History,
  Store,
  LayoutDashboard,
  Shield,
  LogIn,
  UserPlus,
  BookOpen
} from "lucide-react";

interface PageLink {
  path: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  protected: boolean;
  role?: string;
}

export function AllPages() {
  const allPages: PageLink[] = [
    // Landing Pages
    {
      path: "/",
      title: "Customer Landing",
      description: "Main landing page for customers",
      icon: <Home className="h-5 w-5" />,
      category: "Landing",
      protected: false
    },
    {
      path: "/vendor/landing",
      title: "Vendor Landing",
      description: "Landing page for vendors",
      icon: <Store className="h-5 w-5" />,
      category: "Landing",
      protected: false
    },
    {
      path: "/admin/landing",
      title: "Admin Landing",
      description: "Landing page for administrators",
      icon: <Shield className="h-5 w-5" />,
      category: "Landing",
      protected: false
    },
    {
      path: "/delivery/landing",
      title: "Delivery Partner Landing",
      description: "Landing page for delivery partners",
      icon: <Truck className="h-5 w-5" />,
      category: "Landing",
      protected: false
    },

    // Auth Pages
    {
      path: "/login",
      title: "Customer Login",
      description: "Customer login page",
      icon: <LogIn className="h-5 w-5" />,
      category: "Auth",
      protected: false
    },
    {
      path: "/signup",
      title: "Customer Signup",
      description: "Customer registration page",
      icon: <UserPlus className="h-5 w-5" />,
      category: "Auth",
      protected: false
    },
    {
      path: "/vendor/login",
      title: "Vendor Login",
      description: "Vendor login page",
      icon: <LogIn className="h-5 w-5" />,
      category: "Auth",
      protected: false
    },
    {
      path: "/admin/login",
      title: "Admin Login",
      description: "Admin login page",
      icon: <LogIn className="h-5 w-5" />,
      category: "Auth",
      protected: false
    },
    {
      path: "/delivery/login",
      title: "Delivery Login",
      description: "Delivery partner login page",
      icon: <LogIn className="h-5 w-5" />,
      category: "Auth",
      protected: false
    },
    {
      path: "/delivery/signup",
      title: "Delivery Signup",
      description: "Delivery partner registration page",
      icon: <UserPlus className="h-5 w-5" />,
      category: "Auth",
      protected: false
    },

    // Customer Pages
    {
      path: "/home",
      title: "Customer Home",
      description: "Customer home page",
      icon: <Home className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/menu",
      title: "Menu",
      description: "Browse restaurant menu",
      icon: <Menu className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/cart",
      title: "Shopping Cart",
      description: "View and manage cart",
      icon: <ShoppingCart className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/orders",
      title: "Orders",
      description: "View order history",
      icon: <Package className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/profile",
      title: "Profile",
      description: "Manage user profile",
      icon: <User className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/addresses",
      title: "Addresses",
      description: "Manage delivery addresses",
      icon: <MapPin className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/payments",
      title: "Payments",
      description: "Manage payment methods",
      icon: <CreditCard className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/favorites",
      title: "Favorites",
      description: "View favorite items",
      icon: <Heart className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/notifications",
      title: "Notifications",
      description: "View notifications",
      icon: <Bell className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/settings",
      title: "Settings",
      description: "App settings",
      icon: <Settings className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },
    {
      path: "/help",
      title: "Help",
      description: "Help and support",
      icon: <HelpCircle className="h-5 w-5" />,
      category: "Customer",
      protected: false,
      role: "customer"
    },

    // Vendor Pages
    {
      path: "/vendor",
      title: "Vendor Home",
      description: "Vendor home page",
      icon: <Store className="h-5 w-5" />,
      category: "Vendor",
      protected: true,
      role: "vendor"
    },
    {
      path: "/vendor/dashboard",
      title: "Vendor Dashboard",
      description: "Vendor analytics dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      category: "Vendor",
      protected: true,
      role: "vendor"
    },

    // Admin Pages
    {
      path: "/admin",
      title: "Admin Home",
      description: "Admin control panel",
      icon: <Shield className="h-5 w-5" />,
      category: "Admin",
      protected: true,
      role: "admin"
    },
    {
      path: "/admin/pages",
      title: "All Pages (This Page)",
      description: "Overview of all application pages",
      icon: <BookOpen className="h-5 w-5" />,
      category: "Admin",
      protected: true,
      role: "admin"
    },

    // Delivery Pages
    {
      path: "/delivery",
      title: "Delivery Home",
      description: "Delivery partner home",
      icon: <Truck className="h-5 w-5" />,
      category: "Delivery",
      protected: true,
      role: "delivery_partner"
    },
    {
      path: "/delivery/earnings",
      title: "Earnings",
      description: "View delivery earnings",
      icon: <DollarSign className="h-5 w-5" />,
      category: "Delivery",
      protected: true,
      role: "delivery_partner"
    },
    {
      path: "/delivery/history",
      title: "Delivery History",
      description: "View delivery history",
      icon: <History className="h-5 w-5" />,
      category: "Delivery",
      protected: true,
      role: "delivery_partner"
    }
  ];

  const categories = Array.from(new Set(allPages.map(page => page.category)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">All Application Pages</h1>
          <p className="text-muted-foreground">
            Complete overview of all pages in Kitchen Cloud Hub
          </p>
          <div className="mt-4 flex gap-2">
            <Badge variant="outline">Total Pages: {allPages.length}</Badge>
            <Badge variant="outline">Categories: {categories.length}</Badge>
          </div>
        </div>

        {categories.map(category => {
          const categoryPages = allPages.filter(page => page.category === category);
          
          return (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                {category}
                <Badge variant="secondary">{categoryPages.length}</Badge>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPages.map(page => (
                  <Card key={page.path} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {page.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{page.title}</CardTitle>
                            {page.protected && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                Protected
                              </Badge>
                            )}
                            {page.role && (
                              <Badge variant="outline" className="mt-1 ml-1 text-xs">
                                {page.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <CardDescription>{page.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {page.path}
                        </code>
                        <Link to={page.path}>
                          <Button variant="outline" className="w-full" size="sm">
                            Visit Page
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Navigation Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Protected pages require authentication with the specified role</li>
            <li>Click "Visit Page" to navigate to any page</li>
            <li>Use your browser's back button to return to this overview</li>
            <li>This page is only accessible to admin users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
