export type UserRole = 'customer' | 'provider';

export type ServiceType = 'onsite_repair' | 'towing' | 'fuel_delivery';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isAvailable?: boolean; // For providers
  vehicleTypesHandled?: ('bike' | 'car')[]; // For providers
  createdAt: number;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  providerId: string | null;
  vehicleType: 'bike' | 'car';
  vehicleNumber: string;
  vehicleModel: string;
  issueDescription: string;
  serviceType: ServiceType;
  locationText: string;
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
  estimatedPrice?: number;
}

export const SERVICE_TYPES: { id: ServiceType; label: string; icon: string }[] = [
  { id: 'onsite_repair', label: 'On-site Repair', icon: 'wrench' },
  { id: 'towing', label: 'Towing Service', icon: 'truck' },
  { id: 'fuel_delivery', label: 'Fuel Delivery', icon: 'fuel' },
];