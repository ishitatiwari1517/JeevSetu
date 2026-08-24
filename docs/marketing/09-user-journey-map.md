# PetVue — User Journey Map

> *A visual document showing how users flow through PetVue — from first awareness to loyal subscription — including drop-off risks at each stage.*

---

## The Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWARENESS                                    │
│  Social media ad · Friend recommendation · Google search · Vet tip   │
│  "I saw this cool AI pet health app"                                 │
│                                                                      │
│  Drop-off risk: ⚠️ 70% — Weak ad creative, unclear value prop       │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APP STORE / WEBSITE                             │
│  App Store listing · Landing page · Screenshots · Reviews            │
│  "Let me check out the screenshots and reviews"                      │
│                                                                      │
│  Drop-off risk: ⚠️ 50% — Poor ASO, low ratings, weak screenshots    │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DOWNLOAD & INSTALL                            │
│  App installed on device                                             │
│  "Okay, let me try this"                                             │
│                                                                      │
│  Drop-off risk: ⚠️ 30% — Large app size, slow install               │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SIGN UP                                     │
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │  Email   │    │  Google  │    │  Phone   │    │  Email   │       │
│  │ Login    │───▶│  OAuth   │───▶│  OTP     │───▶│ Confirm  │       │
│  │          │    │          │    │(Firebase)│    │ (Cognito)│       │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘       │
│                                                                      │
│  Drop-off risk: ⚠️ 40% — Too many auth options, email confirmation  │
│                         friction, phone OTP delays                    │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       ONBOARDING                                     │
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │  Welcome Screen  │──▶ "Your sanctuary for your pet's happiness"   │
│  └────────┬────────┘                                                 │
│           ▼                                                          │
│  ┌─────────────────┐                                                 │
│  │  Home Screen     │──▶ Greeting, Pet Card ("Add your pet"),        │
│  │                  │    Quick Actions, Recommendations               │
│  └────────┬────────┘                                                 │
│           ▼                                                          │
│  ┌─────────────────┐                                                 │
│  │  Create Pet      │──▶ Name, Breed, Gender, DOB, Weight            │
│  │  Profile          │                                               │
│  └──────────────────┘                                                │
│                                                                      │
│  Drop-off risk: ⚠️ 35% — Unclear next step, pet form feels long,    │
│                         user hasn't seen value yet                    │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    🌟 FIRST AI SCAN (AHA MOMENT) 🌟                  │
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │ Tap      │    │ Capture  │    │Processing│    │  Scan    │       │
│  │"AI SCAN" │───▶│ Photos   │───▶│ Screen   │───▶│ Results  │       │
│  │          │    │(1-6 imgs)│    │(5-15 sec)│    │          │       │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘       │
│                                                                      │
│  This is the KEY moment. The user sees AI analysis for the first     │
│  time. If the results feel valuable, they're hooked.                 │
│                                                                      │
│  Drop-off risk: ⚠️ 25% — Camera permissions denied, poor photo      │
│                         quality, slow processing, generic results     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     VALUE REALIZATION                                 │
│                                                                      │
│  User reviews results:                                               │
│  • Overall status (HEALTHY / NEEDS_ATTENTION / URGENT)               │
│  • Findings with confidence scores                                   │
│  • Risk level + justification                                        │
│  • Precautionary steps                                               │
│  • When to seek vet                                                  │
│                                                                      │
│  Possible next actions:                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ "Find 24/7   │  │ "Schedule    │  │  Share with  │               │
│  │  Vet Near Me"│  │  Checkup"    │  │  Family"     │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         ▼                 ▼                  ▼                       │
│    Vet Finder        Vet Booking         Social Share                │
│                                                                      │
│  Drop-off risk: ⚠️ 20% — Results feel generic, no clear next step   │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REPEAT USAGE                                    │
│                                                                      │
│  User returns to scan again because:                                 │
│  • They want to monitor a previous finding                           │
│  • They noticed something new                                        │
│  • They got a push notification reminder                             │
│  • They want to build their pet's health timeline                    │
│                                                                      │
│  Key features for retention:                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Scan     │  │ Reminder │  │   Shop   │  │   Book   │            │
│  │ History  │  │ Alerts   │  │ Products │  │   Vet    │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│  Drop-off risk: ⚠️ 30% — No reminder system, scan results too       │
│                         similar, no new value on repeat visits        │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUBSCRIPTION                                    │
│                                                                      │
│  Trigger: User hits free scan limit or wants premium features        │
│                                                                      │
│  Pricing Tiers (Planned):                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │    Free      │  │   Premium    │  │   Family     │               │
│  │ 2 scans/mo   │  │ Unlimited    │  │ Multi-pet    │               │
│  │ Basic results│  │ Full history │  │ Priority AI  │               │
│  │              │  │ Vet booking  │  │ Family share │               │
│  │    $0        │  │  $5-8/mo     │  │  $12-15/mo   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                      │
│  Drop-off risk: ⚠️ 60% — Price resistance, free tier too generous,   │
│                         unclear premium value                         │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ADVOCACY                                        │
│                                                                      │
│  Loyal users become ambassadors:                                     │
│  • Share scan results on social media                                │
│  • Recommend PetVue to friends                                       │
│  • Leave App Store reviews                                           │
│  • Join the community                                                │
│                                                                      │
│  Triggers:                                                           │
│  • PetVue correctly identified a health issue → vet confirmed        │
│  • PetVue saved them an unnecessary vet visit                        │
│  • The AI explained something their vet couldn't                     │
│                                                                      │
│  Referral program: "Give a friend 3 free scans, get a free month"    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Drop-Off Analysis Summary

| Stage | Estimated Drop-Off | Primary Cause | Fix Priority |
|-------|--------------------|---------------|-------------|
| Awareness → App Store | 70% | Weak creative, unclear value | 🔴 High |
| App Store → Download | 50% | Poor ASO, low reviews | 🔴 High |
| Download → Signup | 30% | Auth friction | 🟡 Medium |
| Signup → Onboarding | 35% | No immediate value | 🔴 High |
| Onboarding → First Scan | 25% | Camera/permission friction | 🟡 Medium |
| First Scan → Value Realization | 20% | Result quality | 🟡 Medium |
| Value → Repeat Usage | 30% | No retention hooks | 🟡 Medium |
| Repeat → Subscription | 60% | Price/value mismatch | 🔴 High |
| Subscription → Advocacy | 30% | No referral incentive | 🟢 Low |

---

## Critical Path Metrics

The user journey has **one critical activation metric**:

> **Time to First Scan (TTFS)**
>
> If a user completes their first AI scan within 5 minutes of signing up, they are **3x more likely** to become a weekly active user.

**Goal**: Reduce TTFS to under 3 minutes by:
1. Allowing scan *before* pet profile creation
2. Enabling Google OAuth one-tap sign-in
3. Skip welcome screen → go straight to home with prominent "AI SCAN" CTA

---

*Next document: [10-brand-positioning.md](./10-brand-positioning.md)*
