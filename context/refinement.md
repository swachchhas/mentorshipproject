# LearningLoop — Page Restructure & Redesign
## Separating Cockpit, Content Dump, and Knowledge Base

**Version:** 2.0  
**Date:** February 2026  
**Purpose:** Clear separation of concerns with optimized user experience

---

## 🎯 Core Philosophy

**The Hierarchy:**
```
User
  └── Topics (2-3 active at once) ← Cockpit level
       └── Concepts (many per topic) ← Knowledge Base level
            └── Quiz Sessions ← Knowledge Base detail
```

**Key Insight:** Users learn few topics but many concepts. The UI should reflect this by:
- Making **Cockpit** topic-centric (high-level overview)
- Making **Knowledge Base** concept-centric (deep dive into learning)
- Making **Content Dump** a filtering feature, not a standalone page

---

## 📊 Page-by-Page Breakdown

### 1️⃣ **COCKPIT** — Your Learning Dashboard
**Route:** `/cockpit`  
**Icon:** Activity (pulse/dashboard icon)  
**Purpose:** High-level overview of learning progress and health

#### What It Shows:
```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Cockpit                                                  │
│  Your learning progress at a glance                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │    4     │  │   57%    │  │    4     │  │    8     │   │
│  │  Topics  │  │ Avg. Mem │  │   Due    │  │ Sessions │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────── PRIORITY REVIEW ──────────────────┐ │
│  │                                                         │ │
│  │  ⚠️ python                          [Review →]        │ │
│  │     Review overdue                                     │ │
│  │                                                         │ │
│  │  ⚠️ photosynthesis                  [Review →]        │ │
│  │     Review overdue                                     │ │
│  │                                                         │ │
│  │  ⚠️ leadership training             [Review →]        │ │
│  │     Review overdue                                     │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────── ACTIVE TOPICS ────────────────────┐ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ 📚 python                               34% 🔴  │  │ │
│  │  │ 12 concepts • Last practiced 2 days ago         │  │ │
│  │  │ [Continue Learning →]                            │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ 🧬 photosynthesis                      59% 🟡  │  │ │
│  │  │ 3 concepts • Last practiced 5 days ago          │  │ │
│  │  │ [Continue Learning →]                            │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ 💼 leadership training                82% 🟢  │  │ │
│  │  │ 8 concepts • Last practiced 1 day ago           │  │ │
│  │  │ [Continue Learning →]                            │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Features:
- **4 Stat Cards** (existing): Total Topics, Avg Memory %, Due Count, Sessions
- **Priority Review Panel**: Shows overdue topics with direct "Review" CTA
- **Active Topics Panel**: Topic-level cards showing:
  - Topic name with emoji/icon
  - Overall memory score with color indicator (🔴 weak / 🟡 average / 🟢 strong)
  - Concept count
  - Last practiced timestamp
  - "Continue Learning" button → `/learn/[topicId]`

#### Navigation:
- Clicking "Review" → Takes to `/learn/[topicId]` (quiz flow)
- Clicking "Continue Learning" → Takes to `/learn/[topicId]` (quiz flow)
- No concept-level detail here (that's Knowledge Base territory)

#### Design Notes:
- Clean, spacious, not overwhelming
- Topic cards use soft gradients based on memory score
- Color system: Red <40%, Yellow 40-70%, Green >70%
- Maximum 6 topics shown (typical user has 2-3)

---

### 2️⃣ **KNOWLEDGE BASE** — Your Second Brain
**Route:** `/knowledge-base`  
**Icon:** Brain or BookOpen  
**Purpose:** Concept-centric deep dive into everything learned

#### What It Shows:
```
┌─────────────────────────────────────────────────────────────┐
│  🧠 Knowledge Base                     [🔍 Search concepts] │
│  Your second brain — everything you've learned              │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│ 📂 All (47)  │  ┌─── CONCEPT OVERVIEW ───────────────────┐ │
│              │  │                                          │ │
│ Filters ▼    │  │  Showing 47 concepts across 4 topics    │ │
│              │  │                                          │ │
│ 💻 Coding(15)│  └──────────────────────────────────────────┘ │
│ 🔬 Science(8)│                                               │
│ 📖 Theory(12)│  ┌────────────────────────────────────────┐  │
│ 🏃 Practice  │  │ 🐍 Variables and Data Types             │  │
│ 📜 History   │  │ from Python                        98% │  │
│ ➕ Math      │  │                                          │  │
│              │  │ 📊 Reviewed: 18 times                   │  │
│ Sort by ▼    │  │ ✅ Accuracy: 98%                        │  │
│ • Recency    │  │ 📅 Last Quiz: 2/8/2026                  │  │
│ • Accuracy   │  │ 💪 Status: STRONG                       │  │
│ • Weak First │  │                                          │  │
│              │  │ 💡 AI Insight: Well-understood. User    │  │
│              │  │ has encountered this in 18 sessions.    │  │
│              │  │                                          │  │
│              │  │ [View Sessions →] [Quiz Again →]       │  │
│              │  └────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌────────────────────────────────────────┐  │
│              │  │ 🌿 Light-dependent reactions            │  │
│              │  │ from Photosynthesis               67% │  │
│              │  │                                          │  │
│              │  │ 📊 Reviewed: 5 times                    │  │
│              │  │ ✅ Accuracy: 67%                        │  │
│              │  │ 📅 Last Quiz: 1/30/2026                 │  │
│              │  │ ⚡ Status: AVERAGE                      │  │
│              │  │                                          │  │
│              │  │ 💡 AI Insight: Needs reinforcement.     │  │
│              │  │                                          │  │
│              │  │ [View Sessions →] [Quiz Again →]       │  │
│              │  └────────────────────────────────────────┘  │
│              │                                               │
│              │  ┌────────────────────────────────────────┐  │
│              │  │ 🔄 Control flow and loops               │  │
│              │  │ from Python                        34% │  │
│              │  │                                          │  │
│              │  │ 📊 Reviewed: 12 times                   │  │
│              │  │ ❌ Accuracy: 34%                        │  │
│              │  │ 📅 Last Quiz: 2/4/2026                  │  │
│              │  │ ⚠️ Status: WEAK                         │  │
│              │  │                                          │  │
│              │  │ 💡 AI Insight: Struggling. Consider     │  │
│              │  │ reviewing fundamentals.                 │  │
│              │  │                                          │  │
│              │  │ [View Sessions →] [Quiz Again →]       │  │
│              │  └────────────────────────────────────────┘  │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

#### Left Sidebar — Content Dump (Filter Panel):
This is where the "Content Dump" lives — as a filtering mechanism, not a page.

**Filters:**
- **Tag Filters** (Coding, Science, Theory, Practice, History, Math)
  - Shows count next to each tag
  - Click to filter concepts by tag
  - Multi-select enabled (AND logic: show concepts tagged with both Science AND Theory)
  
- **Topic Filters** (Optional dropdown)
  - "From Python"
  - "From Photosynthesis"
  - "From Leadership Training"

- **Sort Options:**
  - Recency (most recently practiced)
  - Accuracy (weak first, strong first)
  - Alphabetical

#### Main Content Area — Concept Cards:
Each concept card shows:
- **Concept name** with emoji
- **Parent topic** (small text)
- **Memory score** with color indicator
- **Stats:** 
  - Times reviewed (quiz session count)
  - Accuracy %
  - Last quiz date
  - Status badge (Strong / Average / Weak)
- **AI Insight** (future feature): 
  - "Well-understood. User has encountered this in 18 sessions."
  - "Needs reinforcement. Consider reviewing fundamentals."
- **Actions:**
  - "View Sessions" → Opens modal/detail view with session history
  - "Quiz Again" → `/learn/[topicId]` (filtered to this concept)

#### Concept Detail Modal (Click "View Sessions"):
```
┌────────────────────────────────────────────────────────┐
│ 🔍 Concept Details                               [✕]  │
│ Detailed analytics for "Light-dependent reactions"     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐         ┌──────────┐                    │
│  │    18    │         │   98%    │                    │
│  │ REVIEWED │         │ ACCURACY │                    │
│  └──────────┘         └──────────┘                    │
│                                                         │
│  📅 Last Quiz: 2/8/2026                                │
│  💪 Status: STRONG                                     │
│                                                         │
│  ┌─── AI INSIGHT ────────────────────────────────────┐ │
│  │ This concept seems well-understood. User has       │ │
│  │ encountered this in 18 separate quiz sessions.     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─── QUIZ HISTORY ───────────────────────────────────┐│
│  │                                                     ││
│  │  📝 Session #18 — 2/8/2026                         ││
│  │     Q: What is the primary output of light...     ││
│  │     A: ATP and NADPH ✅                            ││
│  │                                                     ││
│  │  📝 Session #17 — 2/4/2026                         ││
│  │     Q: Where do light-dependent reactions occur?   ││
│  │     A: Thylakoid membrane ✅                       ││
│  │                                                     ││
│  │  📝 Session #16 — 2/1/2026                         ││
│  │     Q: What is the role of chlorophyll?            ││
│  │     A: Absorbs light energy ✅                     ││
│  │                                                     ││
│  │  [Load More Sessions...]                           ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─── KEYWORD TRACKING (FUTURE) ──────────────────────┐│
│  │                                                     ││
│  │  ✅ thylakoid    ✅ ATP         ✅ NADPH          ││
│  │  ✅ chlorophyll  ✅ photon      ❌ stroma         ││
│  │  ✅ electron     ❌ chemiosmosis                   ││
│  │                                                     ││
│  │  Green = mentioned in answers                      ││
│  │  Red = not yet mentioned                           ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│                               [Close]                   │
└────────────────────────────────────────────────────────┘
```

#### Future Features (Post-MVP):
**1. Voice Answers + Keyword Mapping:**
- User answers via voice
- AI transcribes and extracts keywords
- Score generated based on keyword presence
- Keywords tracked: ✅ mentioned / ❌ missing

**2. Auto-Generated Notes:**
- AI synthesizes notes from user's answers across all sessions
- "Based on your answers, here's what you know about this concept..."
- Highlights gaps (keywords never mentioned)

**3. Related Articles:**
- AI layer suggests relevant articles/resources per concept
- "Want to learn more about this? Read these articles..."

**4. Progress Graphs:**
- Line chart showing accuracy over time
- Session frequency heatmap

---

### 3️⃣ **CONTENT DUMP** — Not a Page, a Feature

**Location:** Lives inside Knowledge Base as left sidebar  
**Purpose:** Tag-based filtering of concepts

#### Why Not a Separate Page?
1. **Redundancy:** Content Dump currently duplicates Knowledge Base functionality
2. **User Mental Model:** Users think in concepts, not "dumps of content"
3. **Efficiency:** Filtering is more powerful when embedded in the main view

#### What Happens to Current `/content-dump` Route?
**Option A (Recommended):** Redirect to `/knowledge-base`
```typescript
// app/content-dump/page.tsx
import { redirect } from 'next/navigation'
export default function ContentDumpPage() {
  redirect('/knowledge-base')
}
```

**Option B:** Keep as legacy route but show same content as Knowledge Base
```typescript
// Share the same component
import KnowledgeBasePage from '../knowledge-base/page'
export default KnowledgeBasePage
```

---

## 🗺️ Revised Navigation Structure

### Sidebar:
```
┌─────────────────────┐
│ 🏠 Home             │ → `/`
│ 📊 Cockpit          │ → `/cockpit` (active topics)
│ 🧠 Knowledge Base   │ → `/knowledge-base` (all concepts)
│ 🎓 Classroom  Soon  │ → `/classroom` (disabled)
├─────────────────────┤
│ 🌓 Theme            │
│ 🚪 Logout           │
└─────────────────────┘
```

**Removed:** Content Dump as a separate nav item

---

## 📐 Information Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER MENTAL MODEL                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  "What am I learning overall?"                          │
│  └── COCKPIT (4 topics, high-level stats)              │
│                                                          │
│  "How well do I know each concept?"                     │
│  └── KNOWLEDGE BASE (47 concepts, deep analytics)      │
│                                                          │
│  "What did I learn today?"                              │
│  └── HOME (add new topic / take quiz)                  │
│                                                          │
│  "What should I review?"                                │
│  └── COCKPIT → Priority Review                         │
│                                                          │
│  "How's my Python going?"                               │
│  └── KNOWLEDGE BASE → Filter by Python                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System Consistency

### Color Coding (Memory Score):
- **🔴 Weak (<40%):** Red gradient, urgent indicator
- **🟡 Average (40-70%):** Yellow/amber gradient, caution
- **🟢 Strong (>70%):** Green gradient, positive reinforcement

### Card Hierarchy:
1. **Cockpit → Topic Cards:**
   - Larger, prominent
   - Shows aggregate concept count
   - CTA: "Continue Learning"

2. **Knowledge Base → Concept Cards:**
   - Medium size, scannable
   - Shows individual concept stats
   - CTA: "View Sessions" / "Quiz Again"

### Typography:
- **Page Titles:** text-3xl font-bold
- **Card Titles:** text-xl font-semibold
- **Stats:** text-2xl font-bold (numbers), text-sm text-muted (labels)
- **Body:** text-sm

---

## 🚀 Implementation Checklist

### Phase 1: Core Restructure
- [ ] Create `/knowledge-base` route
- [ ] Build concept card component
- [ ] Build filter sidebar (tags, sort)
- [ ] Implement concept search
- [ ] Migrate Content Dump functionality into Knowledge Base sidebar
- [ ] Update Cockpit to be topic-only (remove Knowledge Base panel)

### Phase 2: Detail Views
- [ ] Build concept detail modal
- [ ] Show quiz session history per concept
- [ ] Build session timeline view
- [ ] Add "Quiz Again" functionality (filter quiz by concept)

### Phase 3: Polish
- [ ] Add loading states
- [ ] Add empty states ("No concepts yet")
- [ ] Add animations (card hover, modal transitions)
- [ ] Responsive design for mobile

### Phase 4: Future Enhancements (Post-MVP)
- [ ] Voice answer input
- [ ] Keyword extraction and tracking
- [ ] Auto-generated notes from answers
- [ ] AI-suggested articles per concept
- [ ] Progress graphs (accuracy over time)
- [ ] Heatmap of study patterns

---

## 🔄 User Flows Updated

### Flow 1: Check Overall Progress
```
Login → Cockpit → See 4 topics with memory scores
                → See Priority Review list
                → Click "Review" on weak topic
                → Take quiz
                → Return to Cockpit
```

### Flow 2: Deep Dive into Concepts
```
Login → Knowledge Base → Browse all 47 concepts
                       → Filter by "Coding" tag
                       → See 15 coding concepts
                       → Click "View Sessions" on weak concept
                       → See quiz history
                       → Click "Quiz Again"
                       → Take targeted quiz
```

### Flow 3: Tag-Based Discovery
```
Knowledge Base → Click "Science" filter
               → See 8 science concepts
               → Sort by "Weak First"
               → Identify struggling concepts
               → Click "Quiz Again" on weakest
               → Focus study session
```

### Flow 4: Search for Specific Concept
```
Knowledge Base → Type "variables" in search
               → See "Variables and Data Types" concept
               → Click to expand
               → View detailed stats
               → Quiz if needed
```

---

## 📊 Data Requirements

### New Fields Needed:

**Concept:**
```typescript
interface Concept {
  id: string
  text: string
  topicId: string // Parent topic
  status: 'strong' | 'average' | 'weak'
  
  // Analytics
  timesReviewed: number // Count of quiz sessions
  accuracy: number // Overall accuracy %
  lastQuizDate: Date
  
  // Future
  keywords: string[] // For keyword tracking
  mentionedKeywords: string[] // Keywords found in answers
  notes?: string // AI-generated summary
  relatedArticles?: Article[]
}
```

**QuizSession (per concept):**
```typescript
interface QuizSession {
  id: string
  conceptId: string
  topicId: string
  sessionDate: Date
  
  questions: {
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    keywords?: string[] // Future: extracted keywords
  }[]
  
  score: number
  accuracy: number
}
```

---

## 🎯 Success Metrics

After implementing this structure, measure:

1. **Engagement:**
   - % of users who visit Knowledge Base vs Cockpit
   - Time spent in Knowledge Base
   - Filter usage frequency

2. **Learning Outcomes:**
   - Concept accuracy improvement over time
   - Weak concept → strong concept conversion rate
   - Session frequency per concept

3. **UX:**
   - Search usage rate
   - Tag filter usage rate
   - Concept detail modal open rate

---

## 💡 Key Takeaways

### What Changed:
1. **Cockpit:** Simplified to topic-level overview only
2. **Knowledge Base:** New page for concept-deep-dive
3. **Content Dump:** Absorbed into Knowledge Base as filtering feature

### Why This Works:
1. **Mental Model Alignment:** Topics are few, concepts are many
2. **Progressive Disclosure:** High-level → detailed, as needed
3. **Reduced Redundancy:** One place for concept analytics
4. **Scalability:** Filters/search handle growth better than separate pages

### The Subtle Reinforcement:
By making concepts more visible and accessible than topics, users will:
- Think in terms of concepts naturally
- Focus on concept mastery
- Understand topics as containers, not the core unit
- Develop a habit of concept-level self-assessment

This unconsciously trains better learning behavior. 🧠

---

## 🎬 Next Steps

1. Review this document with stakeholders
2. Create high-fidelity mockups in Figma (optional)
3. Build `/knowledge-base` route first
4. Migrate existing Content Dump components
5. Update Cockpit to remove Knowledge Base panel
6. Test with real user data
7. Iterate based on usage patterns

---

**End of Document**

Questions? Ambiguities? Refer back to the Master Context Document's principle:
> "Use common sense. Choose the simpler path. Make it work, then make it better."

Let's build the second brain students deserve. 🚀