import { User, Vehicle, Service, Location, Booking, Transaction, Notification, LoyaltyInfo, DetailerSchedule, Earning, AnalyticsData } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'James Mwangi', email: 'james@email.com', phone: '+254712345678', role: 'customer', avatar: '', walletAddress: '0x1234...5678', createdAt: '2024-01-15', isVerified: true },
  { id: 'u2', name: 'Grace Wanjiku', email: 'grace@email.com', phone: '+254723456789', role: 'customer', avatar: '', createdAt: '2024-02-20', isVerified: true },
  { id: 'u3', name: 'Peter Ochieng', email: 'peter@email.com', phone: '+254734567890', role: 'detailer', avatar: '', createdAt: '2024-01-10', isVerified: true },
  { id: 'u4', name: 'Mary Akinyi', email: 'mary@email.com', phone: '+254745678901', role: 'detailer', avatar: '', createdAt: '2024-03-05', isVerified: true },
  { id: 'u5', name: 'David Kamau', email: 'david@email.com', phone: '+254756789012', role: 'owner', avatar: '', walletAddress: '0xabcd...ef01', createdAt: '2023-11-01', isVerified: true },
  { id: 'u6', name: 'Sarah Njeri', email: 'sarah@email.com', phone: '+254767890123', role: 'admin', avatar: '', createdAt: '2023-10-01', isVerified: true },
  { id: 'u7', name: 'Kevin Otieno', email: 'kevin@email.com', phone: '+254778901234', role: 'customer', avatar: '', createdAt: '2024-04-12', isVerified: false },
  { id: 'u8', name: 'Lilian Wambui', email: 'lilian@email.com', phone: '+254789012345', role: 'detailer', avatar: '', createdAt: '2024-05-01', isVerified: true },
];

export const mockVehicles: Vehicle[] = [
  { id: 'v1', customerId: 'u1', make: 'Toyota', model: 'Prado', year: 2022, color: 'White', licensePlate: 'KDA 123A' },
  { id: 'v2', customerId: 'u1', make: 'Mercedes', model: 'C200', year: 2021, color: 'Black', licensePlate: 'KDB 456B' },
  { id: 'v3', customerId: 'u2', make: 'Subaru', model: 'Forester', year: 2020, color: 'Blue', licensePlate: 'KCC 789C' },
  { id: 'v4', customerId: 'u7', make: 'Nissan', model: 'X-Trail', year: 2023, color: 'Silver', licensePlate: 'KDE 012D' },
];

export const mockServices: Service[] = [
  { id: 's1', name: 'Express Wash', description: 'Quick exterior wash with hand dry', price: 500, duration: 30, category: 'Basic', ownerId: 'u5', isActive: true },
  { id: 's2', name: 'Full Detail', description: 'Complete interior and exterior deep clean', price: 3000, duration: 120, category: 'Premium', ownerId: 'u5', isActive: true },
  { id: 's3', name: 'Interior Clean', description: 'Dashboard, seats, carpets, and console deep clean', price: 1500, duration: 60, category: 'Standard', ownerId: 'u5', isActive: true },
  { id: 's4', name: 'Engine Wash', description: 'Professional engine bay cleaning and dressing', price: 2000, duration: 45, category: 'Specialty', ownerId: 'u5', isActive: true },
  { id: 's5', name: 'Ceramic Coating', description: 'Premium ceramic paint protection coating', price: 15000, duration: 240, category: 'Premium', ownerId: 'u5', isActive: true },
  { id: 's6', name: 'Upholstery Steam', description: 'Deep steam cleaning of all fabric surfaces', price: 2500, duration: 90, category: 'Specialty', ownerId: 'u5', isActive: true },
];

export const mockLocations: Location[] = [
  { id: 'l1', name: 'AutoFlow Westlands', address: 'Westlands Rd, Nairobi', city: 'Nairobi', ownerId: 'u5' },
  { id: 'l2', name: 'AutoFlow Karen', address: 'Karen Rd, Nairobi', city: 'Nairobi', ownerId: 'u5' },
  { id: 'l3', name: 'AutoFlow CBD', address: 'Kenyatta Ave, Nairobi', city: 'Nairobi', ownerId: 'u5' },
];

export const mockBookings: Booking[] = [
  { id: 'b1', customerId: 'u1', customerName: 'James Mwangi', vehicleId: 'v1', vehicleName: 'Toyota Prado - KDA 123A', serviceId: 's2', serviceName: 'Full Detail', servicePrice: 3000, locationId: 'l1', locationName: 'AutoFlow Westlands', detailerId: 'u3', detailerName: 'Peter Ochieng', date: '2026-02-25', time: '10:00', status: 'in_progress', paymentStatus: 'completed', paymentMethod: 'mpesa', createdAt: '2026-02-24' },
  { id: 'b2', customerId: 'u2', customerName: 'Grace Wanjiku', vehicleId: 'v3', vehicleName: 'Subaru Forester - KCC 789C', serviceId: 's1', serviceName: 'Express Wash', servicePrice: 500, locationId: 'l2', locationName: 'AutoFlow Karen', detailerId: 'u4', detailerName: 'Mary Akinyi', date: '2026-02-25', time: '14:00', status: 'confirmed', paymentStatus: 'completed', paymentMethod: 'mpesa', createdAt: '2026-02-23' },
  { id: 'b3', customerId: 'u1', customerName: 'James Mwangi', vehicleId: 'v2', vehicleName: 'Mercedes C200 - KDB 456B', serviceId: 's5', serviceName: 'Ceramic Coating', servicePrice: 15000, locationId: 'l1', locationName: 'AutoFlow Westlands', date: '2026-02-27', time: '09:00', status: 'pending', paymentStatus: 'pending', paymentMethod: 'crypto', createdAt: '2026-02-25' },
  { id: 'b4', customerId: 'u7', customerName: 'Kevin Otieno', vehicleId: 'v4', vehicleName: 'Nissan X-Trail - KDE 012D', serviceId: 's3', serviceName: 'Interior Clean', servicePrice: 1500, locationId: 'l3', locationName: 'AutoFlow CBD', detailerId: 'u3', detailerName: 'Peter Ochieng', date: '2026-02-24', time: '11:00', status: 'completed', paymentStatus: 'completed', paymentMethod: 'mpesa', rating: 5, review: 'Excellent work! Car looks brand new.', createdAt: '2026-02-22' },
  { id: 'b5', customerId: 'u2', customerName: 'Grace Wanjiku', vehicleId: 'v3', vehicleName: 'Subaru Forester - KCC 789C', serviceId: 's4', serviceName: 'Engine Wash', servicePrice: 2000, locationId: 'l2', locationName: 'AutoFlow Karen', detailerId: 'u8', detailerName: 'Lilian Wambui', date: '2026-02-20', time: '15:00', status: 'completed', paymentStatus: 'completed', paymentMethod: 'mpesa', rating: 4, review: 'Good job overall.', createdAt: '2026-02-18' },
  { id: 'b6', customerId: 'u1', customerName: 'James Mwangi', vehicleId: 'v1', vehicleName: 'Toyota Prado - KDA 123A', serviceId: 's1', serviceName: 'Express Wash', servicePrice: 500, locationId: 'l1', locationName: 'AutoFlow Westlands', detailerId: 'u4', detailerName: 'Mary Akinyi', date: '2026-02-15', time: '09:00', status: 'completed', paymentStatus: 'completed', paymentMethod: 'mpesa', rating: 5, createdAt: '2026-02-14' },
  { id: 'b7', customerId: 'u7', customerName: 'Kevin Otieno', vehicleId: 'v4', vehicleName: 'Nissan X-Trail - KDE 012D', serviceId: 's6', serviceName: 'Upholstery Steam', servicePrice: 2500, locationId: 'l3', locationName: 'AutoFlow CBD', date: '2026-02-28', time: '13:00', status: 'pending', paymentStatus: 'pending', paymentMethod: 'mpesa', createdAt: '2026-02-25' },
  { id: 'b8', customerId: 'u1', customerName: 'James Mwangi', vehicleId: 'v2', vehicleName: 'Mercedes C200 - KDB 456B', serviceId: 's3', serviceName: 'Interior Clean', servicePrice: 1500, locationId: 'l2', locationName: 'AutoFlow Karen', detailerId: 'u3', detailerName: 'Peter Ochieng', date: '2026-02-10', time: '10:00', status: 'completed', paymentStatus: 'completed', paymentMethod: 'mpesa', rating: 4, createdAt: '2026-02-08' },
];

export const mockTransactions: Transaction[] = [
  { id: 't1', bookingId: 'b1', amount: 3000, method: 'mpesa', status: 'completed', mpesaCode: 'SHK7Y8X2F1', customerName: 'James Mwangi', date: '2026-02-24' },
  { id: 't2', bookingId: 'b2', amount: 500, method: 'mpesa', status: 'completed', mpesaCode: 'QJM9P3R7K5', customerName: 'Grace Wanjiku', date: '2026-02-23' },
  { id: 't3', bookingId: 'b4', amount: 1500, method: 'mpesa', status: 'completed', mpesaCode: 'NXT4L6W8B2', customerName: 'Kevin Otieno', date: '2026-02-22' },
  { id: 't4', bookingId: 'b5', amount: 2000, method: 'mpesa', status: 'completed', mpesaCode: 'RTY2M5V9J3', customerName: 'Grace Wanjiku', date: '2026-02-18' },
  { id: 't5', bookingId: 'b6', amount: 500, method: 'mpesa', status: 'completed', mpesaCode: 'PLK8N1C4H6', customerName: 'James Mwangi', date: '2026-02-14' },
  { id: 't6', bookingId: 'b8', amount: 1500, method: 'mpesa', status: 'completed', mpesaCode: 'WQZ3T7F9A1', customerName: 'James Mwangi', date: '2026-02-08' },
  { id: 't7', bookingId: 'b3', amount: 15000, method: 'crypto', status: 'pending', customerName: 'James Mwangi', date: '2026-02-25', cryptoTxHash: '0xabc123...def456', cryptoToken: 'USDC', cryptoNetwork: 'Avalanche C-Chain' },
  { id: 't8', bookingId: 'b7', amount: 2500, method: 'cash', status: 'completed', customerName: 'Kevin Otieno', date: '2026-02-25' },
  { id: 't9', bookingId: '', amount: 4500, method: 'crypto', status: 'completed', customerName: 'Grace Wanjiku', date: '2026-02-21', cryptoTxHash: '0x789abc...123def', cryptoToken: 'USDT', cryptoNetwork: 'Avalanche C-Chain' },
  { id: 't10', bookingId: '', amount: 800, method: 'cash', status: 'completed', customerName: 'Kevin Otieno', date: '2026-02-19' },
  { id: 't11', bookingId: '', amount: 3500, method: 'card', status: 'completed', customerName: 'James Mwangi', date: '2026-02-17' },
  { id: 't12', bookingId: '', amount: 12000, method: 'crypto', status: 'failed', customerName: 'Grace Wanjiku', date: '2026-02-16', cryptoTxHash: '0xfail...0000', cryptoToken: 'USDC', cryptoNetwork: 'Avalanche C-Chain' },
  { id: 't13', bookingId: '', amount: 1000, method: 'cash', status: 'completed', customerName: 'James Mwangi', date: '2026-02-12' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'Booking Confirmed', message: 'Your Full Detail booking for Feb 25 has been confirmed.', type: 'booking', isRead: false, createdAt: '2026-02-24T10:00:00' },
  { id: 'n2', userId: 'u1', title: 'Payment Received', message: 'KES 3,000 payment via M-Pesa received successfully.', type: 'payment', isRead: false, createdAt: '2026-02-24T10:05:00' },
  { id: 'n3', userId: 'u1', title: 'Service Started', message: 'Peter Ochieng has started working on your Toyota Prado.', type: 'booking', isRead: true, createdAt: '2026-02-25T10:00:00' },
  { id: 'n4', userId: 'u5', title: 'New Booking', message: 'New booking from James Mwangi for Ceramic Coating.', type: 'booking', isRead: false, createdAt: '2026-02-25T08:00:00' },
  { id: 'n5', userId: 'u3', title: 'New Job Assigned', message: 'You have been assigned a Full Detail job for James Mwangi.', type: 'booking', isRead: true, createdAt: '2026-02-24T11:00:00' },
  { id: 'n6', userId: 'u5', title: 'Review Received', message: 'Kevin Otieno gave a 5-star review for Interior Clean.', type: 'review', isRead: false, createdAt: '2026-02-24T16:00:00' },
];

export const mockLoyalty: LoyaltyInfo = {
  totalPoints: 2450,
  tier: 'Silver',
  pointsToNextTier: 550,
  history: [
    { date: '2026-02-24', points: 300, description: 'Full Detail - Toyota Prado' },
    { date: '2026-02-15', points: 50, description: 'Express Wash - Toyota Prado' },
    { date: '2026-02-10', points: 150, description: 'Interior Clean - Mercedes C200' },
    { date: '2026-01-28', points: 200, description: 'Engine Wash - Toyota Prado' },
    { date: '2026-01-15', points: 50, description: 'Express Wash - Mercedes C200' },
  ],
};

export const mockDetailerSchedule: DetailerSchedule[] = [
  { dayOfWeek: 0, startTime: '', endTime: '', isAvailable: false },
  { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isAvailable: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isAvailable: true },
];

export const mockEarnings: Earning[] = [
  { id: 'e1', date: '2026-02-25', amount: 1200, bookingId: 'b1', serviceName: 'Full Detail', customerName: 'James Mwangi' },
  { id: 'e2', date: '2026-02-24', amount: 600, bookingId: 'b4', serviceName: 'Interior Clean', customerName: 'Kevin Otieno' },
  { id: 'e3', date: '2026-02-20', amount: 800, bookingId: 'b5', serviceName: 'Engine Wash', customerName: 'Grace Wanjiku' },
  { id: 'e4', date: '2026-02-15', amount: 200, bookingId: 'b6', serviceName: 'Express Wash', customerName: 'James Mwangi' },
  { id: 'e5', date: '2026-02-10', amount: 600, bookingId: 'b8', serviceName: 'Interior Clean', customerName: 'James Mwangi' },
];

export const mockAnalytics: AnalyticsData = {
  totalRevenue: 245000,
  totalBookings: 156,
  completedBookings: 132,
  averageRating: 4.7,
  revenueByMonth: [
    { month: 'Sep', revenue: 28000 },
    { month: 'Oct', revenue: 35000 },
    { month: 'Nov', revenue: 32000 },
    { month: 'Dec', revenue: 45000 },
    { month: 'Jan', revenue: 52000 },
    { month: 'Feb', revenue: 53000 },
  ],
  bookingsByStatus: [
    { status: 'Completed', count: 132 },
    { status: 'In Progress', count: 8 },
    { status: 'Confirmed', count: 6 },
    { status: 'Pending', count: 5 },
    { status: 'Cancelled', count: 5 },
  ],
  popularServices: [
    { name: 'Express Wash', count: 68, revenue: 34000 },
    { name: 'Full Detail', count: 35, revenue: 105000 },
    { name: 'Interior Clean', count: 28, revenue: 42000 },
    { name: 'Engine Wash', count: 15, revenue: 30000 },
    { name: 'Ceramic Coating', count: 6, revenue: 90000 },
    { name: 'Upholstery Steam', count: 4, revenue: 10000 },
  ],
  customerGrowth: [
    { month: 'Sep', customers: 45 },
    { month: 'Oct', customers: 62 },
    { month: 'Nov', customers: 78 },
    { month: 'Dec', customers: 95 },
    { month: 'Jan', customers: 118 },
    { month: 'Feb', customers: 142 },
  ],
};

export const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
