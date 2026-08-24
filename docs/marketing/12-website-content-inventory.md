# PetVue — Website Content Inventory

> *Share what exists, what's planned, and where the gaps are. This is the marketing team's starting canvas.*

---

## Current Status

PetVue is currently a **mobile-only product** (React Native iOS + Android). There is no public-facing website or landing page deployed yet. All user interaction happens inside the native mobile app.

---

## Existing App Screens (Content Assets)

These screens contain content that can be adapted for web pages:

### Authentication Pages
| Screen | Content Available | Web Equivalent |
|--------|------------------|----------------|
| `LoginScreen.js` | Login form, Google OAuth, phone auth option | Landing page CTA / login |
| `SignUpScreen.js` | Signup form with email/password | Registration page |
| `ConfirmEmailScreen.js` | Email verification flow | Verification confirmation |
| `PhoneAuthScreen.js` | Phone/OTP authentication | Alternative auth flow |

### Core Product Pages
| Screen | Content Available | Web Equivalent |
|--------|------------------|----------------|
| `HomeScreen.js` | Greeting, pet card, quick actions, reminders, products | Homepage / dashboard |
| `MultiImageCaptureScreen.js` | Photo capture guide, quality indicators | "How It Works" section |
| `ScanProcessingScreen.js` | Processing animation, status messages | Feature demo page |
| `ScanResultScreen.js` | Full AI analysis results (7 sections) | "Sample Scan Results" page |
| `ProfileScreen.js` | Pet profile, health/activity/history tabs | User dashboard concept |
| `BookScreen.js` | Service selection, provider cards, date/time picker | "Find a Vet" page |
| `ShopScreen.js` | Product catalog, categories, cart | "Shop" page |
| `IntakeFormScreen.js` | 6-step intake form with review | "Pre-Visit Form" feature page |

---

## Planned Website Pages

### Must-Have (Pre-Launch)

| Page | Purpose | Priority |
|------|---------|----------|
| **Landing Page** | Convert visitors to app downloads | 🔴 Critical |
| **How It Works** | Explain the AI scan process visually | 🔴 Critical |
| **Features** | Detailed feature breakdown with screenshots | 🔴 Critical |
| **Pricing** | Free vs. Premium comparison | 🔴 Critical |
| **About / Our Story** | Founder narrative, mission, team | 🟡 High |
| **Privacy Policy** | Legal requirement for app stores | 🔴 Critical |
| **Terms of Service** | Legal requirement | 🔴 Critical |

### Should-Have (Launch + 30 Days)

| Page | Purpose | Priority |
|------|---------|----------|
| **Blog** | SEO content, pet health articles, product updates | 🟡 High |
| **FAQ** | Address common questions and concerns | 🟡 High |
| **For Vets** | B2B landing page for vet partnerships | 🟡 High |
| **Contact** | Support and partnership inquiries | 🟡 High |
| **Download** | App Store / Play Store links with deep links | 🟡 High |

### Nice-to-Have (Launch + 90 Days)

| Page | Purpose | Priority |
|------|---------|----------|
| **Testimonials** | Social proof and case studies | 🟢 Medium |
| **Pet Health Library** | Condition-specific pages (SEO goldmine) | 🟢 Medium |
| **Press / Media Kit** | Logos, screenshots, press releases | 🟢 Medium |
| **API / Partnerships** | Documentation for B2B integrations | 🟢 Medium |
| **Community** | User forum or community hub | 🟢 Medium |

---

## Blog Content Strategy

### Pillar Topics (SEO)

| Topic Cluster | Example Articles |
|--------------|-----------------|
| **AI & Pet Health** | "How AI Can Detect Pet Health Issues", "What Is AI Pet Health Scanning?" |
| **Breed Health Guides** | "Golden Retriever Health: Common Issues & Prevention", "Labrador Health Guide" |
| **Symptom Guides** | "What Does Watery Eyes in Dogs Mean?", "Why Is My Cat Losing Fur?" |
| **Pet Care Tips** | "5 Signs Your Dog Needs a Vet Visit", "How Often Should You Check Your Pet's Health?" |
| **Product Updates** | "New Feature: Multi-Image Scanning", "Introducing PetVue Premium" |

### Suggested Publishing Cadence
- **Launch**: 5 foundational articles
- **Month 1–3**: 2 articles per week
- **Month 4+**: 3 articles per week
- **Total Year 1 Target**: 100+ articles

---

## Existing SEO Work

| SEO Element | Status |
|-------------|--------|
| Domain registered | TBD |
| Google Search Console | Not set up |
| Sitemap | Not created |
| Meta descriptions | Not written |
| Schema markup | Not implemented |
| Keyword research | Not done |
| Backlink strategy | Not started |
| App Store Optimization (ASO) | Not started |

### SEO Keyword Opportunities

| Keyword Category | Examples | Search Volume (est.) |
|-----------------|----------|---------------------|
| **Problem-based** | "is my dog sick", "pet health check online" | High |
| **Solution-based** | "AI pet health scanner", "pet health app" | Medium |
| **Breed-specific** | "golden retriever health problems", "pug eye issues" | High |
| **Comparison** | "best pet health apps 2026", "petcube alternatives" | Medium |
| **Educational** | "common dog diseases", "cat skin conditions" | Very High |

---

## Analytics

| Platform | Status | Notes |
|----------|--------|-------|
| Google Analytics | Not set up | Priority for website launch |
| Mixpanel / Amplitude | Not set up | Priority for in-app analytics |
| App Store Analytics | Not available | Pre-launch |
| Social media analytics | Not tracked | No social presence yet |
| Email marketing platform | Not selected | Mailchimp, ConvertKit, or Resend recommended |

---

## Content Assets Available Today

| Asset Type | What Exists | Where |
|-----------|-------------|-------|
| App screenshots | Can be captured from running app | Internal |
| Architecture docs | `CLAUDE.md`, `docs/backend/` | Repo |
| Color palette | `src/theme/colors.js` — #228B72 (green), #62A8D1 (blue) | Repo |
| Component library | `src/components/` — buttons, inputs | Repo |
| Sample scan results | Can be generated from AI scan | App |
| Product copy | Screen titles, labels, descriptions | In code |

---

*Next document: [13-product-roadmap.md](./13-product-roadmap.md)*
