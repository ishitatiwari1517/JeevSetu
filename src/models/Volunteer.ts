// ─── Volunteer Models ─────────────────────────────────────────────────────────

export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type VolunteerStatus = 'active' | 'inactive' | 'on_leave';
export type ShiftPreference = 'morning' | 'afternoon' | 'evening' | 'flexible';
export type VolunteerSkill =
  | 'animal_handling'
  | 'veterinary_assist'
  | 'dog_training'
  | 'photography'
  | 'social_media'
  | 'driving'
  | 'first_aid'
  | 'fundraising'
  | 'admin'
  | 'foster_care'
  | 'cattle_handling';

export type TaskType =
  | 'feed'
  | 'medicate'
  | 'exercise'
  | 'groom'
  | 'socialize'
  | 'transport'
  | 'clean'
  | 'rescue'
  | 'health_check'
  | 'other';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'missed' | 'skipped';
export type ShiftStatus = 'scheduled' | 'checked_in' | 'completed' | 'missed' | 'cancelled';

// ── Volunteer ─────────────────────────────────────────────────────────────────
export interface Volunteer {
  id: string;
  organizationId: string;
  userId?: string;           // Cognito user ID if they have app login
  name: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;

  // Skills & Capabilities
  skills: VolunteerSkill[];
  canDoMedicalAssist: boolean;
  canDoRescue: boolean;
  canDrive: boolean;
  canFoster: boolean;
  vehicleAvailable: boolean;

  // Availability
  availableDays: Day[];
  preferredShift: ShiftPreference;

  // Performance
  totalHoursLogged: number;
  totalShiftsCompleted: number;
  totalShiftsMissed: number;

  // Status
  status: VolunteerStatus;
  onboardingCompleted: boolean;
  idVerified: boolean;
  joinedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateVolunteerInput = Omit<
  Volunteer,
  'id' | 'totalHoursLogged' | 'totalShiftsCompleted' | 'totalShiftsMissed' | 'createdAt' | 'updatedAt'
>;

// ── Volunteer Shift ───────────────────────────────────────────────────────────
export interface VolunteerShift {
  id: string;
  organizationId: string;
  volunteerId: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  hoursLogged?: number;
  status: ShiftStatus;
  tasksAssigned: string[];   // VolunteerTask IDs
  notes?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateShiftInput = Omit<VolunteerShift, 'id' | 'createdAt' | 'updatedAt'>;

// ── Volunteer Task ─────────────────────────────────────────────────────────────
export interface VolunteerTask {
  id: string;
  organizationId: string;
  shiftId?: string;
  assignedTo: string;        // volunteerId
  animalId?: string;         // If task is for a specific animal
  animalName?: string;       // Denormalised for display
  animalCaseId?: string;
  taskType: TaskType;
  title: string;             // "Feed kennel block B", "Give Rufus antibiotics"
  description?: string;
  scheduledFor: string;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly';
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = Omit<VolunteerTask, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskInput = Partial<Omit<VolunteerTask, 'id' | 'organizationId' | 'createdAt'>>;
