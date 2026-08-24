export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type BookingServiceType =
  | 'vet-visit'
  | 'grooming'
  | 'training'
  | 'boarding'
  | 'walking'
  | 'other';

export interface Booking {
  bookingId: string;
  userId: string;
  petId: string;
  serviceType: BookingServiceType;
  providerId?: string;
  providerName?: string;
  scheduledAt: string;
  durationMinutes?: number;
  location?: string;
  notes?: string;
  status: BookingStatus;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateBookingInput = {
  petId: string;
  serviceType: BookingServiceType;
  scheduledAt: string;
  providerId?: string;
  providerName?: string;
  durationMinutes?: number;
  location?: string;
  notes?: string;
};

export type UpdateBookingInput = Partial<
  Pick<
    Booking,
    | 'serviceType'
    | 'providerId'
    | 'providerName'
    | 'scheduledAt'
    | 'durationMinutes'
    | 'location'
    | 'notes'
    | 'status'
    | 'cancellationReason'
  >
>;

export type ListBookingsFilter = {
  petId?: string;
  status?: BookingStatus;
  from?: string;
  to?: string;
};
