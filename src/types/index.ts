export type UserRole = 'customer' | 'vendor' | 'admin' | 'delivery';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  preparationTime: number; // in minutes
}

export interface Order {
  id: string;
  customerId: string;
  vendorId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  deliveryAddress?: string;
  notes?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  banner?: string;
  rating: number;
  isActive: boolean;
  branches: Branch[];
  createdAt: Date;
}

export interface Branch {
  id: string;
  vendorId: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  vendorId: string;
  branchId?: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  lastUpdated: Date;
}

export interface CartItem extends OrderItem {
  menuItem: MenuItem;
}

export interface Cart {
  vendorId: string;
  items: CartItem[];
  total: number;
}

export interface Review {
  id: string;
  store_id: string;
  customer_id: string;
  order_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}
