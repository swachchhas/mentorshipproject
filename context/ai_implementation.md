# Memora AI Layer Implementation Plan
## From Dummy Data to Intelligent Learning System

**Version:** 1.0  
**Date:** February 2026  
**For:** Antigravity (Implementation Agent)

---

## 🎯 What We're Building

**Current State:**
- User adds topic → sees hardcoded concept suggestions
- Dummy quiz questions from `quiz-data.json`
- Dummy schedule data
- No personalization

**Target State:**
- User adds topic → **AI generates level-appropriate concepts**
- User selects timeframe + daily commitment → **AI creates personalized study schedule**
- **AI generates MCQs and short QnAs** for each concept
- **Validation layer** ensures quality before storage
- **Real quiz sessions** scheduled based on spaced repetition
- All stored in **JSON files** (for MVP)

---

## 📋 New User Flow

### Current Topic Onboarding:
```
1. User enters topic: "C++"
2. User selects level: "Intermediate"
3. System shows hardcoded concepts ❌
4. User picks concepts
5. Quiz starts
```

### New AI-Enhanced Flow:
```
1. User enters topic: "C++"
2. AI generates level-appropriate concepts ✨
   → Beginner: [variables, data types, cout/cin, conditionals, loops]
   → Intermediate: [pointers, references, classes, OOP, templates]
   → Expert: [move semantics, RAII, template metaprogramming]
   
3. User selects concepts: [pointers, references, classes]

4. NEW: User answers study planning questions:
   ❓ "When do you want to complete retention for this?"
      Options: 1 week | 2 weeks | 3 weeks | 1 month | 3 months
   
   ❓ "How much time can you commit daily?"
      Options: 5 min | 10 min | 15 min | 30 min | 1 hour

5. AI generates personalized schedule ✨
   Based on: 3 concepts × 3 weeks × 10 min/day
   → Creates spaced repetition schedule
   → Assigns quiz sessions to specific dates
   → Calculates questions per session

6. AI generates quiz questions ✨
   → MCQs (4 options each)
   → Short QnAs (keyword-based)
   → Questions validated before storage
   → Stored in JSON with correct answers

7. User takes quiz on scheduled dates
   → Home page shows "Due for Review" with real data
   → Questions pulled from generated JSON
   → Answers evaluated against stored keywords
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INPUT                            │
│  Topic: C++  |  Level: Intermediate  |  Time: 10min/day     │
│  Timeframe: 3 weeks  |  Concepts: [pointers, classes]       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI GENERATION LAYER                       │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Concept    │    │   Schedule   │    │    Quiz      │ │
│  │  Generator   │ →  │  Generator   │ →  │  Generator   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
└─────────┼────────────────────┼────────────────────┼─────────┘
          ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────────────┐
│                    VALIDATION LAYER                          │
│                                                              │
│  ✓ Format validation     ✓ Fact checking                   │
│  ✓ Quality scoring       ✓ Keyword extraction               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                      JSON STORAGE                            │
│                                                              │
│  topics.json    schedules.json    questions.json            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                       USER INTERFACE                         │
│                                                              │
│  Home: Real due sessions  |  Cockpit: Actual progress       │
│  Learn: Generated quizzes |  Knowledge Base: Real analytics │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
app/
├── add-topic/
│   └── page.tsx                   # Updated: AI concept generation + new questions
├── learn/[topicId]/
│   └── page.tsx                   # Updated: Uses AI-generated questions
├── api/
│   └── ai/
│       ├── generate-concepts/
│       │   └── route.ts           # NEW: Generate concepts by level
│       ├── generate-schedule/
│       │   └── route.ts           # NEW: Create study schedule
│       ├── generate-quiz/
│       │   └── route.ts           # NEW: Generate MCQs + QnAs
│       └── validate-questions/
│           └── route.ts           # NEW: Quality check before storage

lib/
├── ai/
│   ├── huggingface-client.ts      # ✅ Already created
│   ├── prompts/
│   │   ├── concept-prompts.ts     # NEW: Prompts for concept generation
│   │   ├── schedule-prompts.ts    # NEW: Prompts for scheduling
│   │   └── quiz-prompts.ts        # NEW: Prompts for questions
│   ├── parsers/
│   │   ├── concept-parser.ts      # NEW: Parse AI concept output
│   │   ├── schedule-parser.ts     # NEW: Parse schedule output
│   │   └── quiz-parser.ts         # NEW: Parse question output
│   └── validators/
│       ├── format-validator.ts    # NEW: Check required fields
│       ├── fact-validator.ts      # NEW: Basic fact checking
│       └── quality-scorer.ts      # NEW: Score question quality
├── storage/
│   ├── topics-storage.ts          # Updated: Save AI-generated data
│   ├── schedules-storage.ts       # NEW: Manage schedules
│   └── questions-storage.ts       # NEW: Manage question bank
└── utils/
    ├── schedule-calculator.ts     # NEW: Calculate session dates
    └── spaced-repetition.ts       # NEW: SR algorithm

data/ (NEW - JSON files)
├── topics.json                    # All topics with concepts
├── schedules.json                 # Study schedules
└── questions.json                 # Question bank

types/
└── ai.ts                          # NEW: AI-related types
```

---

## 🎯 Core Requirements

### Requirement 1: AI Concept Generation

**When:** User enters topic name and selects level  
**What:** AI suggests appropriate concepts for that level  

**Example:**
```typescript
Input: { topic: "C++", level: "intermediate" }

Output: [
  "Pointers and memory management",
  "References and const correctness",
  "Classes and objects",
  "Constructors and destructors",
  "Operator overloading",
  "Inheritance and polymorphism",
  "Templates basics",
  "STL containers"
]
```

**User can:**
- Check/uncheck AI-suggested concepts
- Add custom concepts
- Edit concept names inline

---

### Requirement 2: Study Planning Questions

**Add two new questions to topic onboarding:**

**Question 1: Timeframe**
```
"When do you want to complete retention for this topic?"

Options:
○ 1 week     (intensive, daily practice)
○ 2 weeks    (focused learning)
○ 3 weeks    (balanced pace)
○ 1 month    (relaxed, thorough)
○ 3 months   (long-term mastery)
```

**Question 2: Daily Commitment**
```
"How much time can you commit to learning this daily?"

Options:
○ 5 minutes   (quick reviews, 2-3 questions)
○ 10 minutes  (standard session, 5-7 questions)
○ 15 minutes  (focused session, 8-10 questions)
○ 30 minutes  (deep practice, 15-20 questions)
○ 1 hour      (intensive study, 30+ questions)
```

**Capture in topic data:**
```typescript
interface Topic {
  // ... existing fields
  studyPlan: {
    targetCompletionDate: Date;      // calculated from timeframe
    dailyTimeCommitment: number;     // minutes
    selectedTimeframe: string;        // "3 weeks"
    questionsPerSession: number;      // calculated
  };
}
```

---

### Requirement 3: AI Schedule Generation

**When:** After user answers planning questions  
**What:** AI creates a spaced repetition schedule

**Calculation Logic:**
```typescript
// Example: 3 concepts, 3 weeks, 10 min/day

totalDays = 21 days
totalMinutes = 21 × 10 = 210 minutes
concepts = 3

// Distribute time across concepts
minutesPerConcept = 210 / 3 = 70 minutes per concept

// Calculate sessions per concept
// Assuming 10 min/session = 7 sessions per concept

// Spaced repetition intervals:
// Session 1: Day 1  (initial learning)
// Session 2: Day 2  (reinforce)
// Session 3: Day 4  (short-term retention)
// Session 4: Day 7  (medium-term retention)
// Session 5: Day 11 (long-term retention)
// Session 6: Day 16 (spaced review)
// Session 7: Day 21 (final review)
```

**Output Format:**
```json
{
  "topicId": "cpp-001",
  "schedule": [
    {
      "date": "2026-02-21",
      "concepts": ["pointers"],
      "sessionType": "initial",
      "estimatedTime": 10,
      "questionCount": 5
    },
    {
      "date": "2026-02-22",
      "concepts": ["pointers"],
      "sessionType": "reinforcement",
      "estimatedTime": 10,
      "questionCount": 5
    },
    {
      "date": "2026-02-24",
      "concepts": ["pointers", "references"],
      "sessionType": "mixed-review",
      "estimatedTime": 10,
      "questionCount": 7
    }
    // ... more sessions
  ]
}
```

**Store in:** `data/schedules.json`

---

### Requirement 4: AI Quiz Question Generation

**When:** After schedule is created  
**What:** Generate questions for each concept

**Types to Generate:**

**A) Multiple Choice Questions (MCQs)**
```json
{
  "id": "q-cpp-ptr-001",
  "conceptId": "pointers",
  "type": "MCQ",
  "difficulty": "intermediate",
  "question": "What does the * operator do when used with a pointer?",
  "options": [
    "Declares a pointer",
    "Dereferences a pointer to access the value",
    "Gets the memory address",
    "Deletes the pointer"
  ],
  "correctAnswer": "Dereferences a pointer to access the value",
  "explanation": "The * operator is used to dereference a pointer...",
  "keywords": ["pointer", "dereference", "value", "operator"]
}
```

**B) Short Answer Questions (QnAs)**
```json
{
  "id": "q-cpp-ptr-002",
  "conceptId": "pointers",
  "type": "short-answer",
  "difficulty": "intermediate",
  "question": "Explain what happens when you dereference a null pointer.",
  "correctAnswer": "Dereferencing a null pointer causes undefined behavior, typically resulting in a segmentation fault or program crash.",
  "keywords": ["null", "undefined behavior", "segmentation fault", "crash", "dereference"],
  "acceptableAnswers": [
    "causes crash",
    "segmentation fault",
    "undefined behavior",
    "program terminates"
  ]
}
```

**Generate per concept:**
- Minimum: 10 questions (mix of MCQ and short-answer)
- Distribution: 60% MCQ, 40% short-answer
- Difficulty: Match user's selected level

**Store in:** `data/questions.json`

---

### Requirement 5: Validation Layer

**Before storing any AI-generated content, validate:**

**Format Validation:**
```typescript
// Check required fields exist
✓ question text is not empty
✓ correct answer exists
✓ explanation is present (min 20 chars)
✓ keywords array has 3+ items
✓ MCQ has exactly 4 options
```

**Quality Scoring:**
```typescript
// Score 0-100 based on:
- Clarity (question < 200 chars)
- Completeness (all fields present)
- Keyword quality (relevant terms)
- Explanation quality (helpful, not just "it's correct")

// Only keep questions with score >= 70
```

**Fact Checking (Basic):**
```typescript
// For science/technical topics:
- Check common terminology misuse
- Flag suspicious patterns
- Compare against known correct facts

// Example: Photosynthesis
if (question.includes("byproduct") && answer.includes("glucose")) {
  flag = "FACTUAL ERROR: glucose is product, not byproduct";
}
```

**Output:**
```typescript
interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];      // blocking problems
  warnings: string[];    // non-blocking concerns
  flagForReview: boolean;
}
```

**Action:**
- score >= 85: Auto-approve, store immediately
- score 70-84: Store but flag for review
- score < 70: Discard, regenerate

---

### Requirement 6: Home Page Due Sessions

**Current:** Shows dummy "Due for Review" cards  
**New:** Show actual scheduled sessions for today

**Logic:**
```typescript
// On Home page load:
1. Load schedules.json
2. Filter sessions where date === today
3. For each session:
   - Get topic name
   - Get concepts to review
   - Count questions available
   - Show memory score if exists
4. Display as cards in "Due for Review" section
```

**Display:**
```
Due for Review (2)

┌─────────────────────────────────────┐
│ 📚 C++ - Pointers                   │
│ 5 questions • Memory: 67%           │
│ [Start Review →]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🐍 Python - Async/Await             │
│ 7 questions • Memory: 82%           │
│ [Start Review →]                    │
└─────────────────────────────────────┘
```

Clicking "Start Review" → `/learn/[topicId]?session=[sessionId]`

---

## 🔄 Data Flow Example

**Complete flow: User adds "JavaScript" topic**

```typescript
// 1. USER INPUT
const input = {
  topic: "JavaScript",
  level: "intermediate",
  timeframe: "3 weeks",
  dailyTime: 10, // minutes
};

// 2. AI GENERATES CONCEPTS
POST /api/ai/generate-concepts
→ Returns: ["Promises", "Async/Await", "Closures", "This keyword", "Prototypes"]
→ User selects: ["Promises", "Async/Await", "Closures"]

// 3. AI GENERATES SCHEDULE
POST /api/ai/generate-schedule
Body: {
  concepts: ["Promises", "Async/Await", "Closures"],
  timeframe: 21, // days
  dailyMinutes: 10
}
→ Returns: Schedule with dates and session plans
→ Saved to: data/schedules.json

// 4. AI GENERATES QUESTIONS (for each concept)
For concept in ["Promises", "Async/Await", "Closures"]:
  POST /api/ai/generate-quiz
  Body: { concept, topic, level, count: 10 }
  → Returns: 10 questions (6 MCQ, 4 short-answer)
  
  POST /api/ai/validate-questions
  Body: { questions }
  → Returns: validated questions (score >= 70)
  
  → Saved to: data/questions.json

// 5. TOPIC CREATED
Topic saved to data/topics.json with:
- ID, name, level
- Selected concepts
- Study plan details
- Reference to schedule ID

// 6. USER SEES REAL DATA
- Home page: "Due for Review" shows today's session
- Cockpit: Progress shows actual schedule
- Learn page: Questions pulled from questions.json
```

---

## 🚀 Implementation Phases

### Phase 1: AI Concept Generation 
**Goal:** Replace hardcoded concepts with AI suggestions

**Tasks:**
- [ ] Create `/api/ai/generate-concepts` route
- [ ] Build concept generation prompt
- [ ] Parse AI response into concept array
- [ ] Update Add Topic UI to show AI concepts
- [ ] Allow user to edit/add concepts
- [ ] Store selected concepts in topics.json

**Deliverable:** User can add "Python" and see AI-suggested concepts

---

### Phase 2: Study Planning 
**Goal:** Add timeframe and commitment questions

**Tasks:**
- [ ] Add two new steps to Add Topic flow
- [ ] Create UI for timeframe selection
- [ ] Create UI for daily time commitment
- [ ] Save responses in topic data
- [ ] Calculate target completion date

**Deliverable:** User answers planning questions, data captured

---

### Phase 3: AI Schedule Generation 
**Goal:** Generate personalized study schedule

**Tasks:**
- [ ] Create `/api/ai/generate-schedule` route
- [ ] Build schedule generation prompt
- [ ] Implement spaced repetition calculator
- [ ] Parse AI schedule into sessions
- [ ] Save to schedules.json
- [ ] Link schedule to topic

**Deliverable:** Each topic has a real schedule

---

### Phase 4: AI Quiz Generation 
**Goal:** Generate MCQs and short-answer questions

**Tasks:**
- [ ] Create `/api/ai/generate-quiz` route
- [ ] Build quiz generation prompts (MCQ + QnA)
- [ ] Parse AI response into question objects
- [ ] Generate 10 questions per concept
- [ ] Store in questions.json

**Deliverable:** Question bank exists for all concepts

---

### Phase 5: Validation Layer 
**Goal:** Quality control before storage

**Tasks:**
- [ ] Create `/api/ai/validate-questions` route
- [ ] Implement format validator
- [ ] Implement quality scorer
- [ ] Implement basic fact checker
- [ ] Filter questions (keep score >= 70)
- [ ] Flag questions for review (score 70-84)

**Deliverable:** Only high-quality questions stored

---

### Phase 6: Real Due Sessions 
**Goal:** Home page shows actual scheduled reviews

**Tasks:**
- [ ] Update Home page to read schedules.json
- [ ] Filter sessions by today's date
- [ ] Load questions for each session
- [ ] Display in "Due for Review" widget
- [ ] Update Cockpit to show schedule progress

**Deliverable:** Home page shows real due sessions

---

### Phase 7: Quiz Experience 
**Goal:** User takes quiz with AI-generated questions

**Tasks:**
- [ ] Update `/learn/[topicId]` to use questions.json
- [ ] Load questions for session
- [ ] Display MCQs with options
- [ ] Display short-answer with text input
- [ ] Score answers (keyword matching for QnA)
- [ ] Update memory scores
- [ ] Reschedule next session

**Deliverable:** Full quiz experience with AI questions

---

## 📝 JSON File Schemas

### `data/topics.json`
```json
{
  "topics": [
    {
      "id": "topic-001",
      "name": "C++",
      "level": "intermediate",
      "concepts": [
        {
          "id": "concept-001",
          "name": "Pointers",
          "aiGenerated": true
        },
        {
          "id": "concept-002",
          "name": "References",
          "aiGenerated": true
        }
      ],
      "studyPlan": {
        "timeframe": "3 weeks",
        "dailyMinutes": 10,
        "targetDate": "2026-03-14",
        "questionsPerSession": 5
      },
      "scheduleId": "schedule-001",
      "createdAt": "2026-02-21T10:00:00Z"
    }
  ]
}
```

### `data/schedules.json`
```json
{
  "schedules": [
    {
      "id": "schedule-001",
      "topicId": "topic-001",
      "sessions": [
        {
          "id": "session-001",
          "date": "2026-02-21",
          "conceptIds": ["concept-001"],
          "type": "initial",
          "questionCount": 5,
          "completed": false,
          "result": null
        }
      ],
      "createdAt": "2026-02-21T10:00:00Z"
    }
  ]
}
```

### `data/questions.json`
```json
{
  "questions": [
    {
      "id": "q-001",
      "topicId": "topic-001",
      "conceptId": "concept-001",
      "type": "MCQ",
      "difficulty": "intermediate",
      "question": "What does the * operator do with a pointer?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "B",
      "explanation": "...",
      "keywords": ["pointer", "dereference"],
      "validationScore": 92,
      "aiGenerated": true,
      "createdAt": "2026-02-21T10:00:00Z"
    }
  ]
}
```

---

## ⚙️ Technical Specifications

### API Rate Limits
- HuggingFace free tier: ~1000 requests/day
- Solution: Generate all questions at once, store locally
- Don't regenerate on every quiz attempt

### Error Handling
- If AI fails: Fall back to quiz-data.json
- If validation fails: Regenerate question
- If all questions fail: Show error, suggest retry

### Performance
- Generate concepts: ~2-3 seconds
- Generate schedule: ~1-2 seconds
- Generate 10 questions: ~5-10 seconds
- Total onboarding time: ~15-20 seconds

### Data Persistence
- Use localStorage for JSON files (MVP)
- File structure mimics future database schema
- Easy migration to real DB later

---

## 🎯 Success Criteria

After implementation:

**User Flow:**
1. ✅ User adds "Python" → AI suggests 8 relevant concepts
2. ✅ User selects "Async/Await, Promises, Functions"
3. ✅ User answers: 3 weeks, 10 min/day
4. ✅ AI generates 21-day schedule with spaced sessions
5. ✅ AI generates 30 questions (10 per concept)
6. ✅ Questions validated (90%+ pass quality check)
7. ✅ Home page shows "Due for Review" with 1 session today
8. ✅ User takes quiz with AI-generated questions
9. ✅ Memory scores update based on performance
10. ✅ Next session scheduled according to spaced repetition

**Data Quality:**
- 80%+ of AI-generated concepts are relevant
- 85%+ of AI-generated questions pass validation
- Schedules follow spaced repetition principles
- Due sessions show on correct dates

---

## 🚧 Out of Scope (For Now)

Don't implement yet:
- Real database (use JSON for MVP)
- Voice answer evaluation (later phase)
- Auto-generated study notes (later phase)
- Article recommendations (later phase)
- Multi-user support (later phase)
- Analytics dashboards (later phase)

---

## 💡 Implementation Tips

1. **Start with Concepts:** Get AI concept generation working first, it's the simplest
2. **Test Prompts Thoroughly:** Spend time perfecting prompts before building UI
3. **Generate Once, Store Forever:** Don't regenerate questions on every page load
4. **Validate Early:** Catch bad questions before they reach users
5. **Fallback Gracefully:** Always have quiz-data.json as backup
6. **Log Everything:** Track AI calls, validation results, user feedback

---

## 🎬 Next Steps

**Immediate (This Week):**
1. Implement Phase 1 and 2 (AI Concept Generation)
2. Test with 5 different topics
3. Verify concepts are relevant


4. Add study planning questions
5. Implement schedule generation
6. Test scheduling algorith
7. Implement quiz generation
8. Add validation layer
9. Test with real users
10. Connect everything
11. Update Home page with due sessions
12. Polish and iterate

---

**End of Implementation Plan**

Build incrementally. Test each phase before moving to the next. Focus on quality over speed. The AI is a tool to enhance learning, not replace good educational design.

Let's make it happen! 🚀
