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
  // Try to find the topic in our pre-defined JSON data
  const entry = Object.values(quizData).find(
    (t) => t.displayName.toLowerCase() === topicName.toLowerCase()
  );

  let questions: QuizQuestion[] = [];
  if (entry) {
    questions = entry.questions;
    if (conceptId) {
      questions = questions.filter((q) => q.conceptId === conceptId);
    }
  }

  // If we don't have enough JSON questions, supplement with mock questions
  // We'll calculate how many we need to reach at least 6 total
  const needCount = 6 - questions.length;

  if (needCount > 0) {
    const mockQuestions = generateMockQuestions(concepts, conceptId, needCount);
    questions = [...questions, ...mockQuestions];
  }

  // If this is a Topic Quiz (no conceptId provided), we should roughly weight 
  // the questions to focus more on weaker concepts
  if (!conceptId && concepts.length > 0) {
    return weightQuestionsByConceptWeakness(questions, concepts);
  }

  return questions;
}

/**
 * Reorders and selects questions to prioritize weaker concepts
 */
function weightQuestionsByConceptWeakness(questions: QuizQuestion[], concepts: Concept[]): QuizQuestion[] {
  // Basic implementation: Prioritize concepts with lower retention scores or 'weak' status
  const conceptScores = new Map<string, number>();

  concepts.forEach(c => {
    // default to 100 if strong, 50 if neutral/unknown, 0 if weak
    let score = c.retentionScore;
    if (score === undefined) {
      score = c.status === 'weak' ? 0 : c.status === 'strong' ? 100 : 50;
    }
    conceptScores.set(c.id, score);
  });

  // Sort questions: ones belonging to weaker concepts come first
  // Within the same concept, randomize slightly to keep it varied
  const sortedQuestions = [...questions].sort((a, b) => {
    const scoreA = conceptScores.get(a.conceptId) ?? 50;
    const scoreB = conceptScores.get(b.conceptId) ?? 50;

    if (scoreA !== scoreB) {
      return scoreA - scoreB; // Lower score comes first
    }

    // Randomize tie-breakers
    return Math.random() - 0.5;
  });

  // Return the top N questions, e.g. up to 10 for a session
  return sortedQuestions.slice(0, 10);
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
