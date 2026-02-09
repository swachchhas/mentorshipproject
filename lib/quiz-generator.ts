// lib/quiz-generator.ts
import { QuizQuestion, Concept } from "@/types";
import quizDataJson from "./data/quiz-data.json";

type QuizData = Record<string, { displayName: string; questions: QuizQuestion[] }>;

const quizData = quizDataJson as QuizData;

/**
 * Load quiz for a topic
 * - If conceptId is provided → filter questions for that concept
 * - If topic not found → generate mock questions (optionally filtered)
 * - Always ensure at least 5-6 questions per topic
 */
export function loadQuiz(
  topicName: string,
  concepts: Concept[],
  conceptId?: string
): QuizQuestion[] {
  const entry = Object.values(quizData).find(
    (t) => t.displayName.toLowerCase() === topicName.toLowerCase()
  );

  // ---------- JSON-backed questions ----------
  if (entry) {
    let questions = entry.questions;
    // Filter by conceptId if provided
    if (conceptId) {
      questions = questions.filter((q) => q.conceptId === conceptId);
    }

    // If we have enough questions from JSON, return them
    if (questions.length >= 5) {
      return questions;
    }

    // If not enough, supplement with mock questions
    const mockQuestions = generateMockQuestions(concepts, conceptId, 6 - questions.length);
    return [...questions, ...mockQuestions];
  }

  // ---------- Mock fallback ----------
  return generateMockQuestions(concepts, conceptId, 6);
}

/**
 * Generate mock questions for concepts
 * Generates multiple questions per concept with varied types
 */
function generateMockQuestions(
  concepts: Concept[],
  conceptId?: string,
  minQuestions: number = 6
): QuizQuestion[] {
  const filteredConcepts = conceptId
    ? concepts.filter(c => c.id === conceptId)
    : concepts;

  if (filteredConcepts.length === 0) {
    return [];
  }

  const questions: QuizQuestion[] = [];
  const questionsPerConcept = Math.max(2, Math.ceil(minQuestions / filteredConcepts.length));

  filteredConcepts.forEach((concept, conceptIndex) => {
    // Generate varied questions for each concept
    for (let i = 0; i < questionsPerConcept; i++) {
      const questionId = `mock-${conceptIndex}-${i}`;

      if (i % 3 === 0) {
        // MCQ - Basic
        questions.push({
          id: `${questionId}-mcq-basic`,
          conceptId: concept.id,
          level: 'basic',
          type: "mcq",
          question: `What is the main purpose of "${concept.text}"?`,
          options: [
            `To understand ${concept.text} fundamentals`,
            `To confuse developers`,
            `To make code slower`,
            `To replace all other concepts`,
          ],
          correctAnswer: `To understand ${concept.text} fundamentals`,
          explanation: `This tests basic understanding of ${concept.text}`,
        });
      } else if (i % 3 === 1) {
        // MCQ - Advanced
        questions.push({
          id: `${questionId}-mcq-advanced`,
          conceptId: concept.id,
          level: 'advanced',
          type: "mcq",
          question: `When should you use "${concept.text}" in practice?`,
          options: [
            `When it solves a specific problem efficiently`,
            `Always, in every situation`,
            `Never, it's deprecated`,
            `Only on Tuesdays`,
          ],
          correctAnswer: `When it solves a specific problem efficiently`,
          explanation: `This tests practical application of ${concept.text}`,
        });
      } else {
        // Card question
        questions.push({
          id: `${questionId}-card`,
          conceptId: concept.id,
          level: 'basic',
          type: "card",
          question: `Explain "${concept.text}" in your own words.`,
          correctAnswer: `${concept.text} is a fundamental concept that helps in understanding and implementing solutions effectively.`,
          explanation: `This tests your ability to articulate ${concept.text}`,
        });
      }
    }
  });

  // Ensure we have at least minQuestions
  return questions.slice(0, Math.max(minQuestions, questions.length));
}
