import {
  Booking,
  CreateBookingInput,
  ListBookingsFilter,
  UpdateBookingInput,
} from '../models/Booking';
import { remoteBookingStorage } from './bookingStorage.remote';
import { BookingStorage } from './bookingStorage';

const storage: BookingStorage = remoteBookingStorage;

export const listBookings = (filter?: ListBookingsFilter): Promise<Booking[]> =>
  storage.list(filter);

export const getBooking = (bookingId: string): Promise<Booking | null> =>
  storage.get(bookingId);

export const createBooking = (input: CreateBookingInput): Promise<Booking> =>
  storage.create(input);

export const updateBooking = (
  bookingId: string,
  patch: UpdateBookingInput,
): Promise<Booking> => storage.update(bookingId, patch);

export const cancelBooking = (
  bookingId: string,
  reason?: string,
): Promise<Booking> =>
  storage.update(bookingId, { status: 'cancelled', cancellationReason: reason });

export const confirmBooking = (bookingId: string): Promise<Booking> =>
  storage.update(bookingId, { status: 'confirmed' });

export const completeBooking = (bookingId: string): Promise<Booking> =>
  storage.update(bookingId, { status: 'completed' });

export const deleteBooking = (bookingId: string): Promise<void> =>
  storage.delete(bookingId);
