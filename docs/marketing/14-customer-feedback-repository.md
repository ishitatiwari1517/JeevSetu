# PetVue — Customer Feedback Repository

> *One of the highest-value assets for marketing. Real customer voices are where messaging, positioning, and campaigns come from.*

---

## ⚠️ Status Note

PetVue is in **MVP / Early Beta** and has not yet launched publicly. This document establishes the **framework for collecting, organizing, and using customer feedback** from Day 1. As beta users and early adopters provide feedback, this document should be updated as a living repository.

---

## Feedback Collection Framework

### 1. User Interviews

#### Structure
- **Frequency**: 5 interviews per week during beta; 3/week post-launch
- **Duration**: 20–30 minutes
- **Format**: Video call (recorded with consent) or in-app survey

#### Interview Script Template

```
OPENING (2 min)
- Tell me about your pet(s).
- How do you currently manage their health?

DISCOVERY (10 min)
- What made you try PetVue?
- Walk me through your first scan experience.
- What did you think when you saw the results?
- Was there anything confusing?

VALUE (5 min)
- Has PetVue changed how you think about your pet's health?
- Would you pay for PetVue? How much?
- Have you told anyone about it?

PAIN POINTS (5 min)
- What's missing from PetVue?
- What frustrated you?
- What would make you use it more often?

CLOSING (3 min)
- If you had to describe PetVue to a friend in one sentence, what would you say?
- Anything else?
```

#### Interview Repository Format

| Date | User | Pet | Key Quote | Sentiment | Theme | Action |
|------|------|-----|-----------|-----------|-------|--------|
| YYYY-MM-DD | Name/ID | Breed/Name | "..." | 😊/😐/😞 | Feature/UX/Trust | Ticket # |

---

### 2. Testimonials

#### Testimonial Collection Triggers
- After a scan confirms a health concern that vet validates
- After first positive scan ("Looks healthy — thank you PetVue!")
- After a user refers a friend
- After 10th scan (power user milestone)

#### Testimonial Template

```
"[Quote — in the user's own words]"
— [First Name], [Pet Name] ([Breed])
   [City, Country]
   Using PetVue since [Month Year]
```

#### Sample Testimonials (Pre-Launch Placeholders)

> *These will be replaced with real quotes as beta users provide feedback.*

**Template 1 — Health Scare Resolved**
> "I noticed a small bump on [Pet]'s ear and didn't know if it was serious. PetVue scanned it in seconds and said it was likely a benign cyst — but recommended monitoring. My vet confirmed it two days later. That peace of mind was worth everything."
> — Priya, Bruno (Golden Retriever), Bangalore

**Template 2 — Unnecessary Vet Visit Avoided**
> "I was about to spend ₹2,000 on an emergency vet visit because [Pet]'s eye looked weird. PetVue said it was a normal tear stain for Shih Tzus with 92% confidence. I saved the money and the stress."
> — Rahul, Cookie (Shih Tzu), Mumbai

**Template 3 — Early Detection Win**
> "PetVue flagged a potential skin condition I never would have noticed. The vet caught it early — said if I'd waited another month, treatment would have been much harder. This app literally saved my dog."
> — Sarah, Max (Labrador), Austin, TX

---

### 3. Complaints & Issues

#### Complaint Tracking Format

| Date | User | Category | Description | Severity | Resolution | Status |
|------|------|----------|-------------|----------|------------|--------|
| YYYY-MM-DD | ID | AI/UX/Auth/Perf | What happened | 🔴🟡🟢 | What we did | Open/Resolved |

#### Expected Complaint Categories

| Category | Example Complaints | Mitigation |
|----------|--------------------|------------|
| **AI Accuracy** | "It said my dog was healthy but vet found an issue" | Add stronger disclaimers, improve confidence thresholds |
| **Scan Speed** | "It takes too long to get results" | Optimize Lambda cold starts, add progress indicators |
| **Auth Friction** | "I couldn't log in with Google" | Test OAuth flows on all devices |
| **Photo Quality** | "It kept saying 'poor quality' for every photo" | Better lighting guidance, lower quality threshold |
| **Results Clarity** | "I don't understand what 'MONITOR' means" | Improve plain-language explanations |
| **Missing Features** | "Why can't I scan my cat?" | Expand training data to cover more species |
| **Privacy** | "Where does my pet's photo go?" | Clear privacy policy + in-app transparency |

---

### 4. Feature Requests

#### Feature Request Tracking Format

| Date | User | Request | Votes | Priority | Status |
|------|------|---------|-------|----------|--------|
| YYYY-MM-DD | ID | "I want to track vaccinations" | 12 | High | Phase 3 |
| YYYY-MM-DD | ID | "Add a weight chart" | 8 | Medium | Phase 4 |

#### Anticipated Feature Requests

| Request | Frequency (Expected) | Product Priority |
|---------|----------------------|-----------------|
| Vaccination tracking | Very High | Phase 3 (planned) |
| Multi-pet support | High | 6 months (planned) |
| Weight/growth chart | High | Phase 4 (planned) |
| Breed-specific tips | Medium | 90 days (planned) |
| Share results with vet | Medium | 6 months |
| Video analysis | Low | Vision roadmap |
| Food recommendations | Medium | 6 months |
| Cat-specific scanning | High | 90 days |

---

### 5. Support Tickets

#### Support Ticket Categories

| Category | % of Tickets (Expected) | Self-Serve Solution |
|----------|------------------------|---------------------|
| Login/Auth issues | 30% | FAQ + reset password flow |
| Scan not working | 20% | Troubleshooting guide |
| Results questions | 15% | Result explanation page |
| Billing/subscription | 15% | Account management screen |
| Feature questions | 10% | In-app tooltips |
| Bug reports | 10% | In-app bug report form |

---

## Feedback → Marketing Pipeline

The feedback repository feeds directly into marketing:

```
Customer Feedback
       │
       ├─── Testimonials ──▶ Landing page, ads, social proof
       │
       ├─── Pain Points ──▶ Ad copy, email campaigns
       │
       ├─── Feature Requests ──▶ Launch announcements, blog posts
       │
       ├─── Complaints ──▶ FAQ, support content, trust-building
       │
       └─── Quotes ──▶ Case studies, press releases
```

---

## Feedback Collection Tools (Recommended)

| Tool | Purpose | Cost |
|------|---------|------|
| **Typeform** | In-app surveys | Free tier available |
| **Intercom / Crisp** | In-app chat + ticket management | $29+/mo |
| **Notion** | Feedback repository database | Free tier |
| **Loom** | User interview recordings | Free tier |
| **Canny** | Feature request voting board | Free tier |
| **App Store Reviews** | Public feedback monitoring | Free |

---

*Next document: [15-founder-vision-story.md](./15-founder-vision-story.md)*
