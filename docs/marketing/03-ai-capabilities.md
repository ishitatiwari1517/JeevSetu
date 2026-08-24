# PetVue — AI Capability Document

> *Most marketers struggle explaining AI products. This document breaks down every AI capability in plain language.*

---

## AI Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Vision Model** | Anthropic Claude Haiku 4.5 | Image analysis & health assessment |
| **Orchestration** | AWS Lambda | Serverless compute for scan processing |
| **Queue** | AWS SQS | Async job processing for multi-image scans |
| **Storage** | AWS S3 + DynamoDB | Image uploads + scan result persistence |
| **Auth** | AWS Cognito | Secure user identity & API authorization |

---

## AI Capabilities Matrix

| Capability | Input | Output | User Benefit |
|-----------|-------|--------|-------------|
| **Health Condition Detection** | Pet photo(s) | List of detected conditions with confidence % | Know what might be wrong — fast |
| **Severity Assessment** | Pet photo(s) | HEALTHY / MONITOR / SEE_VET / EMERGENCY per finding | Understand how urgent each finding is |
| **Overall Status Classification** | Pet photo(s) | HEALTHY / NEEDS_ATTENTION / URGENT | One-word answer: "Is my pet okay?" |
| **Risk Level Scoring** | Pet photo(s) + condition data | Low / Moderate / High + justification | Calibrated concern — not panic, not complacency |
| **Visible Indicator Detection** | Pet photo(s) | List of observable symptoms | "Here's what the AI actually saw in the image" |
| **Plain Language Translation** | Clinical terminology | Human-readable explanation | No medical jargon — just clarity |
| **Precautionary Step Generation** | Detected conditions | Numbered action items | "Do this now, before the vet" |
| **Vet-Visit Trigger Identification** | Detected conditions | List of warning signs | "Go to the vet if you see *this*" |
| **Image Quality Assessment** | Pet photo | good / acceptable / poor | Guides user to take better photos for more reliable results |
| **Multi-Image Ensemble Analysis** | 2–6 pet photos | Higher-confidence findings | More data = more reliable detection |
| **Emergency Detection** | Symptom intake form data | Emergency flag (yes/no) | Immediate alert for severe symptom combinations |

---

## How the AI Scan Works (Plain Language)

```
📸 User takes a photo of their pet
       ↓
🔒 Photo is securely uploaded to AWS
       ↓
🤖 Claude AI analyzes the image (looking for ~50+ known conditions)
       ↓
📊 AI generates a structured health report:
   • What conditions it detected
   • How confident it is (0-100%)
   • How severe each finding is
   • What the user should do right now
   • When to rush to the vet
       ↓
📱 Results are displayed in the app in under 15 seconds
```

---

## Models Used

### Current: Claude Haiku 4.5 (Anthropic)

- **Type**: Multimodal vision-language model
- **Capability**: Processes images and generates structured text analysis
- **Speed**: Optimized for low-latency responses (typically 5–10 seconds)
- **Cost**: ~$0.001 per image processed
- **Why Haiku**: Best balance of speed, cost, and accuracy for real-time mobile use cases

### Image Input Support

| Format | Supported |
|--------|-----------|
| JPEG | ✅ |
| PNG | ✅ |
| GIF | ✅ |
| WebP | ✅ |

---

## Confidence Scoring System

PetVue uses a **4-tier confidence framework** that determines what the user sees:

| Score Range | Label | UI Behavior |
|-------------|-------|-------------|
| 85–100% | **High** | Full finding card with details |
| 60–84% | **Moderate** | Full finding card with details |
| 40–59% | **Low** | Full finding card with lower visual weight |
| < 40% | **Insufficient** | Finding is **hidden**; user sees "We need clearer photos" |

This prevents the AI from alarming users with low-confidence guesses.

---

## Severity Classification System

| Severity | Meaning | UI Color | Recommended Action |
|----------|---------|----------|-------------------|
| **HEALTHY** | No concerning findings | 🟢 Green | Routine care |
| **MONITOR** | Something to watch | 🟡 Amber | Keep an eye on it |
| **SEE_VET** | Professional evaluation recommended | 🟠 Orange | Schedule a vet visit |
| **EMERGENCY** | Immediate attention needed | 🔴 Red | Contact vet now |

---

## Accuracy & Limitations

### What the AI Is Good At
- Detecting **visible external conditions** (skin, eyes, ears, posture)
- Identifying **multiple concurrent issues** in a single scan
- Providing **educational context** (reference points, precautionary steps)
- Generating **actionable next steps** (not just diagnosis)

### What the AI Cannot Do
- ❌ Replace a veterinary examination or diagnosis
- ❌ Detect internal conditions (organ disease, blood work anomalies)
- ❌ Process video or real-time camera feeds (photos only)
- ❌ Guarantee accuracy — all results carry a medical disclaimer
- ❌ Provide treatment plans or prescribe medication

### Disclaimer (Shown on Every Scan)
> *"This assessment is based solely on the provided image and may not be accurate. Please consult a qualified veterinarian for a professional diagnosis."*

---

## AI Roadmap

| Timeline | Capability | Status |
|----------|-----------|--------|
| **Now** | Single-image health scan | ✅ Live |
| **Now** | Multi-image ensemble analysis | ✅ Deployed (flag-gated) |
| **Q3 2026** | Breed-specific health baselines | 🔜 Planned |
| **Q3 2026** | Longitudinal health trending (scan-over-scan comparison) | 🔜 Planned |
| **Q4 2026** | Behavioral analysis from photo sequences | 🔜 Research |
| **Q4 2026** | Integration with wearable pet devices | 🔜 Research |
| **2027** | Predictive health alerts based on breed + age + scan history | 🔜 Vision |

---

## Marketing-Friendly Descriptions

### One-Liner
> "PetVue uses AI to analyze photos of your pet and detect potential health concerns — in seconds."

### Elevator Pitch
> "PetVue is like having a vet in your pocket. Snap a photo of your pet, and our AI scans for over 50 health conditions, scores each with a confidence level, and tells you exactly what to do next — whether that's 'relax, they're fine' or 'call your vet today.'"

### Technical But Accessible
> "PetVue runs on Anthropic's Claude vision model — the same AI technology used by leading healthcare and research organizations. Each scan processes your pet's photo through a specialized health assessment pipeline, producing a multi-finding report with severity grading, confidence scoring, and actionable care recommendations."

---

*Next document: [04-customer-personas.md](./04-customer-personas.md)*
