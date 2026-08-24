// ─── Animal Model ────────────────────────────────────────────────────────────
// Lifelong digital identity for every rescued / sheltered animal in PetVue.

export type Species = 'dog' | 'cat' | 'cow' | 'buffalo' | 'bird' | 'rabbit' | 'horse' | 'other';
export type Gender = 'male' | 'female' | 'unknown';
export type IntakeSource = 'street_rescue' | 'surrender' | 'transfer' | 'confiscation' | 'stray' | 'other';
export type IntakeCondition = 'critical' | 'poor' | 'fair' | 'good';
export type HealthStatus = 'critical' | 'needs_attention' | 'stable' | 'healthy';

export type AnimalStatus =
  | 'intake'         // Just arrived, assessment pending
  | 'quarantine'     // Isolation period (disease prevention)
  | 'medical_hold'   // Under active treatment
  | 'available'      // Healthy and ready for fostering/adoption
  | 'fostered'       // Currently with a foster family
  | 'adopted'        // Permanently placed
  | 'transferred'    // Moved to another shelter
  | 'deceased';

export interface Animal {
  // ── Identity ──────────────────────────────────────────────────────────────
  id: string;
  organizationId: string;
  caseId: string;             // Auto-generated e.g. "PV-2024-0391"
  name?: string;              // Optional — many strays are unnamed
  photoUrl?: string;          // Local URI or remote URL for the animal's photo

  // ── Species & Physical ────────────────────────────────────────────────────
  species: Species;
  breed?: string;
  estimatedAge?: string;      // Free text: "~2 years", "8 months"
  gender: Gender;
  weightKg?: number;
  colorMarkings?: string;     // "Brown with white patch on chest"
  microchipId?: string;

  // ── Rescue / Intake ───────────────────────────────────────────────────────
  intakeDate: string;         // ISO date string
  intakeSource: IntakeSource;
  intakeLocation?: string;    // "Near Sector 14 Market, Delhi"
  rescuedBy?: string;         // Staff / volunteer name
  intakeCondition: IntakeCondition;
  intakeNotes?: string;

  // ── Current Status ────────────────────────────────────────────────────────
  status: AnimalStatus;
  kennelNumber?: string;      // Physical location in shelter
  assignedCarerId?: string;   // Staff / volunteer responsible today

  // ── Health Overview ───────────────────────────────────────────────────────
  isNeutered: boolean;
  isVaccinated: boolean;
  healthStatus: HealthStatus;

  // ── Behaviour & Care ─────────────────────────────────────────────────────
  behaviourNotes?: string;      // "Fearful of men, good with other dogs"
  dietaryRequirements?: string;
  specialNeeds?: string;        // "Needs twice daily insulin injection"
  isGoodWithKids?: boolean;
  isGoodWithDogs?: boolean;
  isGoodWithCats?: boolean;

  // ── Adoption ──────────────────────────────────────────────────────────────
  isAdoptionReady: boolean;
  adoptionListingPublic: boolean;
  adoptionDescription?: string; // Written description for potential adopters

  // ── AI Adoption Summary ────────────────────────────────────────────────────
  aiAdoptionSummary?: string;           // AI-generated text, editable by staff
  aiSummaryGeneratedAt?: string;        // ISO timestamp of last generation
  aiSummaryStatus?: 'draft' | 'published' | 'none'; // staff review state

  // ── QR Code & Public Profile ───────────────────────────────────────────────
  publicProfileEnabled?: boolean;       // Staff toggles public visibility (default true)
  publicProfileSlug?: string;           // Stable slug: mirrors caseId e.g. "PV-2024-0391"
  qrGeneratedAt?: string;               // ISO timestamp when QR was first generated

  // ── Photos ────────────────────────────────────────────────────────────────
  primaryPhotoUri?: string;
  photoUris: string[];

  // ── Timestamps ────────────────────────────────────────────────────────────
  createdAt: string;
  updatedAt: string;
}

// Input type for creating a new animal (intake)
export type CreateAnimalInput = Omit<
  Animal,
  'id' | 'organizationId' | 'caseId' | 'createdAt' | 'updatedAt'
>;

// Input type for updating an animal record
export type UpdateAnimalInput = Partial<
  Omit<Animal, 'id' | 'organizationId' | 'caseId' | 'createdAt'>
>;

// Filters for listing animals
export type ListAnimalsFilter = {
  species?: Species;
  status?: AnimalStatus;
  healthStatus?: HealthStatus;
  isAdoptionReady?: boolean;
  assignedCarerId?: string;
  search?: string;           // Name or caseId substring
};
