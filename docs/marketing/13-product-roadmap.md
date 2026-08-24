# PetVue — Product Roadmap

> *Marketing needs to know what's coming so they can plan campaigns, content, and launches around feature drops.*

---

## Current State: What's Live Today

| Feature | Status | Notes |
|---------|--------|-------|
| Email/Password Auth (Cognito) | ✅ Live | With email verification |
| Google OAuth Sign-In | ✅ Live | Via AWS Cognito |
| Phone/OTP Auth (Firebase) | ✅ Live | India-focused |
| Pet Profile (Create/Edit) | ✅ Live | Local storage (AsyncStorage) |
| AI Health Scan (Single Image) | ✅ Live | Claude Haiku 4.5 |
| Multi-Image Capture | ✅ Live | 1–6 photos with quality indicators |
| Scan Results (Full Analysis) | ✅ Live | 7-section result screen |
| Scan History | ✅ Live | Local storage |
| Vet Booking (UI) | ✅ Live | Hardcoded providers |
| Booking Confirmation | ✅ Live | UI flow complete |
| Pet Shop (UI) | ✅ Live | Hardcoded products, cart works |
| Pre-Visit Intake Form | ✅ Live | 6-step with emergency detection |
| Vet Finder API | ✅ Backend | Google Places integration |
| Multi-Image Pipeline (Phase 2) | ✅ Deployed | S3 + SQS + DynamoDB; flag-gated (`USE_NEW_PIPELINE = false`) |

---

## Next 30 Days

### Theme: **"Backend Activation & Data Persistence"**

| Feature | Description | Marketing Impact |
|---------|-------------|-----------------|
| 🔄 **Activate Multi-Image Pipeline** | Flip `USE_NEW_PIPELINE` flag to `true` — enable presigned S3 uploads + async worker + polling | "Now analyzing up to 6 images per scan for higher accuracy" |
| 🔄 **Deploy Pet Profile Backend** | DynamoDB `pets` table, REST API (`GET/POST/PATCH/DELETE /pets`), avatar upload to S3 | Data persists across devices — "Your pet's profile, everywhere" |
| 🔄 **Remote Scan History** | Migrate scan history from local AsyncStorage to DynamoDB | "Your pet's complete health timeline — never lost" |
| 🆕 **Onboarding Flow Optimization** | Reduce Time to First Scan — allow scanning before pet profile creation | Improved conversion funnel |
| 🆕 **Push Notification Setup** | Firebase Cloud Messaging for scan reminders and health tips | Re-engagement channel |

---

## Next 90 Days

### Theme: **"Subscription, Retention & Real Integrations"**

| Feature | Description | Marketing Impact |
|---------|-------------|-----------------|
| 🆕 **Subscription / Paywall** | RevenueCat integration; Free (2 scans/mo) vs. Premium (unlimited) | Revenue generation begins |
| 🆕 **Real Vet Provider Directory** | Replace hardcoded providers with Google Places API + curated partner list | "Find real vets near you — rated and reviewed" |
| 🆕 **Vaccination Timeline (Phase 3)** | Track vaccination history, due dates, and reminders per pet | "Never miss a vaccination again" |
| 🆕 **Scan Comparison** | Compare two scan results side-by-side to track condition changes | "See how your pet's health is trending" |
| 🆕 **Referral Program** | "Give a friend 3 free scans, get a free month" | Viral growth loop |
| 🆕 **Breed-Specific Baselines** | AI adjusts findings based on breed-typical characteristics | "Smarter scans, tailored to your breed" |
| 🆕 **Landing Page / Website** | Public website with How It Works, Features, Pricing, Download | Web presence for SEO + social traffic |
| 🆕 **App Store Launch** | Submit to Apple App Store + Google Play Store | Public availability |

---

## Next 6 Months

### Theme: **"Platform Expansion & B2B"**

| Feature | Description | Marketing Impact |
|---------|-------------|-----------------|
| 🆕 **Weight & Activity Tracking (Phase 4)** | Trend charts for weight over time + manual activity logging | "Complete health dashboard" |
| 🆕 **Appointment Management** | Calendar view with upcoming/past vet visits, reminders | "Your pet's care calendar" |
| 🆕 **Affiliate Shop Integration** | Real product catalog with affiliate revenue | Revenue diversification |
| 🆕 **Vet Portal (B2B)** | Web dashboard for vet clinics — view patient intake forms, manage bookings | B2B revenue stream |
| 🆕 **Multi-Pet Support** | Switch between multiple pet profiles with unified health dashboard | "PetVue for the whole family" |
| 🆕 **Longitudinal Health Trending** | AI analyzes scan history to identify patterns and predict potential issues | "Your pet's AI health journey — from day one" |
| 🆕 **Localization (Hindi, Spanish)** | Multi-language support for key markets | Market expansion |
| 🆕 **Insurance Partner API** | Data integration for insurance companies | B2B partnership revenue |

---

## Vision Roadmap (12–24 Months)

### Theme: **"AI Intelligence Layer for the Pet Industry"**

| Feature | Description |
|---------|-------------|
| 🔮 **Predictive Health Alerts** | AI uses breed + age + scan history to predict health risks before symptoms appear |
| 🔮 **Behavioral Analysis** | Analyze photo sequences to detect behavioral changes (posture, energy, movement) |
| 🔮 **Wearable Integration** | Connect with pet wearables (Whistle, FitBark) for continuous health data |
| 🔮 **AI Vet Triage** | Pre-consultation AI assessment that helps vets prioritize cases |
| 🔮 **Telemedicine Integration** | In-app video consultations with veterinarians |
| 🔮 **Community Health Map** | Anonymized, regional health trends ("Parvovirus reported in your area") |
| 🔮 **White-Label AI Platform** | License PetVue's scan engine to other pet platforms, clinics, and insurance companies |
| 🔮 **International Expansion** | Launch in US, UK, Australia, Middle East |

---

## Roadmap Timeline (Visual)

```
NOW ────────── 30 DAYS ────────── 90 DAYS ────────── 6 MONTHS ────────── 12-24 MONTHS
 │                │                  │                   │                     │
 │  Multi-Image   │  Subscription    │  Weight/Activity  │  Predictive Alerts  │
 │  Pipeline ON   │  + Paywall       │  Tracking         │                     │
 │                │                  │                   │  Behavioral         │
 │  Pet Backend   │  Real Vet Dir    │  Vet Portal (B2B) │  Analysis           │
 │  Deployed      │                  │                   │                     │
 │                │  Vaccination     │  Multi-Pet        │  Wearable           │
 │  Remote Scan   │  Timeline        │  Support          │  Integration        │
 │  History       │                  │                   │                     │
 │                │  App Store       │  Affiliate Shop   │  White-Label AI     │
 │  Push Notifs   │  Launch          │                   │                     │
 │                │                  │  Insurance API    │  International      │
 │  Onboarding    │  Website         │                   │  Expansion          │
 │  Optimization  │  Launch          │  Localization     │                     │
```

---

## What Marketing Should Plan Around

| Launch | Campaign Type | Timing |
|--------|--------------|--------|
| Multi-Image Pipeline | Feature announcement blog + social | 30 days |
| App Store Launch | Press release, ASO, social blitz | 90 days |
| Subscription Launch | Pricing page, email campaign, in-app upsell | 90 days |
| Vaccination Timeline | Content series: "Vaccination schedules by breed" | 90 days |
| Website Launch | SEO foundation, Google Ads, social links | 90 days |
| Vet Portal | B2B outreach, case studies, webinars | 6 months |

---

*Next document: [14-customer-feedback-repository.md](./14-customer-feedback-repository.md)*
