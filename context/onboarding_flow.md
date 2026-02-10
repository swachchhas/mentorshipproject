# Antigravity Onboarding & Topic Selection Flow

This document defines the **exact questions, options, micro-interactions, and expected behaviors** for:

1. **User Onboarding** (first-time user, happens once)  
2. **Topic Selection** (repeated flow, happens each time the user adds a new concept)

All flows are **full-screen**, distraction-free, and optionally have a **half-visible "X" button** to skip/exit to the home screen.  

> Core principle: *Antigravity helps users remember what they learn, not teach new things.*

---

## UI Guidelines (Global)

- Full-screen flow; no sidebars, notifications, or other distractions.  
- Half-visible “X” button in top-right corner allows users to exit to **home screen**.  
- Micro-interactions should be **lightweight, non-blocking, and playful**.  
- After **User Onboarding**, redirect to the **Home Screen** with updated messaging:  
> From: “What do you want to learn?”  
> To: “What did you learn today?”  

---

## 1. User Onboarding (First-Time User)

### Purpose
- Introduce the system and its philosophy  
- Build trust and set expectations  
- Configure global learning behavior  

---

### Step 1: Welcome / Positioning

**Message**  
> This platform doesn’t teach you new things.  
> It helps you remember what you’ve already learned.

**Supporting Line (Optional)**  
> You bring the learning. We help it stick.

**User Action**  
- Continue

**Micro-Interaction**  
- Fade-in illustration of brain or lightbulb  

---

### Step 2: Motivation

**Question**  
> Why do you want to keep learning right now?

**Options**  
- Career or professional growth  
- Personal interest or curiosity  
- Exam or certification preparation  
- Just for fun  

**Purpose**  
- Understand user intent  
- Shape tone and messaging for future quizzes and reminders  

**Micro-Interaction**  
- After selection:  
> “Nice! This helps us tailor your journey.”  

---

### Step 3: Daily Commitment

**Question**  
> How much time can you realistically commit each day?

**Options**  
- 5 minutes  
- 15 minutes  
- 30 minutes  

**Supporting Line (Optional)**  
> Small, consistent sessions work best.

**Micro-Interaction**  
- After selection:  
> “Wow — that’s **X × 365 = Y minutes a year**!”  
- Continue button appears after message  

**Purpose**  
- Anchor user expectations  
- Set daily rhythm  

---

### Step 4: How the System Works

**Message**  
> Here’s how Antigravity works:

**Key Points**  
- You log what you learn  
- We revisit it at the right time  
- We quiz you briefly to make it stick

**Supporting Line (Optional)**  
> No pressure. No noise. Just steady progress.

**User Action**  
- Continue  

**Micro-Interaction**  
- Small animated timeline illustrating revisit points  

---

### Step 5: Completion → First Action

**Message**  
> You’re all set.

**Primary CTA**  
- Add your first concept

**Behavior**  
- Mark **User Onboarding** as complete  
- Redirect to **Home Screen**  
- Update home screen prompt to:  
> “What did you learn today?”  

**Micro-Interaction**  
- Gentle confetti or pulse effect on CTA button  

---

## 2. Topic Selection (Repeated Flow)

### Purpose
- Capture newly learned concepts  
- Understand current knowledge/confidence  
- Prepare for spaced repetition and quizzes  

---

### Step 1: Capture Concept

**Question**  
> What did you just learn?

**Input**  
- Free-text input  

**Placeholder Examples**  
- “Closures in JavaScript”  
- “How interest rates affect inflation”  
- “Photosynthesis”  
- “A concept from today’s meeting”

**Purpose**  
- Capture learning without friction  

**Micro-Interaction**  
- After typing, small tip:  
> “Short phrases work best. You can expand later.”  

---

### Step 2: Confidence Level

**Question**  
> How confident do you feel about this right now?

**Options**  
- I just heard about it  
- I somewhat understand it  
- I can explain it  
- I know it well  

**Purpose**  
- Assess depth of understanding  
- Influence revisit schedule and quiz difficulty  

**Micro-Interaction**  
- After selection:  
> “Got it — this helps us quiz you at just the right level.”  

---

### Step 3: Source Context (Optional)

**Question**  
> Where did this come from?

**Options**  
- Book  
- Course  
- Video  
- Work or real-world experience  
- Conversation  

**Note**  
- Skippable / optional  

**Purpose**  
- Capture context for analytics and insights  

**Micro-Interaction**  
- Optional emoji icons for each source for visual appeal  

---

### Step 4: Confirmation

**Message**  
> Got it.  
> We’ll revisit this in a few days.

**Supporting Visual (Optional)**  
- Simple timeline: Day 3 → Day 7 → Day 21  

**Purpose**  
- Reinforce system intelligence and trust  

**Micro-Interaction**  
- Timeline dots animate sequentially to show future revisit points  

---

### Step 5: Exit

**Actions**  
- Back to dashboard  
- Add another concept  

**Purpose**  
- Clean exit  
- Encourage repetition without noise  

**Micro-Interaction**  
- Small “+” animation on **Add another concept** button  

---

## Notes & Recommendations

1. **Full-Screen Only**: Both onboarding flows should occupy the entire screen.  
2. **Half-Visible Exit**: “X” button allows skipping any step; always redirects to **Home Screen**.  
3. **Home Screen Update**: After first onboarding, update prompt to:  
> “What did you learn today?”  
4. **Micro-Interactions**: Subtle animations, calculated facts, friendly messages. Non-blocking and optional.  
5. **Flow Logic**:  
   - User Onboarding → Home Screen → Topic Selection → Spaced repetition/quizzes.  
   - Each new concept triggers **Topic Selection** flow.  

---

### Summary

- **User Onboarding**: One-time setup for trust, expectations, and daily rhythm  
- **Topic Selection**: Repeated, frictionless capture of learning, confidence, and context  
- **Micro-Interactions**: Light, engaging, builds trust and motivation  
- **UI Guidelines**: Full-screen, distraction-free, exit button available  

> This structure ensures clarity, calmness, and encourages repeated engagement while keeping cognitive load minimal.
