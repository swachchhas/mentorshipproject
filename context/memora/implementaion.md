# Memora Platform — Implementation Context & Requirements
## Complete System Overview & Technical Specifications

**Document Purpose:** Comprehensive context for implementing the Memora learning platform  
**Audience:** Development team (Antigravity AI)  
**Status:** Ready for implementation  
**Last Updated:** February 2026

---

## 📚 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Functionality](#core-functionality)
3. [AI Integration](#ai-integration)
4. [User Flows](#user-flows)
5. [UI Components & Interactions](#ui-components--interactions)
6. [Data Architecture](#data-architecture)
7. [Branding & Visual Identity](#branding--visual-identity)
8. [Implementation Requirements](#implementation-requirements)

---

## 🎯 Platform Overview

### What is Memora?

Memora is a **spaced repetition learning platform** designed specifically for **programmers** to master concepts through active recall. Unlike passive learning platforms (video courses), Memora focuses on **retention through strategic quiz scheduling**.

### Core Problem Being Solved

Programmers forget what they learn because:
- They watch tutorials but don't practice recall
- They cram before interviews but forget after
- They have no system to review concepts over time
- They don't know which concepts they've mastered vs struggling with

### Memora's Solution

- **AI-generated quizzes** tailored to user's level (beginner/intermediate/expert)
- **Spaced repetition scheduling** based on forgetting curve
- **Concept-level tracking** (not just topic-level)
- **Time-decayed retention scores** that reflect actual memory strength
- **Quiz history** showing exactly where user struggles

### Key Differentiators

| vs Anki | vs Duolingo | vs Coursera |
|---------|-------------|-------------|
| Beautiful UI | Respects intelligence | Active recall |
| Programming-focused | No childish gamification | Not passive videos |
| AI-generated content | Strategic learning | Concept mastery tracking |

---

## 🧠 Core Functionality

### 1. Topic & Concept Selection

**User Flow:**
1. User enters topic name (e.g., "Python", "React", "SQL")
2. User selects difficulty level (beginner/intermediate/expert)
3. **AI generates 10-15 curriculum-aligned concepts** for that level
4. Concepts displayed in **collapsible sections** (accordion pattern)
5. User can check/uncheck concepts (all checked by default)
6. User selects study parameters:
   - Timeframe: 1 week | 2 weeks | 3 weeks | 1 month | 3 months
   - Daily commitment: 5min | 10min | 15min | 30min | 1 hour
7. System generates quiz questions and schedule

**Critical Requirements:**
- AI must generate **realistic, curriculum-based concepts** (see AI Integration section)
- Concepts must be displayed **in full** (no truncation, no hover tooltips)
- User must be able to **modify selection** before proceeding
- Must work on mobile (collapsible sections stack vertically)

---

### 2. Quiz Types

**Two Distinct Quiz Modes:**

#### A. Topic Quiz (Mixed Concepts)
- **Purpose:** Comprehensive review across all selected concepts
- **Question count:** 10-15 MCQs
- **Distribution:** Weighted toward concepts with lower retention scores
- **Question order:** Randomized (not grouped by concept)
- **Concept tags:** Visible on each question (e.g., "💡 Variables and Data Types")
- **When triggered:** 
  - First time: "Start Topic Quiz" button
  - After first quiz: "Redo Quiz" or 🎲 "Regenerate Questions"

#### B. Concept Quiz (Single Focus)
- **Purpose:** Deep practice on one specific concept
- **Question count:** 5-10 MCQs
- **Distribution:** All questions from single concept
- **Question selection priority:**
  1. Previously missed questions (if any)
  2. New questions (not seen before)
  3. Review questions (previously correct)
- **When triggered:** "Quiz This Concept" button on concept cards

---

### 3. Question Generation & Storage

**AI Generation Process:**
1. User selects concepts during onboarding
2. **AI generates 10 MCQs per concept** (60 questions for 6 concepts)
3. Each question includes:
   - Question text
   - 4 answer options (exactly)
   - Correct answer (must match one option exactly)
   - Explanation (why it's correct)
   - Keywords (3-7 relevant terms)
   - Concept ID and name (for tagging)
4. **Validation layer** checks:
   - Format correctness (all fields present)
   - Quality score (>70 = keep, <70 = regenerate)
   - Fact checking (for science topics)
5. **Questions stored in questions.json** for instant access
6. No regeneration during quiz (uses pre-stored questions)

**Regeneration Flow:**
1. User clicks 🎲 regenerate icon
2. Confirmation dialog: "Generate new questions? Old questions saved in history."
3. AI generates fresh 10 questions per concept
4. Old questions archived (still accessible in quiz history)
5. New quiz begins immediately

**Critical Requirements:**
- Questions must be **curriculum-aligned** (see refined prompts in AI Integration)
- MCQ only (no short answer questions)
- Must include **concept tag** for display during quiz
- Questions stored **before** user takes quiz (not generated on-demand)

---

### 4. Retention Scoring System

**Time-Decayed Formula:**
Recent quiz performance weighted higher than old performance.

**Principle:**
- Today's quiz: 100% weight
- 7 days ago: ~37% weight
- 14 days ago: ~14% weight
- Uses exponential decay with 7-day half-life

**Calculation:**
For each concept, aggregate all quiz attempts:
1. Calculate days since each attempt
2. Apply exponential decay weight to each score
3. Weighted average = retention score
4. Score displayed as percentage with color indicator

**Visual Indicators:**
- 🟢 Green (70-100%): Strong retention
- 🟡 Yellow (40-69%): Average retention
- 🔴 Red (0-39%): Weak retention, needs practice

**Critical Requirements:**
- Recalculate after every quiz attempt
- Store timestamp with each attempt (for decay calculation)
- Display in Cockpit modal (per-concept scores)
- Display in Knowledge Base (concept cards)

---

### 5. Quiz History Tracking

**What Gets Stored:**
Every quiz attempt records:
- Quiz ID (unique)
- Topic ID
- Quiz type (topic or concept)
- Timestamp (when taken)
- Duration (how long it took)
- Overall score (X out of Y correct)
- **Question-level detail:**
  - Question ID
  - Concept ID and name
  - User's selected answer
  - Correct answer
  - Whether correct (true/false)
- **Concept breakdown** (for topic quizzes):
  - Per concept: total questions, correct answers, percentage

**Where It's Displayed:**
1. **Cockpit Modal** - "View Quiz History" button opens modal with:
   - Reverse chronological list of all attempts
   - Filter by quiz type, concept, date
   - Each attempt shows score, date, concept breakdown
   - "View Details" → question-by-question review
   - "Retake Quiz" → exact same questions

2. **Knowledge Base Concept Cards** - Shows:
   - Total attempts on this concept
   - Recent performance (last 5 attempts with scores)
   - Common mistakes (questions missed multiple times)

**Critical Requirements:**
- Store complete history (never delete)
- Support filtering (by type, concept, date range)
- Question-by-question review must show:
  - ✅/❌ indicator
  - User's answer vs correct answer
  - Explanation from AI
  - Concept tag

---

## 🤖 AI Integration

### Hugging Face Setup

**Model:** Meta-Llama-3.1-8B-Instruct  
**API:** Hugging Face Inference API (free tier)  
**Rate Limits:** ~1000 requests/day (free tier)

**Environment Variable:**
```
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### API Endpoints Needed

**1. Generate Concepts**
- **Endpoint:** `/api/ai/generate-concepts`
- **Input:** topic, level (beginner/intermediate/expert)
- **Output:** Array of 10-15 concept names
- **Prompt:** See `concept-prompts-curriculum-aligned.ts`
- **Fallback:** Topic-specific hardcoded concepts if AI fails

**2. Generate Quiz Questions**
- **Endpoint:** `/api/ai/generate-quiz`
- **Input:** topic, concept, level, count (default 10)
- **Output:** Array of MCQ question objects
- **Prompt:** See `quiz-prompts-mcq-only.ts`
- **Validation:** Format check, quality score, fact check
- **Fallback:** Hardcoded questions from quiz-data.json if AI fails

### Refined AI Prompts

**For Concepts (Curriculum-Aligned):**
Key improvements:
- Emphasizes "what actual courses teach"
- Shows real examples (Python beginner, JavaScript intermediate, etc.)
- Specifies learning progression (fundamental → advanced)
- Generates 10-15 concepts (not limited to 8)
- Includes fallback concepts for Python, JavaScript, React, Java, C++, SQL

**For Quiz Questions (MCQ-Only):**
Key improvements:
- MCQ only (no short answer)
- Level-specific guidelines (beginner = recall, intermediate = application, expert = trade-offs)
- Quality requirements (plausible distractors, clear explanations, relevant keywords)
- Three concrete examples showing good questions
- Validation function filters questions <70 quality score

**Critical Requirements:**
- Use refined prompts (not old generic ones)
- Validate all AI responses before storing
- Implement retry logic for rate limits
- Cache all generated content (don't regenerate on page reload)
- Log all AI calls for debugging

---

## 👤 User Flows

### Flow 1: New User Onboarding

```
1. User lands on Home screen
   → Sees hero with background beams
   → Clicks "Start Learning" or "Add New Topic"

2. Topic Entry Screen
   → User enters topic: "Python"
   → System shows loading while AI generates concepts

3. Level Selection (Collapsible)
   → Three sections: Beginner | Intermediate | Expert
   → User clicks "Beginner" → section expands
   → Shows all 10-15 AI-generated concepts with checkboxes
   → User unchecks 2 concepts they already know
   → Clicks "Continue"

4. Study Parameters
   → "When do you want to complete retention?"
     Options: 1 week | 2 weeks | 3 weeks | 1 month | 3 months
   → "How much time daily?"
     Options: 5min | 10min | 15min | 30min | 1 hour
   → Clicks "Generate Quiz"

5. Quiz Generation & Storage
   → Loading: "Generating questions..." (10-15 seconds)
   → AI creates 10 MCQs per selected concept
   → Questions validated and stored
   → Schedule calculated based on parameters
   → Redirects to Cockpit

6. Cockpit View
   → Topic card appears with level badge
   → "Start Topic Quiz" button visible
   → Click → first quiz begins
```

---

### Flow 2: Taking a Quiz

```
1. User clicks "Start Topic Quiz" in Cockpit modal
   → System loads 10-15 pre-generated questions
   → Questions randomized (not grouped by concept)

2. Quiz Interface
   ┌─────────────────────────────────────┐
   │ Question 1 of 10    📊 Topic Quiz   │
   ├─────────────────────────────────────┤
   │ 💡 Variables and Data Types         │  ← Concept tag
   │                                     │
   │ What is the data type of x = 5?    │
   │                                     │
   │ ○ String                            │
   │ ○ Integer   ← User selects          │
   │ ○ Float                             │
   │ ○ Boolean                           │
   │                                     │
   │ [Previous] [Next →]                 │
   └─────────────────────────────────────┘

3. After Each Question
   → No immediate feedback (wait until end)
   → Progress bar updates
   → Can navigate back to previous questions

4. Quiz Completion
   → Particle burst animation (golden particles)
   → Results screen:
     - Overall score: 8/10 (80%)
     - Concept breakdown:
       • Variables: 3/3 ✓
       • Loops: 2/3 (missed Q4)
       • Functions: 3/4 (missed Q7, Q10)
   → Retention scores updated (time-decayed)
   → Options: [View Mistakes] [Redo Quiz] [Back to Cockpit]

5. View Mistakes (Optional)
   → Shows only incorrect questions
   → Displays:
     - ❌ Your answer: [wrong option]
     - ✅ Correct answer: [right option]
     - 💬 Explanation: [AI explanation]
   → Can navigate through all mistakes
```

---

### Flow 3: Reviewing Past Performance

```
1. User opens Cockpit
   → Clicks on "Python" topic card

2. Topic Modal Opens
   ┌────────────────────────────────────────┐
   │ python - Topic Progress         [✕]   │
   ├────────────────────────────────────────┤
   │ LEVEL: Beginner    STATUS: 65% 🟡     │
   │                                        │
   │ 📊 Concept Performance:               │
   │                                        │
   │ 💡 Variables          85% 🟢          │
   │    Last: 2 days ago • 3 attempts      │
   │    [Quiz This →]                      │
   │                                        │
   │ 🎯 Loops              45% 🔴          │
   │    Last: 7 days ago • 1 attempt       │
   │    [Quiz This →]                      │
   │                                        │
   │ 🎯 Quick Actions:                     │
   │ ┌─────────────────────────────┐      │
   │ │ ♻️ Redo Quiz           🎲  │      │
   │ └─────────────────────────────┘      │
   │                                        │
   │ [📊 View Quiz History]                │
   └────────────────────────────────────────┘

3. User clicks "View Quiz History"
   → Modal opens with list of all attempts
   → Filters: [All Quizzes ▼] [All Concepts ▼] [Last 30 days ▼]

4. Quiz History List (Reverse Chronological)
   ┌──────────────────────────────────────┐
   │ 📝 Topic Quiz    Feb 20, 2:30pm     │
   │ Score: 8/10 (80%) • 8 min           │
   │ Breakdown:                           │
   │ • Variables: 3/3 ✓                  │
   │ • Loops: 3/4 (missed Q4)            │
   │ • Functions: 2/3 (missed Q7)        │
   │                                      │
   │ [View Details] [Retake]             │
   └──────────────────────────────────────┘

5. User clicks "View Details"
   → Question-by-question review opens
   → Can see all 10 questions with:
     - ✅ or ❌ indicator
     - User's answer
     - Correct answer
     - Explanation
     - Concept tag
   → Navigate: [◀ Previous] [Next ▶] [Close]
```

---

## 🎨 UI Components & Interactions

### Sidebar (Aceternity Component)

**Installation:**
```bash
npx shadcn@latest add @aceternity/sidebar-demo
```

**Customization Requirements:**

**Desktop Behavior:**
- Default: Collapsed (60px wide, icons only)
- Hover: Expands to 300px, shows labels
- Smooth animation (300ms ease-in-out)

**Mobile Behavior:**
- Hamburger menu icon (top-left)
- Full-screen overlay when open
- Close button (top-right)

**Logo:**
- Collapsed: Owl eyes icon only (50x50px)
- Expanded: Owl eyes + "Memora" wordmark

**Navigation Links:**
```
🏠 Home
📊 Cockpit
🧠 Knowledge Base
⚙️ Settings
```

**Colors:**
- Background: `#0F172A` (midnight)
- Hover: Subtle teal glow `#0F766E` with 10% opacity
- Active link: Gold text `#D97706`
- Icons: `#94A3B8` (silver), active = `#D97706` (gold)

**User Profile (Bottom):**
- Avatar (circular, 40px)
- Name (only when expanded)
- Logout option on click

---

### Home Screen Background Beams

**Installation:**
```bash
npx shadcn@latest add @aceternity/background-beams-with-collision-demo
```

**Customization Requirements:**

**Beam Configuration:**
- Colors: Teal `#0F766E` → Gold `#D97706` gradient
- Count: 5-7 beams (not too many, subtle)
- Speed: Slow to medium (not distracting)
- Collision effect: Golden particle burst at bottom

**Dark Mode (Default):**
- Background: Gradient from `#0F172A` to `#1E293B`
- Beams: Full brightness (100% opacity)
- Collision: Bright gold burst with particles

**Light Mode:**
- Background: Gradient from `#FFFFFF` to `#F1F5F9`
- Beams: Reduced to 15-20% opacity
- Colors: Softer teal and gold (less saturated)
- Collision: Subtle glow (no bright burst)
- **Critical:** Ensure hero text remains readable

**Hero Content (Over Beams):**
```
H1: "Master Programming Through Active Recall"
H2: "Train your mind. Build lasting knowledge."
CTA: [Start Learning →] (gold button)
```

**Positioning:**
- Beams: Full screen background
- Hero: Centered, z-index above beams
- Text: White (dark mode), Dark navy (light mode)

---

### Topic Cards (Cockpit)

**Current State:**
```
┌─────────────────────────────┐
│ Python                      │
│ 5 concepts                  │
│ Last: Today • 65% 🟡       │
└─────────────────────────────┘
```

**Required Change - Add Level Badge:**
```
┌─────────────────────────────┐
│ Python          [Beginner] │  ← Add this
│ 5 concepts                  │
│ Last: Today • 65% 🟡       │
└─────────────────────────────┘
```

**Badge Styling:**
- Small rounded pill (px-2 py-1)
- Position: Top-right of card
- Font: text-xs font-medium
- Colors by level:
  - Beginner: `bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300`
  - Intermediate: `bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300`
  - Expert: `bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300`

---

### Quiz Action Buttons (Cockpit Modal + Knowledge Base)

**Pattern: Primary Button + Icon**

**Before First Quiz:**
```
┌──────────────────────┐
│ 📝 Start Topic Quiz  │
└──────────────────────┘
```

**After First Quiz:**
```
┌─────────────────────────────┐
│ ♻️ Redo Quiz           🎲  │  ← Regenerate icon
└─────────────────────────────┘
```

**Implementation:**
- Primary button: Full width, rounded-lg, primary color
- Icon: 🎲 dice emoji (or `<RefreshCw />` from lucide-react)
- Icon position: Right edge of button (inline)
- Icon size: 20px (h-5 w-5)
- Icon button: Ghost variant, no background until hover

**Tooltip on Icon:**
- Text: "Generate new questions"
- Delay: 300ms hover
- Style: Dark background, white text, rounded
- Position: Above icon

**Confirmation Dialog (On Icon Click):**
```
┌────────────────────────────────────────┐
│ Generate New Questions?                │
│                                        │
│ This will create 10 new questions     │
│ per concept. Your current questions    │
│ will be saved in history.              │
│                                        │
│ [Cancel]  [Generate & Start Quiz]     │
└────────────────────────────────────────┘
```

---

### Micro-Interactions

**Quiz Completion Animation:**
- Trigger: After submitting last question
- Effect: Golden particles burst from center
- Duration: 1-2 seconds
- Particles: 20-30, radiating outward, fading
- Color: Gold `#D97706` with opacity gradient
- Symbolizes: Knowledge solidifying in memory

**Retention Score Glow:**
- Applied to: Percentage numbers in Cockpit and Knowledge Base
- Effect: Subtle pulsing glow/shadow
- Colors by score:
  - Green (>70%): `box-shadow: 0 0 20px rgba(16, 185, 129, 0.4)`
  - Yellow (40-70%): `box-shadow: 0 0 20px rgba(245, 158, 11, 0.4)`
  - Red (<40%): `box-shadow: 0 0 20px rgba(239, 68, 68, 0.4)`
- Animation: 2s ease-in-out infinite pulse

**Loading States:**
- Replace spinners with ripple effect
- Teal circle expanding outward, fading
- Duration: 1.5s, repeat infinite
- Text below: "Processing..." in gold
- Use for: AI generation, quiz loading, data saving

---

## 💾 Data Architecture

### File Structure (JSON Storage - MVP)

```
data/
├── topics.json           # All topics with metadata
├── questions.json        # Question bank (all generated questions)
├── quiz-history.json     # Complete quiz attempt history
└── schedules.json        # (Future: spaced repetition scheduling)
```

### topics.json Schema

```json
{
  "topics": [
    {
      "id": "topic-python-001",
      "name": "Python",
      "level": "beginner",
      "createdAt": "2026-02-23T10:00:00Z",
      "concepts": [
        {
          "id": "concept-var-001",
          "name": "Variables and Data Types",
          "retentionScore": 85.3,
          "totalAttempts": 5,
          "lastPracticed": "2026-02-20T14:30:00Z",
          "questionCount": 10
        }
      ],
      "studyPlan": {
        "timeframe": "3 weeks",
        "dailyMinutes": 10,
        "targetDate": "2026-03-14"
      },
      "overallRetention": 73.2,
      "totalQuizAttempts": 12
    }
  ]
}
```

### questions.json Schema

```json
{
  "questions": [
    {
      "id": "q-python-var-001",
      "topicId": "topic-python-001",
      "conceptId": "concept-var-001",
      "conceptName": "Variables and Data Types",
      "type": "mcq",
      "question": "What is the data type of x after: x = 5",
      "options": [
        "String",
        "Float",
        "Integer",
        "Boolean"
      ],
      "correctAnswer": "Integer",
      "explanation": "In Python, assigning a whole number creates an integer type...",
      "keywords": ["variable", "integer", "data type", "assignment"],
      "difficulty": "beginner",
      "timesAsked": 5,
      "timesCorrect": 4,
      "createdAt": "2026-02-20T10:00:00Z"
    }
  ]
}
```

### quiz-history.json Schema

```json
{
  "quizzes": [
    {
      "id": "quiz-attempt-001",
      "topicId": "topic-python-001",
      "quizType": "topic",
      "conceptId": null,
      "date": "2026-02-20T14:30:00Z",
      "duration": 480,
      "totalQuestions": 10,
      "correctAnswers": 8,
      "score": 80,
      "questions": [
        {
          "questionId": "q-python-var-001",
          "conceptId": "concept-var-001",
          "conceptName": "Variables and Data Types",
          "userAnswer": "Integer",
          "correctAnswer": "Integer",
          "isCorrect": true
        }
      ],
      "conceptBreakdown": [
        {
          "conceptId": "concept-var-001",
          "conceptName": "Variables and Data Types",
          "total": 4,
          "correct": 4,
          "percentage": 100
        }
      ]
    }
  ]
}
```

---

## 🎨 Branding & Visual Identity

### Name & Meaning

**Memora** (pronounced "GLOW-kee")
- Origin: From Greek *glaukopis* (γλαυκῶπις) — Athena's epithet
- Meaning: "Bright-eyed" or "owl-eyed" (seeing clearly, wisdom)
- **Keep origin private for now** — no mention on site

### Brand Personality

**Archetype:** Wise Mentor  
**Tone:** Strategic, direct, empowering (not cheerful or coddling)

**Voice Examples:**
```
❌ "Great job! You're amazing!"
✅ "8 of 10. You're progressing."

❌ "Keep up the great work!"
✅ "Consistent practice sharpens the mind."
```

### Color System

```
Primary: Teal      #0F766E  (wisdom, depth)
Accent: Gold       #D97706  (achievement, owl eyes)
Dark: Midnight     #0F172A  (focus, depth)
Light: Silver      #94A3B8  (clarity, secondary text)

Success: Green     #10B981
Warning: Amber     #F59E0B
Error: Red         #EF4444
```

### Logo

**Primary Mark:** Owl Eyes (two glowing circles)
- Teal circles with golden irises
- Geometric, modern, minimal
- Works at any size (16px to 512px)

**Wordmark:** Memora in elegant serif
- Optional: Hidden owl eye in 'G'
- Used for marketing, headers

**Generation Prompt:**
```
Minimalist logo for learning platform: two glowing owl eyes, 
geometric circles, teal color #0F766E with golden irises #D97706, 
clean modern style, symmetric design, wisdom symbol, dark navy 
background, professional tech branding, vector art, suitable for app icon
```

### Typography

- Display: Elegant serif (Georgia or custom)
- Body: System sans-serif (Inter, -apple-system, sans-serif)
- Code: JetBrains Mono

### Key Phrases

- "Train your mind"
- "See clearly, learn deeply"
- "Strategic learning"
- "Master through practice"
- "Where knowledge connects" (tagline)

---

## ✅ Implementation Requirements

### Phase 1: Foundation (Week 1)

**Name Change:**
- [ ] Replace all "Memora" text with "Memora"
- [ ] Update page titles, meta descriptions
- [ ] Update any hardcoded strings

**Logo:**
- [ ] Generate logo using AI prompt provided
- [ ] Create favicon (16x16, 32x32, 64x64)
- [ ] Export SVG (owl eyes), PNG (wordmark)
- [ ] Add to public/assets/

**Colors:**
- [ ] Update Tailwind config with Memora color palette
- [ ] Replace any hardcoded colors in components
- [ ] Test dark mode + light mode contrast

---

### Phase 2: Sidebar & Home (Week 2)

**Sidebar (Aceternity):**
- [ ] Install component: `npx shadcn@latest add @aceternity/sidebar-demo`
- [ ] Replace Aceternity logo with Memora owl eyes
- [ ] Update navigation: Home, Cockpit, Knowledge Base, Settings
- [ ] Remove "Add Topic" (exists on Home page)
- [ ] Style: midnight background, gold accents
- [ ] Test: Desktop hover expand, mobile full-screen

**Home Screen Beams:**
- [ ] Install component: `npx shadcn@latest add @aceternity/background-beams-with-collision-demo`
- [ ] Customize beam colors (teal → gold gradient)
- [ ] Configure for dark mode (full brightness)
- [ ] Configure for light mode (15-20% opacity, softer colors)
- [ ] Ensure text readability on both modes
- [ ] Add hero content over beams

---

### Phase 3: Quiz System (Week 3)

**Concept Generation:**
- [ ] Use refined prompt: `concept-prompts-curriculum-aligned.ts`
- [ ] Implement fallback for common topics (Python, JavaScript, React, etc.)
- [ ] Display concepts in collapsible accordion
- [ ] Show 10-15 concepts per level (not limited to 8)
- [ ] Allow check/uncheck before proceeding

**Quiz Question Generation:**
- [ ] Use refined prompt: `quiz-prompts-mcq-only.ts`
- [ ] MCQ only (4 options each)
- [ ] Generate 10 questions per concept
- [ ] Validate format and quality
- [ ] Store in questions.json

**Quiz Taking:**
- [ ] Display concept tag on each question
- [ ] Randomize question order (not grouped)
- [ ] No immediate feedback (wait until end)
- [ ] Calculate concept breakdown in results

**Quiz Actions:**
- [ ] First time: Show "Start Topic Quiz"
- [ ] After first quiz: Show "Redo Quiz" + 🎲 icon
- [ ] Implement regenerate confirmation dialog
- [ ] Store all attempts in quiz-history.json

---

### Phase 4: History & Tracking (Week 4)

**Quiz History:**
- [ ] Implement quiz-history.json storage
- [ ] Store question-level detail
- [ ] Create history modal (filter by type, concept, date)
- [ ] Question-by-question review view
- [ ] "Retake Quiz" functionality

**Retention Scoring:**
- [ ] Implement time-decay formula (7-day half-life)
- [ ] Calculate per-concept scores
- [ ] Update after every quiz
- [ ] Display with color indicators (green/yellow/red)

**Topic Cards:**
- [ ] Add level badge (top-right corner)
- [ ] Style by level (blue/amber/purple)

**Micro-Animations:**
- [ ] Quiz completion particle burst
- [ ] Retention score pulsing glow
- [ ] Ripple loading states

---

### Testing Checklist

**Functional:**
- [ ] AI concept generation works (with fallback)
- [ ] AI quiz generation works (with fallback)
- [ ] Questions validate correctly
- [ ] Quiz flow complete (start → take → results)
- [ ] History stores all attempts
- [ ] Retention scores calculate correctly
- [ ] Regenerate creates new questions

**Visual:**
- [ ] Sidebar animations smooth
- [ ] Background beams work in light + dark mode
- [ ] Text readable on all backgrounds
- [ ] Level badges display correctly
- [ ] Icons and tooltips function
- [ ] Particles and glows perform well

**Mobile:**
- [ ] Sidebar hamburger menu works
- [ ] Collapsible sections stack vertically
- [ ] Quiz questions readable and tappable
- [ ] History modal scrolls properly
- [ ] No horizontal overflow

---

## 📋 Success Criteria

After implementation, the platform should:

**Feel Strategic:**
- Not random, methodical
- Users know exactly what they're practicing
- Concept tags make learning intentional

**Feel Observant:**
- Tracks performance per concept
- Shows patterns (common mistakes)
- Retention scores reflect actual memory

**Feel Empowering:**
- Direct feedback ("8 of 10")
- No excessive celebration
- Users see exactly where to improve

**Look Professional:**
- Clean, modern design
- Consistent branding
- Smooth animations
- Works perfectly on mobile

**Work Reliably:**
- AI generates quality content
- Questions stored for instant access
- History never lost
- No bugs in quiz flow

---

## 🚀 Launch Readiness

Before considering MVP complete:

1. **AI prompts tested** with 5+ topics each (Python, JavaScript, React, Java, SQL)
2. **All quiz flows work** (topic quiz, concept quiz, redo, regenerate)
3. **History tracking complete** (view past attempts, question-by-question review)
4. **Retention scoring accurate** (time decay implemented, scores update)
5. **Visual polish done** (sidebar, beams, badges, animations)
6. **Mobile tested** (all features work on phone)
7. **Performance verified** (page loads <2s, animations smooth)

---

**This document provides complete context for building Memora. Reference sections as needed during implementation.** 🦉
