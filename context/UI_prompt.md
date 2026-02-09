# Micro-Interactions Design Prompt

You are working inside an existing **Learning Retention Platform (MVP)** built with **Next.js (App Router)**.

IMPORTANT:
- **Colors, typography, and button layouts are already defined using shadcn/ui**
- DO NOT redefine, replace, or suggest new colors, fonts, or button styles
- Only design **micro-interactions and motion behavior**
- Follow existing class names, components, and layout patterns

---

## INTERACTION CONTEXT

- **Element types:**
  - Buttons (primary, secondary, ghost)
  - Form fields (topic input, quiz answers)
  - Cards (topic cards, quiz cards, memory score cards)
  - Icons (status, navigation, feedback)

- **Interaction triggers:**
  - Hover
  - Click / Tap
  - Focus
  - Loading
  - Success
  - Error

- **Brand personality:**
  - Minimal
  - Professional
  - Calm
  - Analytical
  - Trustworthy

- **Performance requirements:**
  - Smooth on low-end devices
  - Low CPU usage
  - No layout shifts
  - Desktop-first, but mobile-safe

---

## INTERACTION REQUIREMENTS

- **Duration:** All animations must be under **300ms**
- **Easing:** Natural motion (ease-out, cubic-bezier-based)
- **Purpose:**
  - Feedback (confirm an action occurred)
  - Guidance (indicate interactivity or focus)
  - Status indication (loading, success, error)
- **Accessibility:**
  - Respect `prefers-reduced-motion`
  - No animation should be the sole indicator of state

---

## TECHNICAL SPECIFICATIONS

- **Implementation:** CSS-first, JS only when necessary
- **Browser support:** Modern browsers only
- **Framework:** React (Next.js App Router)
- **Styling:** Tailwind CSS + shadcn/ui components

---

## SPECIFIC INTERACTIONS NEEDED

1. **Button hover & active feedback**
   - Subtle visual feedback to show clickability
   - No color changes beyond existing shadcn tokens
   - Active state should feel responsive, not bouncy

2. **Form field focus interaction**
   - Clear focus indication for text inputs and quiz answers
   - Should guide user attention without visual noise

3. **Loading indicator**
   - Lightweight loading state for async actions (quiz submission, topic creation)
   - Must not block the entire UI unless necessary

4. **Success / error feedback**
   - Immediate, clear feedback after quiz submission or form action
   - Use motion subtly to reinforce status (not celebration)

5. **Card hover interaction**
   - Topic and quiz cards should indicate interactivity on hover
   - No elevation jumps or dramatic transforms

---

## OUTPUT REQUIREMENTS

For **each interaction**, provide:

1. CSS and/or minimal JavaScript code
2. Required HTML / JSX structure
3. Accessibility considerations
4. Performance optimization notes
5. Usage examples showing different states (default, hover, focus, loading, success, error)

---

## DESIGN INTENT

Animations should:
- Feel **invisible when not noticed**
- Reinforce system confidence
- Reduce user uncertainty
- Never distract from learning or cognition

This is an **MVP for validating learning flow**, not a marketing site.
Prioritize clarity and responsiveness over visual flair.
