export type UserRole = 'customer' | 'detailer' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  walletAddress?: string;
  createdAt: string;
  isVerified: boolean;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  category: string;
  image?: string;
  ownerId: string;
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  ownerId: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'mpesa' | 'crypto' | 'card';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  locationId: string;
  locationName: string;
  detailerId?: string;
  detailerName?: string;
  date: string;
  time: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  beforePhotos?: string[];
  afterPhotos?: string[];
  rating?: number;
  review?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  mpesaCode?: string;
  customerName: string;
  date: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'review' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface LoyaltyInfo {
  totalPoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  pointsToNextTier: number;
  history: { date: string; points: number; description: string }[];
}

export interface DetailerSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Earning {
  id: string;
  date: string;
  amount: number;
  bookingId: string;
  serviceName: string;
  customerName: string;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  averageRating: number;
  revenueByMonth: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  popularServices: { name: string; count: number; revenue: number }[];
  customerGrowth: { month: string; customers: number }[];
}
