// --- User Types -----------------------------------------------
export type UserRole = 'ADMIN' | 'SELLER' | 'BUYER';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  countryCode?: string;
  avatar?: string;
  banner?: string;
  type: UserRole;
  profileStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  walletAmount: number;
  holdAmount: number;
  totalEarningAmount: number;
  totalConnects: number;
  totalCompletedJobs: number;
  avgRating: number;
  totalRating: number;
  bio?: string;
  categoryId?: number;
  step: number;
  created: string;
}

// --- Auth -----------------------------------------------------
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// --- Service --------------------------------------------------
export type ServiceType = 'Service' | 'Job';
export type ServiceStatus = 'OPEN' | 'CLOSED' | 'BOOKED';

export interface Service {
  id: number;
  title: string;
  description: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  type: ServiceType;
  status: ServiceStatus;
  categoryId: number;
  countryId: number;
  userId: number;
  user?: Partial<User>;
  tags?: Tag[];
  images?: { id: number; url: string }[];
  recievedBid?: number;
  created: string;
}

// --- Booking --------------------------------------------------
export type BookingStatus =
  | 'Pending'
  | 'Ongoing'
  | 'Cancelled'
  | 'Amidst-Cancellation'
  | 'Amidst-Completion-Process'
  | 'Completed'
  | 'In-dispute';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';

export interface Booking {
  id: number;
  title: string;
  description?: string;
  price: number;
  platformFee: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  buyerId: number;
  sellerId: number;
  buyer?: Partial<User>;
  seller?: Partial<User>;
  serviceId?: number;
  offerId?: number;
  settlementAmount?: number;
  refundAmount?: number;
  isRated: boolean;
  created: string;
}

// --- Offer ----------------------------------------------------
export type OfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'WithDrawn';

export interface Offer {
  id: number;
  title: string;
  description?: string;
  price: number;
  counterPrice?: number;
  status: OfferStatus;
  buyerId: number;
  sellerId: number;
  buyer?: Partial<User>;
  seller?: Partial<User>;
  offerBy: 'BUYER' | 'SELLER';
  created: string;
}

// --- Bid ------------------------------------------------------
export type BidStatus = 'Pending' | 'Accepted' | 'Rejected' | 'WithDrawn';

export interface Bid {
  id: number;
  serviceId: number;
  userId: number;
  bidAmount: number;
  type: BidStatus;
  user?: Partial<User>;
  service?: Partial<Service>;
  created: string;
}

// --- Connect --------------------------------------------------
export interface Connect {
  id: number;
  planName: string;
  price: number;
  connects: number;
  discount: number;
  currency: string;
  description?: string;
  isSuspended: boolean;
}

// --- Category -------------------------------------------------
export interface Category {
  id: number;
  name: string;
  image?: string;
  isActive: boolean;
}

// --- Tag ------------------------------------------------------
export interface Tag {
  id: number;
  name: string;
}

// --- Wallet ---------------------------------------------------
export interface WalletTransaction {
  id: number;
  userId: number;
  amount: number;
  type: 'Credit' | 'Debit';
  paymentStatus: string;
  transactionId?: string;
  orderId?: string;
  payoutType?: string;
  created: string;
}

export interface WithdrawRequest {
  id: number;
  userId: number;
  amount: number;
  accountNumber: string;
  iban?: string;
  swift?: string;
  firstName: string;
  lastName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created: string;
}

// --- Notification ---------------------------------------------
export interface Notification {
  id: number;
  title: string;
  description?: string;
  type: string;
  status: string;
  isRead: boolean;
  senderId?: number;
  receiverId: number;
  metaData?: Record<string, unknown>;
  created: string;
}

// --- Chat -----------------------------------------------------
export interface ChatMessage {
  id: number;
  chatRequestId: number;
  senderId: number;
  message: string;
  type: 'text' | 'image' | 'file';
  created: string;
}

export interface ChatRoom {
  id: number;
  buyerId: number;
  sellerId: number;
  buyer?: Partial<User>;
  seller?: Partial<User>;
  lastMessage?: string;
  unreadCount?: number;
  created: string;
}

// --- API Response ---------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  totalPage: number;
}

// --- Navigation -----------------------------------------------
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}
