// lib/ai/prompts/quiz-prompts.ts
// Refined prompt templates for AI quiz question generation (MCQ-only)

export function buildQuizPrompt(
    topic: string,
    concept: string,
    level: 'beginner' | 'intermediate' | 'expert',
    count: number = 10
): string {
    const levelGuidelines = {
        beginner: {
            focus: 'Test fundamental understanding and basic recall',
            questionStyle: 'Direct questions with clear, unambiguous answers',
            vocabulary: 'Simple terms - explain technical concepts when using them',
            example: '"What is X?" "Which of these does Y?" "What happens when Z?"',
            avoidPatterns: 'Avoid trick questions, double negatives, or "all/none of the above"',
        },
        intermediate: {
            focus: 'Test practical application and conceptual relationships',
            questionStyle: 'Scenario-based questions requiring analysis',
            vocabulary: 'Standard technical terminology - assume basic knowledge',
            example: '"How would you X?" "What\'s the difference between Y and Z?" "When should you use X?"',
            avoidPatterns: 'Avoid purely theoretical questions - focus on real-world usage',
        },
        expert: {
            focus: 'Test deep understanding, edge cases, and optimization strategies',
            questionStyle: 'Complex scenarios with trade-offs and nuanced decisions',
            vocabulary: 'Advanced terminology - expect deep technical knowledge',
            example: '"What are the performance implications of X?" "How would you optimize Y?" "What\'s the best approach for Z?"',
            avoidPatterns: 'Avoid trivia - focus on architectural decisions and production concerns',
        },
    };

    const guide = levelGuidelines[level];

    return `You are an expert programming educator creating multiple-choice quiz questions to test "${concept}" in ${topic} at ${level} level.

LEVEL: ${level.toUpperCase()}
Focus: ${guide.focus}
Style: ${guide.questionStyle}
Vocabulary: ${guide.vocabulary}
Examples: ${guide.example}
Avoid: ${guide.avoidPatterns}

GENERATE EXACTLY ${count} MCQ QUESTIONS

---
REQUIRED FORMAT (each question as JSON object):

{
  "type": "mcq",
  "question": "Clear, specific question text",
  "options": [
    "Option A - plausible answer",
    "Option B - plausible answer",
    "Option C - plausible answer",
    "Option D - plausible answer"
  ],
  "correctAnswer": "Exact text of the correct option from above",
  "explanation": "Clear explanation of WHY this is correct and why others are wrong",
  "keywords": ["term1", "term2", "term3"]
}

---
EXAMPLE 1 - Python variables (beginner):

{
  "type": "mcq",
  "question": "What is the data type of x after executing: x = 5",
  "options": [
    "String",
    "Float",
    "Integer",
    "Boolean"
  ],
  "correctAnswer": "Integer",
  "explanation": "In Python, assigning a whole number like 5 creates an integer (int) type variable. You can verify this using type(x) which returns <class 'int'>. It's not a float because there's no decimal point.",
  "keywords": ["variable", "integer", "data type", "assignment", "int"]
}

---
EXAMPLE 2 - JavaScript promises (intermediate):

{
  "type": "mcq",
  "question": "What happens if you don't add a .catch() to a Promise chain?",
  "options": [
    "The promise will never resolve",
    "Unhandled rejection errors may crash the application",
    "The promise automatically retries",
    "JavaScript converts it to a synchronous call"
  ],
  "correctAnswer": "Unhandled rejection errors may crash the application",
  "explanation": "Without .catch(), rejected promises create unhandled promise rejections which can crash Node.js applications or cause silent failures in browsers. Always handle promise errors to prevent unexpected behavior.",
  "keywords": ["promise", "catch", "error handling", "rejection", "unhandled"]
}

---
EXAMPLE 3 - React optimization (expert):

{
  "type": "mcq",
  "question": "Which optimization technique prevents unnecessary re-renders when passing callbacks to child components?",
  "options": [
    "Using React.memo() on the parent component",
    "Using useCallback() to memoize the callback function",
    "Using useState() instead of props",
    "Using inline arrow functions in JSX"
  ],
  "correctAnswer": "Using useCallback() to memoize the callback function",
  "explanation": "useCallback() returns a memoized version of the callback that only changes if dependencies change. This prevents child components from re-rendering due to new function references. React.memo() helps but doesn't solve the callback reference issue. Inline arrow functions create new references on every render.",
  "keywords": ["useCallback", "memoization", "re-render", "optimization", "callback"]
}

---
CRITICAL MCQ REQUIREMENTS:

✓ EXACTLY 4 options per question
✓ correctAnswer MUST be word-for-word match with one option
✓ All 4 options must be plausible (eliminate obviously wrong answers)
✓ Distractors should represent REAL misconceptions students have
✓ NO "All of the above" or "None of the above" options
✓ NO "Both A and B" or "Either A or C" options
✓ Question must test "${concept}" specifically, not other concepts
✓ Options should be similar length (avoid pattern where longest = correct)
✓ Explanation must teach WHY (not just restate correctness)
✓ Include 3-5 relevant keywords students should know

DISTRACTOR QUALITY:
- Represent common student mistakes or misconceptions
- Be technically plausible enough to seem correct at first glance
- Test understanding, not guessing ability
- Good distractor example: "Using var instead of let" (tests const/let/var knowledge)
- Bad distractor example: "Using banana() function" (obviously nonsense)

QUESTION QUALITY:
- Be specific and unambiguous (avoid vague terms)
- Focus on practical knowledge, not trivia
- Test understanding, not memorization of syntax
- Code examples should be realistic and follow best practices
- Avoid questions with multiple correct interpretations

---
OUTPUT INSTRUCTIONS:

Respond with ONLY a valid JSON array containing ${count} question objects.
NO markdown code blocks, NO explanations, NO extra text.

Format: [question_object_1, question_object_2, ..., question_object_${count}]

Generate ${count} curriculum-aligned MCQ questions about "${concept}" in ${topic} at ${level} level:`;
}

// Validate quiz response structure
export function validateQuizResponse(response: string): any[] | null {
    try {
        // Clean potential markdown code blocks
        let cleaned = response.trim();
        cleaned = cleaned.replace(/^```json\s*/i, '');
        cleaned = cleaned.replace(/^```\s*/i, '');
        cleaned = cleaned.replace(/\s*```$/i, '');
        cleaned = cleaned.trim();

        // Parse JSON
        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed)) {
            console.error('Response is not an array');
            return null;
        }

        if (parsed.length === 0) {
            console.error('Empty array returned');
            return null;
        }

        // Validate each question
        const validQuestions = parsed.filter(q => {
            // Check required fields exist
            if (!q.type || !q.question || !q.correctAnswer || !q.explanation || !q.keywords) {
                console.warn('Question missing required fields:', q);
                return false;
            }

            // Must be MCQ type
            if (q.type !== 'mcq') {
                console.warn('Question is not MCQ type:', q.type);
                return false;
            }

            // Validate options array
            if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
                console.warn('Question does not have exactly 4 options:', q.options?.length);
                return false;
            }

            // Check if correctAnswer matches one option exactly
            const answerMatches = q.options.some((opt: string) => 
                opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
            );
            
            if (!answerMatches) {
                console.warn('Correct answer does not match any option:', q.correctAnswer);
                return false;
            }

            // Validate keywords array
            if (!Array.isArray(q.keywords) || q.keywords.length < 3 || q.keywords.length > 7) {
                console.warn('Keywords must be 3-7 items:', q.keywords?.length);
                return false;
            }

            // Validate explanation length
            if (q.explanation.length < 30) {
                console.warn('Explanation too short:', q.explanation.length);
                return false;
            }

            // Validate question length (not too short or too long)
            if (q.question.length < 10 || q.question.length > 300) {
                console.warn('Question length invalid:', q.question.length);
                return false;
            }

            return true;
        });

        if (validQuestions.length === 0) {
            console.error('No valid questions found in response');
            return null;
        }

        // Log if we filtered out some questions
        if (validQuestions.length < parsed.length) {
            console.warn(`Filtered ${parsed.length - validQuestions.length} invalid questions`);
        }

        return validQuestions;
    } catch (error) {
        console.error('Failed to parse quiz response:', error);
        return null;
    }
}

// Parse and clean individual question
export function cleanQuestion(question: any): any {
    return {
        type: 'mcq',
        question: question.question.trim(),
        options: question.options.map((opt: string) => opt.trim()),
        correctAnswer: question.correctAnswer.trim(),
        explanation: question.explanation.trim(),
        keywords: question.keywords.map((kw: string) => kw.trim().toLowerCase()),
    };
}

// Quality score calculator for generated questions
export function calculateQuestionQuality(question: any): number {
    let score = 100;

    // Penalize if options are very different lengths (suggests answer giveaway)
    const optionLengths = question.options.map((opt: string) => opt.length);
    const avgLength = optionLengths.reduce((a: number, b: number) => a + b, 0) / optionLengths.length;
    const lengthVariance = optionLengths.reduce((sum: number, len: number) => 
        sum + Math.abs(len - avgLength), 0
    ) / optionLengths.length;
    
    if (lengthVariance > 20) score -= 10; // High length variance = potential giveaway

    // Reward longer, more detailed explanations
    if (question.explanation.length > 100) score += 5;
    if (question.explanation.length < 50) score -= 10;

    // Check for problematic patterns in options
    const hasAllOfAbove = question.options.some((opt: string) => 
        opt.toLowerCase().includes('all of the above') || 
        opt.toLowerCase().includes('all of these')
    );
    const hasNoneOfAbove = question.options.some((opt: string) => 
        opt.toLowerCase().includes('none of the above') || 
        opt.toLowerCase().includes('none of these')
    );
    
    if (hasAllOfAbove || hasNoneOfAbove) score -= 20;

    // Check if question has code in it (good for programming)
    const hasCode = question.question.includes('(') || 
                    question.question.includes('{') || 
                    question.question.includes('`');
    if (hasCode) score += 5;

    // Penalize very short questions (likely too vague)
    if (question.question.length < 30) score -= 15;

    // Reward good keyword coverage (4-6 is ideal)
    if (question.keywords.length >= 4 && question.keywords.length <= 6) {
        score += 5;
    }

    return Math.max(0, Math.min(100, score));
}