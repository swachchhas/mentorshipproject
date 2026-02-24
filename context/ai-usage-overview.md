# AI Usage Overview

This document outlines how and where Artificial Intelligence (LLMs) is currently integrated into the Memora application, and distinctly separates it from features that use algorithmic heuristics (which may currently be labeled as "AI"). 

Mapping these systems explicitly will help you modularize the codebase and prepare for future true AI integrations.

## 1. True AI Integrations (LLM Powered)

Currently, true AI generation relies entirely on the Hugging Face API client (`lib/ai/huggingface-client.ts`) and is scoped to structural generation.

### A. Topic Concept Generation
- **Location:** `app/api/ai/generate-concepts/route.ts`
- **Prompts & Parsers:** `lib/ai/prompts/concept-prompts.ts`, `lib/ai/parsers/concept-parser.ts`
- **What it does:** When you add a new topic, it sends the topic name and difficulty level to the Hugging Face model to automatically break the topic down into 5-10 distinct curriculum concepts.

### B. Quiz Question Generation
- **Location:** `app/api/ai/generate-quiz/route.ts`
- **Prompts & Parsers:** `lib/ai/prompts/quiz-prompts.ts`, `lib/ai/parsers/quiz-parser.ts`, `lib/ai/validators/quiz-validator.ts`
- **What it does:** This is the heaviest AI integration. It takes a topic (and optionally a specific concept) and generates a structured JSON array containing Multiple Choice, Short Answer, and Concept Recall questions, complete with explanations and distractors.

---

## 2. Algorithmic Heuristics (Currently Faking "AI")

These features are highly mathematical algorithms and heuristics. They act intelligently, but **they do not call an AI model**. Knowing this is critical because these are the exact areas where we should build separate, modular AI layers in the future.

### A. "AI Insights" on Knowledge Base Concept Cards
- **Location:** `app/knowledge-base/page.tsx` (Specifically the `getAIInsight` function)
- **What it does:** It looks at your accuracy percentage and review count. If your score is above 80%, it returns a hardcoded string: *"Well-understood. Encountered in X quiz session(s)..."*. If it's below 60%, it returns *"Struggling area..."*.
- **Why modularity is needed here:** Since this is treated as a major feature, we should extract `getAIInsight` into its own service (`lib/ai/insights-generator.ts`). In the future, this service could send your history of *incorrect question answers* to the LLM to provide a true, personalized diagnostic (e.g., *"You consistently confuse React state with props when answering questions about component lifecycles"*).

### B. Spaced Repetition Scheduling
- **Location:** `app/api/ai/generate-schedule/route.ts` and `lib/utils/spaced-repetition.ts`
- **What it does:** Despite being in the `api/ai` folder, this route simply runs a mathematical algorithm (similar to SuperMemo) to calculate days between reviews based on timeframes and study minutes. 
- **Future Integration:** True AI here could analyze a user's calendar alongside their stress levels or detailed concept fatigue to dynamically build an adaptive schedule.

### C. Retention & Memory Scoring
- **Location:** `lib/utils/retention-calculator.ts`
- **What it does:** Uses time-decay formulas to calculate memory scores dropping over time. It is purely math-based.

---

## Roadmap for "Modularizing" AI Insights

Because "AI Insights" is a huge value proposition, here is a suggested modular architecture to upgrade it from heuristics to true AI:

1. **Create an Insight Module:**
   Create a new directory: `lib/ai/insights/`.

2. **Data Aggregation:**
   Build a function that gathers the exact text of questions the user got wrong for a specific concept, their chosen incorrect answers, and how recently they missed them.

3. **Prompt the Model:**
   Send this aggregated data to the Hugging Face client with a system prompt like:
   *"Act as an expert tutor. The student missed the following questions regarding [Concept]. Based on their incorrect answers, what specific fundamental misunderstanding do they have? Provide a 2-sentence actionable insight."*

4. **Caching Layer:**
   Since true AI generation takes time and costs money/limits, store this generated insight in local storage (`insightsStorage.ts`). Only regenerate it when the user takes a *new* quiz on that concept and misses questions again.

By treating the "AI Insight" as an independent service layer, you can keep the Knowledge Base UI fast while generating deep, personalized recommendations in the background.
