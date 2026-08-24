# PetVue — Product Overview

> *Read this document first. It covers what PetVue is, why it exists, and where it stands today.*

---

## What Is PetVue?

PetVue is an **AI-powered pet health intelligence platform** that helps pet owners understand, monitor, and improve their pets' wellbeing through computer vision, behavior analysis, and proactive health insights — all from their smartphone.

Available on **iOS and Android** as a native React Native mobile app, PetVue combines advanced AI analysis (powered by Anthropic's Claude vision models) with practical pet care tools — booking, shopping, profile management, and scan history — into a single, unified experience.

---

## Why Was PetVue Built?

### The Problem

Pet owners face a silent crisis: **pets can't communicate their pain or symptoms verbally.** By the time visible signs appear, conditions may have already progressed. Meanwhile:

- Veterinary visits are expensive and often reactive rather than preventive.
- Pet owners miss subtle behavioral changes that signal health issues.
- There's no simple, always-available tool that helps pet parents understand what they're seeing.

### The Vision

**A world where no pet suffers in silence.**

PetVue envisions a future where AI acts as an always-on health companion for every pet — providing pet parents with the knowledge and confidence to act early, seek help when needed, and maintain their pet's wellness proactively.

### The Mission

To democratize veterinary-grade pet health intelligence through AI — making early detection, preventive care, and expert-level insight accessible to every pet owner, everywhere.

---

## Unique Value Proposition

> **"PetVue lets your smartphone see what your eyes might miss."**

Upload a photo of your pet → receive an AI-powered health analysis in seconds — complete with condition detection, risk assessment, confidence scoring, precautionary steps, and when-to-seek-vet guidance.

**What makes PetVue different:**

| Differentiator | Description |
|---|---|
| **AI-First** | Not a pet camera. Not a tracker. PetVue is an *intelligence platform* built around AI health analysis. |
| **Multi-Finding Detection** | Single scan identifies *multiple* potential health conditions simultaneously with severity grading. |
| **Actionable Guidance** | Goes beyond detection — provides precautionary steps, risk justification, and vet-visit triggers. |
| **Integrated Care Ecosystem** | Scan → Book Vet → Shop for Supplies → Track History — all in one app. |
| **Privacy-First Architecture** | All image processing happens server-side via secure AWS infrastructure; images are not stored after analysis. |

---

## Current Status

| Attribute | Status |
|---|---|
| **Stage** | MVP / Early Beta |
| **Platforms** | iOS + Android (React Native 0.85.2) |
| **Authentication** | AWS Cognito (email + Google OAuth) + Firebase Auth (phone/OTP) |
| **AI Engine** | Anthropic Claude Haiku 4.5 (vision model) |
| **Backend** | AWS Amplify (Lambda, API Gateway, DynamoDB, S3, SQS) |
| **Pipeline** | Legacy single-image scan (live) + Phase 2 multi-image pipeline (deployed, flag-gated) |
| **Data Storage** | Local AsyncStorage (MVP) with remote DynamoDB backend spec'd |
| **Revenue** | Pre-revenue — subscription model planned |

---

## Competitive Advantage

1. **AI Accuracy & Depth** — Unlike generic "pet health" apps, PetVue uses Anthropic's Claude vision models to produce multi-finding analyses with confidence scoring, severity grading, and plain-language explanations.

2. **Integrated Vet Finder** — Scan results link directly to nearby vet booking, reducing friction from detection to action.

3. **Multi-Image Analysis** — Phase 2 pipeline supports analyzing multiple images of the same pet for higher-confidence ensemble analysis (up to 6 images per scan).

4. **Pre-Visit Intake System** — Built-in structured intake form (symptoms, severity, duration, triggers) with emergency detection — streamlines the vet visit before it starts.

5. **Full Care Lifecycle** — Profile creation → AI scanning → vet booking → product shopping → vaccination tracking (planned) — PetVue covers the entire pet care journey.

---

## Key Metrics to Watch

- **Scans per user** — Core engagement metric
- **Scan-to-booking conversion** — Revenue funnel health
- **Repeat scan rate** — Retention signal
- **Time-to-first-scan** — Onboarding effectiveness

---

*Next document: [02-product-deep-dive.md](./02-product-deep-dive.md)*
