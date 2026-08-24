export type ActivityType = 'walk' | 'play' | 'run' | 'training' | 'other';

export interface ActivityLog {
  activityLogId: string;
  petId: string;
  userId: string;
  activityType: ActivityType;
  durationMinutes: number;
  distanceKm?: number;
  loggedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateActivityLogInput = {
  activityType: ActivityType;
  durationMinutes: number;
  loggedAt: string;
  distanceKm?: number;
  notes?: string;
};

export type UpdateActivityLogInput = Partial<
  Pick<ActivityLog, 'activityType' | 'durationMinutes' | 'distanceKm' | 'loggedAt' | 'notes'>
>;
