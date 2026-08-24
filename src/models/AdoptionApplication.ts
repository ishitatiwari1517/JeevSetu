// ─── Adoption Application Model ───────────────────────────────────────────────
// Full lifecycle from first application to post-adoption follow-up.

export type AdoptionStatus =
  | 'submitted'                  // Application received
  | 'under_review'               // Staff reviewing
  | 'home_visit_scheduled'
  | 'home_visit_completed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'approved'
  | 'rejected'
  | 'completed'                  // Animal handed over
  | 'returned';                  // Animal came back

export type HousingType =
  | 'house_with_garden'
  | 'apartment'
  | 'farm'
  | 'house_no_garden'
  | 'other';

export interface FollowUp {
  completedAt?: string;
  conductedBy?: string;
  animalCondition: 'excellent' | 'good' | 'concerning';
  notes?: string;
  photosReceived: boolean;
}

export interface AdoptionApplication {
  id: string;
  organizationId: string;
  animalId: string;
  animalCaseId?: string;     // Denormalised
  animalName?: string;       // Denormalised

  // ── Applicant ──────────────────────────────────────────────────────────────
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  applicantAddress: string;
  applicantCity: string;

  // ── Screening ──────────────────────────────────────────────────────────────
  housingType: HousingType;
  hasOutdoorSpace: boolean;
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  hasChildren: boolean;
  childrenAges?: string;
  workingHoursPerDay: number;
  previousPetExperience?: string;
  reasonForAdoption: string;

  // ── Workflow ───────────────────────────────────────────────────────────────
  status: AdoptionStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  homeVisitDate?: string;
  homeVisitCompletedBy?: string;
  homeVisitNotes?: string;
  interviewDate?: string;
  interviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // ── Post-Adoption ──────────────────────────────────────────────────────────
  adoptionDate?: string;
  agreementSignedAt?: string;
  followUp30Day?: FollowUp;
  followUp90Day?: FollowUp;
  followUp1Year?: FollowUp;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateAdoptionApplicationInput = Omit<
  AdoptionApplication,
  'id' | 'status' | 'createdAt' | 'updatedAt'
>;

export type UpdateAdoptionApplicationInput = Partial<
  Omit<AdoptionApplication, 'id' | 'organizationId' | 'animalId' | 'createdAt'>
>;
