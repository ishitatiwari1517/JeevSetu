# PetVue — Current Metrics Dashboard

> *Marketing needs a baseline. Here's the framework for every metric that matters — and where we stand today.*

---

## ⚠️ Important Note

PetVue is in **MVP / Early Beta** stage. Most metrics below are **baseline targets** or **framework definitions**, not historical data. The analytics infrastructure needs to be instrumented. This document defines *what to track* and *how to interpret it* as the product grows.

---

## Product Metrics

| Metric | Definition | Current State | Target (3 months) | Target (6 months) |
|--------|-----------|---------------|-------------------|-------------------|
| **Total Users** | All registered accounts (email + phone + OAuth) | TBD — MVP | 1,000 | 5,000 |
| **Monthly Active Users (MAU)** | Unique users with ≥1 session in last 30 days | TBD | 500 | 3,000 |
| **Daily Active Users (DAU)** | Unique users with ≥1 session per day | TBD | 100 | 500 |
| **DAU/MAU Ratio** | Stickiness — how often active users come back | TBD | 20%+ | 25%+ |
| **Scans per User (Avg)** | Average scans per active user per month | TBD | 2.5 | 4.0 |
| **Session Duration** | Average time spent in app per session | TBD | 3 min | 5 min |
| **Retention (D7)** | % of users who return 7 days after signup | TBD | 30% | 40% |
| **Retention (D30)** | % of users who return 30 days after signup | TBD | 15% | 25% |
| **Churn Rate** | % of users who stop using the app per month | TBD | <15% | <10% |
| **Time to First Scan** | Minutes from signup to first AI scan | TBD | <5 min | <3 min |
| **Scan Completion Rate** | % of initiated scans that complete successfully | TBD | 85% | 95% |

---

## Revenue Metrics

| Metric | Definition | Current State | Target (6 months) | Target (12 months) |
|--------|-----------|---------------|-------------------|-------------------|
| **MRR** | Monthly Recurring Revenue | $0 (pre-revenue) | $5,000 | $25,000 |
| **ARR** | Annual Recurring Revenue (MRR × 12) | $0 | $60,000 | $300,000 |
| **ARPU** | Average Revenue Per User (monthly) | N/A | $3–$5 | $5–$8 |
| **Free-to-Paid Conversion** | % of free users who subscribe | N/A | 3% | 5% |
| **Trial-to-Paid Conversion** | % of trial users who convert | N/A | 15% | 25% |
| **LTV** | Lifetime Value per paying subscriber | N/A | $60 | $120 |
| **CAC** | Customer Acquisition Cost | N/A | <$5 | <$8 |
| **LTV:CAC Ratio** | Efficiency of acquisition spend | N/A | >3:1 | >5:1 |
| **Gross Margin** | Revenue minus AI processing costs | N/A | 70%+ | 80%+ |

---

## Acquisition Metrics

| Metric | Definition | Current State | Target (3 months) | Target (6 months) |
|--------|-----------|---------------|-------------------|-------------------|
| **Organic Traffic** | App store / website visits from non-paid sources | TBD | 5,000/mo | 20,000/mo |
| **Paid Traffic** | App installs from ads (Google, Meta, Instagram) | Not started | 1,000/mo | 5,000/mo |
| **Social Followers** | Combined across Instagram, Twitter/X, YouTube | TBD | 2,000 | 10,000 |
| **Email Subscribers** | Newsletter/marketing email list | TBD | 500 | 3,000 |
| **App Store Rating** | Average rating on Play Store / App Store | Not launched | 4.2+ | 4.5+ |
| **Referral Rate** | % of new users from existing user referrals | TBD | 10% | 20% |
| **Install-to-Signup Rate** | % of app downloads that create an account | TBD | 60% | 70% |
| **Signup-to-First-Scan Rate** | % of signups that complete first scan | TBD | 40% | 60% |

---

## Engagement Metrics

| Metric | Definition | Why It Matters |
|--------|-----------|---------------|
| **Scans per Session** | Average scans per app session | Core feature engagement |
| **Booking Conversion** | % of NEEDS_ATTENTION/URGENT scans → vet booking | Revenue funnel |
| **Shop Conversion** | % of users who add items to cart | Revenue diversification |
| **Intake Form Completion** | % of started intake forms that are submitted | Pre-visit feature adoption |
| **History Tab Views** | % of users who view past scan results | Health timeline value |
| **Push Notification CTR** | Click-through rate on notifications | Re-engagement effectiveness |
| **Feature Discovery** | % of users who use each feature in first 7 days | Onboarding health |

---

## Analytics Infrastructure Needed

| Tool Category | Recommended | Purpose |
|--------------|-------------|---------|
| **Product Analytics** | Mixpanel or Amplitude | Event tracking, funnels, retention |
| **Crash Reporting** | Sentry or Bugsnag | Error monitoring |
| **App Store Analytics** | App Store Connect / Google Play Console | Downloads, ratings, search |
| **Revenue Analytics** | RevenueCat | Subscription tracking |
| **Marketing Analytics** | Google Analytics + UTM tracking | Traffic attribution |
| **User Feedback** | In-app surveys (Typeform / custom) | Qualitative insights |

---

## Key Metric Relationships (Marketing Should Watch)

```
Install → Signup → First Scan → Repeat Scan → Subscription
  ↑          ↑          ↑             ↑              ↑
  ASO     Onboarding   AI quality   Value           Pricing
  Ads     UX flow      Speed        realization     model
```

- **If signup rate is low**: Onboarding friction — simplify auth flow
- **If first scan rate is low**: Value proposition unclear — improve onboarding CTA
- **If repeat scan rate is low**: Results quality issue — improve AI accuracy or result design
- **If subscription conversion is low**: Free tier too generous or pricing too high

---

*Next document: [09-user-journey-map.md](./09-user-journey-map.md)*
