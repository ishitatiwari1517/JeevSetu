import {
  Booking,
  CreateBookingInput,
  ListBookingsFilter,
  UpdateBookingInput,
} from '../models/Booking';

export interface BookingStorage {
  list(filter?: ListBookingsFilter): Promise<Booking[]>;
  get(bookingId: string): Promise<Booking | null>;
  create(input: CreateBookingInput): Promise<Booking>;
  update(bookingId: string, patch: UpdateBookingInput): Promise<Booking>;
  delete(bookingId: string): Promise<void>;
}
