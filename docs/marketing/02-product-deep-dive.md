# PetVue — Product Deep Dive

> *Marketing cannot sell what it doesn't understand. This is the most important document in the pack.*

---

## Core Features Overview

| # | Feature | Status | Key Screen |
|---|---------|--------|------------|
| 1 | AI Health Scan | ✅ Live | `ScanPetScreen` → `ScanProcessingScreen` → `ScanResultScreen` |
| 2 | Multi-Image Capture | ✅ Live | `MultiImageCaptureScreen` |
| 3 | Pet Profile Management | ✅ Live | `PetFormScreen` / `ProfileScreen` |
| 4 | Vet Booking | ✅ Live (UI) | `BookScreen` / `BookingConfirmationScreen` |
| 5 | Pet Shop / Marketplace | ✅ Live (UI) | `ShopScreen` |
| 6 | Pre-Visit Intake Form | ✅ Live | `IntakeFormScreen` |
| 7 | Scan History & Health Timeline | ✅ Live | `ProfileScreen` → History tab |
| 8 | Vet Finder (Nearby) | ✅ Backend wired | `vetFinderService.ts` |
| 9 | Reminders & Notifications | 🔶 Scaffolded | `reminderService.ts` |
| 10 | Vaccination Timeline | 🔜 Phase 3 | Planned |

---

## Feature 1: AI Health Scan

### What It Does
The user uploads or captures a photo of their pet. PetVue's AI engine analyzes the image and returns a comprehensive health assessment — including detected conditions, risk level, confidence scores, observed concerns, precautionary steps, and when to seek veterinary help.

### Why It Matters
This is the **core product**. It's the reason PetVue exists. Pet owners currently have zero tools to interpret what they see — a watery eye, a patch of hair loss, unusual lethargy. PetVue gives them an AI co-pilot that speaks in plain language.

### User Benefit
- **Instant peace of mind** — or early warning when something is wrong
- **Actionable next steps** — not just "see a vet" but specific precautionary measures
- **Confidence scoring** — so users understand the reliability of each finding

### Technical Implementation Summary
- **AI Model**: Anthropic Claude Haiku 4.5 (vision model)
- **Pipeline**: User photo → Base64 encoding → AWS Lambda (`aiScan`) → Claude API → JSON response → Normalized result
- **Output Schema**: Multi-finding format with `overallStatus` (HEALTHY / NEEDS_ATTENTION / URGENT), individual findings with `condition`, `confidence` (0–100), `severity` (HEALTHY / MONITOR / SEE_VET / EMERGENCY), `visibleIndicators`, `plainLanguage` explanation
- **Cost**: ~$0.006 per multi-image scan (6 images)
- **Response Time**: 5–15 seconds depending on image complexity

### Scan Result Contents
| Field | Description |
|-------|-------------|
| `overallStatus` | HEALTHY, NEEDS_ATTENTION, or URGENT |
| `findings[]` | Array of detected conditions with severity & confidence |
| `riskLevel` | Low, Moderate, or High |
| `riskJustification` | Why this risk level was assigned |
| `observedConcerns` | Visible signs the AI detected |
| `referencePoints` | Educational context for the owner |
| `precautionarySteps` | Numbered action items before the vet visit |
| `whenToSeekVet` | Specific triggers that warrant immediate vet attention |
| `disclaimer` | Legal/medical disclaimer |

---

## Feature 2: Multi-Image Capture

### What It Does
Users can capture 2–6 photos of their pet from different angles. The system selects the best images (filtering out poor-quality shots) and submits them for ensemble AI analysis.

### Why It Matters
A single image often isn't enough for reliable assessment. Multiple angles give the AI more data points, resulting in higher-confidence findings.

### User Benefit
- Higher accuracy and confidence in results
- Guided photo capture (quality indicators per image)
- Users feel they've given the AI enough to work with

### Technical Implementation Summary
- **Client**: `MultiImageCaptureScreen.js` — camera interface with quality feedback per captured image
- **Quality Assessment**: Each image is tagged as `good`, `acceptable`, or `poor`
- **Upload**: Phase 2 pipeline uses presigned S3 URLs for parallel upload (avoids base64 payload limits)
- **Processing**: SQS queue → `scanWorker` Lambda → Claude processes all images → DynamoDB stores result
- **Polling**: Client polls `/scan/{id}/result` every 2 seconds until status is `complete` (60s timeout)

---

## Feature 3: Pet Profile Management

### What It Does
Users create and manage detailed profiles for their pets — name, breed, gender, date of birth, weight, and avatar photo.

### Why It Matters
Personalized profiles unlock personalized recommendations. Every scan, booking, and reminder is contextual to the pet's identity.

### User Benefit
- All pet data in one place
- Age, weight, and breed displayed on the home screen
- Foundation for future breed-specific recommendations

### Technical Implementation Summary
- **Storage**: Currently AsyncStorage (local), with DynamoDB backend spec'd and ready for deployment
- **Schema**: `id`, `userId`, `name`, `breed`, `gender`, `dob` (ISO date), `weightKg`, `avatarKey`, `createdAt`, `updatedAt`
- **API** (planned): REST endpoints `GET/POST/PATCH/DELETE /pets` with Cognito JWT auth

---

## Feature 4: Vet Booking

### What It Does
Users select a service type (Vet Visit, Grooming, Vaccination), choose a provider, pick a date and time slot, and confirm the booking — all within the app.

### Why It Matters
The scan-to-action gap is the biggest drop-off in pet health apps. PetVue closes it by embedding booking directly into the post-scan flow.

### User Benefit
- One-tap booking after a concerning scan result
- Provider selection with ratings and distance
- Confirmation with appointment details

### Technical Implementation Summary
- **Providers**: Currently hardcoded sample data (3 providers with ratings, reviews, distance)
- **Flow**: `BookScreen` → date/time selection → `BookingConfirmationScreen`
- **Planned**: Integration with real vet provider APIs and Google Places

---

## Feature 5: Pet Shop / Marketplace

### What It Does
An in-app marketplace for pet food, toys, vitamins, and accessories — with category filtering, quantity management, and a floating cart bar.

### Why It Matters
Revenue channel + user convenience. If a scan recommends dietary supplements, the user can purchase them immediately.

### User Benefit
- Curated, premium pet products
- Quick add-to-cart with quantity controls
- Category-based browsing (Food, Toys, Vitamins, Accessories)

### Technical Implementation Summary
- **Products**: Currently hardcoded (8 sample products with pricing, categories, tags like "Best Seller", "Vet Approved")
- **Cart**: Local state management with quantity tracking and total price calculation
- **Planned**: Real product catalog via affiliate API integration

---

## Feature 6: Pre-Visit Intake Form

### What It Does
A guided, multi-step form that collects symptom information before a vet visit — primary symptoms, severity, duration/frequency, recent changes, and additional notes. Includes emergency detection that flags severe cases.

### Why It Matters
Vets spend significant time gathering symptom history. This form pre-fills that information, making the visit more efficient and productive.

### User Benefit
- Structured symptom reporting (no forgetting details)
- Emergency detection banner when symptoms are severe
- Auto-save drafts every 5 seconds
- Voice-to-text input option

### Technical Implementation Summary
- **Steps**: Symptoms → Severity → Duration/Frequency → Recent Changes → Notes → Review & Submit
- **Emergency Detection**: `detectEmergency()` utility flags dangerous symptom combinations
- **Persistence**: Auto-saves to AsyncStorage every 5 seconds, loads draft on re-open
- **Submission**: Sends to backend API via `submitIntakeForm()`

---

## Feature 7: Scan History & Health Timeline

### What It Does
A chronological list of all past AI scans, showing the top finding, overall status, date, and confidence level for each. Users can tap any scan to view the full result.

### Why It Matters
Health trends over time are critical for understanding whether a condition is improving, stable, or worsening.

### User Benefit
- Complete health record at a glance
- Quick access to past scan results
- Status badges (HEALTHY / NEEDS ATTENTION / URGENT) for visual triage

### Technical Implementation Summary
- **Storage**: `scanHistoryService.ts` with local AsyncStorage backend
- **Display**: `ProfileScreen.js` → History tab
- **Data**: Stores scan result, hero image URI, image count, and timestamp

---

## Feature 8: Vet Finder (Nearby)

### What It Does
Finds veterinary clinics near the user's location using geolocation, with keyword search and radius filtering.

### Why It Matters
When a scan shows urgent results, the user needs a vet *now* — not after Googling and comparing options.

### User Benefit
- Location-based vet search
- Detailed clinic information
- Integrated with the "Find 24/7 Vet Near Me" CTA on scan results

### Technical Implementation Summary
- **Service**: `vetFinderService.ts` — calls `/vets/nearby` and `/vets/{placeId}` API endpoints
- **Auth**: Cognito JWT required
- **Backend**: Google Places API integration (server-side)

---

*Next document: [03-ai-capabilities.md](./03-ai-capabilities.md)*
