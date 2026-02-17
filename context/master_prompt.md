# Master Context Document — Student Learning Platform (MVP)

**For:** Antigravity (Implementation Agent)  
**Purpose:** High-level system alignment and architectural intent  
**Read Time:** ~10 minutes

---

## The Core Idea

Students forget what they learn because **passive consumption doesn't create durable memory**.

**Hypothesis:**  
If students self-assess → actively retrieve through quizzes → reinforce via spaced repetition, retention improves.

**MVP Goal:**  
Validate this learning loop with students only. Teachers come later.

---

## User Journey Overview

### Initial Onboarding (First-Time Users)
When a user logs in for the first time, they experience a brief onboarding flow:

1. **Welcome Screen** — "You bring the learning, we help it stick"
2. **Purpose Selection** — "What brings you here?"
   - Exam prep
   - Career growth
   - Personal interest
   - Other learning goals
3. **Time Commitment** — "How much time can you commit?"
   - Options: 5 min, 10 min, 15 min, 30 min daily
   - Shows annual impact: "That's 3,650 minutes a year"
4. **System Explanation** — Brief overview of how the platform works
5. **Complete** — "Start Learning" button → redirects to Home

**Purpose:** UI/UX enhancement and personalization foundation. Data collected here can inform future AI personalization but has no functional impact in MVP.

---

## What Exists (In Scope)

### The Four Pages

**Home (`/`)**  
Primary interaction surface. Think "ChatGPT for learning."
- Student enters new topic or continues existing one
- Triggers topic onboarding flow for new topics
- Takes quizzes on existing topics
- Immediate feedback: points, memory score, what to review
- Knowledge stored

**Cockpit (`/cockpit`)**  
High-level dashboard. Think "status panel, not archive."
- Shows all active topics being learned
- Average memory score across all topics
- Due quizzes counter
- Total sessions completed
- **Knowledge Base** section (see Key Modules below)
- Click topic → navigate to Content Dump for details

**Content Dump (`/content-dump`)**  
Tag-based content discovery. Think "organized chat history."
- Lists all topics with auto-assigned tags:
  - Coding
  - Science
  - Theory
  - Practice
  - Maths
  - (More tags as needed)
- Filter/search by tags to find specific content
- Drill down into any topic:
  - Full concept list
  - Per-concept retention indicators
  - Quiz history with responses
  - Feedback and explanations
- Can trigger re-quiz from here

**Classroom (`/classroom`)**  
Placeholder only. Flagged as "Coming Soon." MVP2 feature.

---

## Key Modules

### 1. Initial Onboarding
**Input:** First-time user login  
**Process:**
- Captures user's learning purpose (exam prep, career growth, etc.)
- Records time commitment preference
- Explains system mechanics

**Output:**
- User preferences stored for future personalization
- User directed to Home screen
- Ready to add first topic

**Where it feeds:** Data stored for potential AI layer personalization in future iterations. No immediate functional impact in MVP.

---

### 2. Topic Onboarding
**Input:** User adds a new topic from Home  
**Process:**
1. **Topic Entry** — "What did you learn?" (e.g., "Python")
2. **Level Assessment** — "Rate yourself in [Topic]"
   - Beginner (displays typical beginner concepts)
   - Intermediate (displays typical intermediate concepts)
   - Expert (displays typical expert concepts)
   - User sees concept examples for each level and selects their level
3. **Concept Selection** — Single-screen interaction:
   - When user selects a level (e.g., Intermediate), other levels fade
   - Displays relevant concepts for that level
   - User checks concepts they want to be quizzed on
   - User can add custom concepts not listed
   - User can edit/modify concept names inline (like Google Forms)
4. **Confirmation** — Review selected concepts → Continue

**Output:**
- Topic created with metadata:
  - Topic name
  - User's self-rated level (beginner/intermediate/expert)
  - List of concepts (system-suggested + user-added)
  - Concepts marked for quizzing
- Auto-assigned tags for filtering (e.g., Python → "Coding")
- Data passed to AI layer for quiz generation

**Where it feeds:**
- Topic stored in knowledge base
- Appears in Cockpit dashboard
- Appears in Content Dump with assigned tags
- Concept list used by Quiz Engine

---

### 3. Knowledge Base
**Location:** Lives inside Cockpit page  
**Purpose:** "Second brain" for everything learned on the platform

**Displays:**
- All topics being learned
- Concepts within each topic
- Concept-wise retention scores (visual indicators)
- Quiz sessions per concept:
  - Total attempts
  - Correct vs incorrect
  - Performance trends
- Relevant articles or resources (future enhancement)
- Visual breakdown of strong vs weak concepts

**Input:** Data from Topic Onboarding and Quiz Engine  
**Output:** Comprehensive learning dashboard for self-reflection

**Where it feeds:** User insights; informs Content Dump filtering; triggers review sessions

---

### 4. Topic Management
- Creates and stores topics
- Extracts/generates concepts based on user level selection
- Allows student to modify concept lists during onboarding
- Tracks topic metadata (level, tags, creation date)
- Auto-assigns tags for Content Dump filtering

---

### 5. Quiz Engine
- Generates quizzes from selected topic concepts
- Mix of MCQ and short-answer questions
- Scores responses immediately
- Provides feedback
- Records quiz history per concept

---

### 6. Memory Scoring
- Calculates topic-level memory scores
- Determines strong vs weak concepts
- Schedules spaced repetition
- Computes global learning score (average across all topics)
- Updates retention indicators in Knowledge Base

---

### 7. Gamification (Lightweight)
- Awards points for quiz participation
- Displays learning/memory score prominently
- Simple progress indicators
- No leaderboards or complex rewards in MVP

---

## Knowledge Model (Conceptual Only)

Think: **User → Topics → Concepts → Quiz History**

Each user has:
- Onboarding preferences (purpose, time commitment)
- Multiple topics

Each topic has:
- Name
- User's self-rated level (beginner/intermediate/expert)
- Auto-assigned tags (for filtering)
- Concepts (system-generated + user-added)
- Concepts selected for quizzing
- Quiz attempts over time
- Derived memory score
- Retention signals (which concepts are strong/weak)

Data flows **one direction:**
- Initial Onboarding → User preferences
- Topic Onboarding → Topic creation → Knowledge Base
- Home creates/updates knowledge via quizzes
- Cockpit (Knowledge Base) and Content Dump consume data

Don't define exact schemas. Antigravity decides storage details.

---

## Key Principles

### Frontend-First Architecture
- Built with **Next.js (App Router)**
- Backend is **abstracted** — start with mock data, design for real APIs later
- Server Components by default
- Client Components only for interactive elements (forms, quizzes, onboarding)
- SSR for initial page loads

### Progressive Disclosure
- Initial Onboarding: Set context
- Topic Onboarding: Capture learning intent
- Home: Action (learn/quiz)
- Cockpit: Overview (metrics/status + Knowledge Base)
- Content Dump: Discovery (tag-based filtering)

Each page has a clear, single purpose.

### Single-Screen Efficiency
- Topic onboarding consolidates level selection + concept picking into one screen
- Use progressive disclosure within screens (fade irrelevant options)
- Minimize unnecessary transitions between screens

### Replaceability Over Optimization
- Mock data is fine for MVP
- Scoring algorithms should be pluggable functions
- AI quiz generation is a future service call
- Tag assignment can be rule-based initially, AI-enhanced later
- Don't build for scale — build to validate behavior

### Clarity Over Cleverness
- Simple code beats optimized code
- Obvious beats clever
- Readable beats compact

---

## Technical Stack

**Core:**
- Framework: Next.js (App Router)
- Language: TypeScript
- UI: shadcn/ui + Tailwind CSS
- Rendering: Server Components default, Client where needed

**Backend (MVP):**
- Mock data or simple JSON files
- Optional API routes under `/app/api` as stubs
- Structure responses as if from a real backend
- Easy to replace later

**Navigation:**
- Client-side routing (`next/link`)
- Fast transitions, no full reloads

---

## Suggested Folder Structure

```
app/
├─ layout.tsx
├─ page.tsx              # Home
├─ onboarding/
│  └─ page.tsx           # Initial onboarding flow
├─ cockpit/
│  └─ page.tsx           # Includes Knowledge Base
├─ content-dump/
│  └─ page.tsx
├─ classroom/
│  └─ page.tsx           # Placeholder (Coming Soon)
├─ api/                  # Optional stubs
components/
├─ ui/                   # shadcn components
├─ onboarding/
├─ topic/
├─ quiz/
├─ knowledge-base/
└─ dashboard/
lib/
├─ mock-data.ts
├─ scoring.ts
├─ tags.ts               # Tag assignment logic
└─ utils.ts
types/
└─ index.ts
styles/
└─ globals.css
```

This is guidance, not gospel. Adjust as needed.

---

## Design Philosophy

### Visual Tone
- Calm, focused, minimal
- Soft gradients for primary actions
- Green = retained, red = forgetting (universal)
- Neutral backgrounds, clean typography
- No visual noise or over-gamification

### Component Approach
- Use shadcn/ui as foundation
- Consistent spacing (Tailwind scale)
- Cards for contained content
- Progress indicators: linear and circular
- Buttons: clear hierarchy (primary, secondary, danger)
- Progressive disclosure: fade/hide irrelevant options

### User Experience
- One primary action per screen
- Minimize screen transitions (consolidate flows)
- Immediate feedback on quiz submission
- Clear "where am I" indicators
- Natural language throughout

---

## What You Should Build

### MVP Deliverables
1. **Initial Onboarding Flow** (4 screens → Home)
2. **Topic Onboarding Flow** (single-screen level + concept selection)
3. **Home page** with topic entry and quiz flow
4. **Cockpit** showing topic cards, metrics, and Knowledge Base section
5. **Content Dump** with tag-based filtering
6. **Classroom** placeholder with "Coming Soon" message
7. Mock data representing realistic learning scenarios
8. Basic scoring functions (simple is fine)
9. Tag assignment logic (rule-based for MVP)
10. Type definitions for core entities
11. Reusable UI components (onboarding, forms, cards, quiz interface)

### What You Should NOT Build
- Real authentication (assume single user)
- Actual database (mock data is fine)
- Teacher features (beyond conceptual support)
- Complex analytics
- Social features
- Third-party integrations
- Production optimization

---

## Open Design Decisions

Antigravity has freedom to decide:

**Scoring formulas:**  
How exactly is memory score calculated? Keep it simple and transparent. Weighted recent attempts? Exponential decay? Your call.

**Quiz generation:**  
Hardcoded questions for topics? Random selection? Template-based? AI later? Start simple.

**Spaced repetition intervals:**  
What's the formula? (e.g., score >80 → 7 days, score 60-80 → 3 days). Use common sense defaults.

**Concept extraction for levels:**  
Hardcode beginner/intermediate/expert concept lists per common topic? Generic templates? Full NLP later? Start with hardcoded examples for popular topics.

**Tag assignment:**  
Rule-based keywords (Python → Coding, Biology → Science)? Manual initially? AI later? Start simple.

**UI micro-interactions:**  
How do cards animate? What's the loading state? Transitions? Fading irrelevant options? Make it feel good, but don't overthink.

---

## The Learning Loop (High-Level Flow)

### Initial User Flow
1. User logs in for first time
2. Completes Initial Onboarding (purpose, time, system intro)
3. Clicks "Start Learning" → arrives at Home
4. Enters first topic → triggers Topic Onboarding

### New Topic Flow (Topic Onboarding)
1. Student enters topic name on Home
2. System triggers Topic Onboarding flow
3. Student rates self (beginner/intermediate/expert)concepts for each level should be visible
4. System shows concepts for selected level
5. Other levels fade away (single-screen interaction)
6. Student checks concepts to quiz on
7. Student adds custom concepts if needed
8. Student edits concept names inline (Google Forms style)
9. Student confirms → Topic created
10. Quiz generated from selected concepts
11. Student completes quiz
12. Scored immediately, feedback shown
13. Points awarded, memory score calculated
14. Topic saved to knowledge base
15. Appears in Cockpit (with Knowledge Base) and Content Dump (with tags)

### Spaced Repetition Flow
1. Cockpit shows "due for review" reminder
2. Student clicks reminder
3. Navigates to Home with pre-loaded topic
4. Takes new quiz on same topic
5. Score updates based on performance
6. Next review date calculated
7. Longer interval if strong, shorter if weak
8. Knowledge Base updates retention indicators

### History Review Flow (Content Dump)
1. Student navigates to Content Dump
2. Filters by tag (e.g., "Coding" to find Python)
3. Selects topic from filtered list
4. Views concept breakdown and quiz history
5. Identifies weak concepts (red indicators)
6. Clicks "quiz again" → back to Home

### Knowledge Base Flow (Cockpit)
1. Student navigates to Cockpit
2. Views Knowledge Base section
3. Sees all topics with concept-wise retention
4. Identifies strong vs weak concepts visually
5. Checks quiz session history per concept
6. Decides what to review → navigates to Home or Content Dump

---

## Non-Functional Expectations

**Performance:**  
Good enough. Don't optimize prematurely.

**Accessibility:**  
Semantic HTML, keyboard nav, ARIA labels where appropriate.

**Responsiveness:**  
Mobile-first. Works on phone, tablet, desktop.

**Maintainability:**  
Readable code > clever code. TypeScript everywhere.

---

## Explicitly Out of Scope

Do NOT design or implement:
- User authentication (assume logged-in state)
- Real database
- Teacher dashboard (beyond placeholder)
- Advanced analytics or exports
- AI tutor conversations
- Social/sharing features
- Email notifications
- Payment or subscriptions
- Real AI quiz generation (mock it)
- Complex tag taxonomy (simple rule-based is fine)

These features wait until **after behavior validation**.

---

## Success Criteria (Post-Launch)

After MVP, measure:
- Do students complete Topic Onboarding smoothly?
- Do students return voluntarily?
- Do memory scores improve over time?
- Do students use tag filtering effectively?
- Does Knowledge Base provide value?
- Does spaced repetition actually help?

If yes → expand to teachers.  
If no → iterate on core loop.

---

## Your Role (Antigravity)

**You decide:**
- Exact implementations
- API contracts
- Scoring formulas
- Tag assignment rules
- UI details and micro-interactions
- Component structure
- State management approach
- Error handling
- Edge cases
- How onboarding flows transition

**You follow:**
- System intent (the learning loop with onboarding)
- Module boundaries (onboarding, topic, quiz, scoring, knowledge base, tags)
- Page purposes (Onboarding = setup, Home = action, Cockpit = overview + knowledge base, Content Dump = tag-based discovery)
- Design tone (calm, focused, minimal)
- Technical stack (Next.js, TypeScript, shadcn/ui)
- Single-screen efficiency where possible

**You avoid:**
- Over-engineering
- Premature optimization
- Scope creep beyond MVP
- Building out-of-scope features
- Unnecessary screen transitions

---

## Final Guidance

This is an MVP to **validate a behavioral hypothesis**, not to build a perfect product.

**Optimize for:**
- Speed of iteration
- Clarity of code
- Ease of replacement (mock → real)
- Learning from user behavior
- Smooth onboarding experience

**Don't optimize for:**
- Scale
- Edge cases
- Production hardening
- Feature completeness

Build something students can use **this week** to test if the learning loop works.

Everything else comes later.

---

## Questions? Ambiguity?

If something is unclear:
1. Use common sense
2. Choose the simpler path
3. Make it work, then make it better
4. Document your decisions in code comments

This document guides, it doesn't constrain.

---

**End of Master Context Document**

You now have the system intent, boundaries, and architectural direction.

Go build.