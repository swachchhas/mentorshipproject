// lib/ai/prompts/concept-prompts.ts
// Refined prompt templates for AI concept generation

export function buildConceptPrompt(topic: string, level: 'beginner' | 'intermediate' | 'expert'): string {
    const levelGuidelines = {
        beginner: {
            description: 'foundational concepts a complete beginner must learn first',
            examples: 'basic syntax, core principles, fundamental operations',
            complexity: 'simple, clear, no prerequisites required',
        },
        intermediate: {
            description: 'practical concepts for someone who knows the basics',
            examples: 'common patterns, real-world applications, problem-solving techniques',
            complexity: 'assumes foundational knowledge, introduces complexity',
        },
        expert: {
            description: 'advanced concepts for experienced practitioners',
            examples: 'optimization, architecture, edge cases, advanced patterns',
            complexity: 'deep technical knowledge, nuanced understanding',
        },
    };

    const guide = levelGuidelines[level];

    return `You are an educational AI creating a learning curriculum. Generate exactly 8 ${level}-level concepts for "${topic}".

LEVEL GUIDELINES FOR ${level.toUpperCase()}:
- Target audience: ${guide.description}
- Example concepts: ${guide.examples}
- Complexity: ${guide.complexity}

CONCEPT REQUIREMENTS:
1. Each concept must be 2-5 words (concise and specific)
2. Use actionable language (e.g., "Using variables" not "Variables")
3. Progress from fundamental to advanced within this level
4. Be specific to "${topic}" (not generic learning concepts)
5. Each concept should be testable with quiz questions

EXAMPLE - Python at beginner level:
["Variables and data types", "Basic operators", "Conditional statements", "While and for loops", "Functions basics", "Lists and tuples", "String manipulation", "File input/output"]

EXAMPLE - React at intermediate level:
["Component lifecycle methods", "State management patterns", "Props and prop drilling", "Hooks fundamentals", "Context API usage", "Side effects with useEffect", "Custom hooks creation", "Performance optimization basics"]

EXAMPLE - Machine Learning at expert level:
["Gradient descent optimization", "Regularization techniques", "Neural network architectures", "Hyperparameter tuning strategies", "Model evaluation metrics", "Cross-validation methods", "Feature engineering approaches", "Ensemble learning methods"]

Now generate 8 concepts for "${topic}" at ${level} level.

CRITICAL: Respond with ONLY a valid JSON array of 8 strings. No explanation, no markdown, no code blocks.
Format: ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5", "Concept 6", "Concept 7", "Concept 8"]

Generate now:`;
}

// Enhanced fallback with topic-specific concepts
export function getFallbackConcepts(topic: string, level: 'beginner' | 'intermediate' | 'expert'): string[] {
    // Topic-specific concepts (most common programming topics)
    const topicSpecificConcepts: Record<string, Record<string, string[]>> = {
        python: {
            beginner: ['Variables and data types', 'Basic operators', 'Conditional statements', 'Loops (for/while)', 'Functions basics', 'Lists and tuples', 'String manipulation', 'File handling'],
            intermediate: ['List comprehensions', 'Lambda functions', 'Error handling', 'Modules and packages', 'Object-oriented basics', 'File I/O operations', 'Regular expressions', 'Decorators introduction'],
            expert: ['Metaclasses', 'Generators and iterators', 'Context managers', 'Async/await patterns', 'Memory optimization', 'Type hints and mypy', 'Performance profiling', 'C extensions'],
        },
        javascript: {
            beginner: ['Variables (let/const/var)', 'Data types', 'Functions basics', 'Arrays fundamentals', 'Objects basics', 'DOM manipulation', 'Event handling', 'Conditionals and loops'],
            intermediate: ['Arrow functions', 'Promises basics', 'Async/await', 'Array methods (map/filter)', 'Object destructuring', 'ES6 features', 'Closures', 'This keyword'],
            expert: ['Event loop mechanics', 'Prototypal inheritance', 'Memory management', 'Performance optimization', 'Design patterns', 'Advanced closures', 'Proxy and Reflect', 'Web Workers'],
        },
        react: {
            beginner: ['Components basics', 'JSX syntax', 'Props usage', 'State management', 'Event handling', 'Conditional rendering', 'Lists and keys', 'Forms basics'],
            intermediate: ['Hooks (useState/useEffect)', 'Component lifecycle', 'Context API', 'Custom hooks', 'Props drilling solutions', 'Performance optimization', 'Error boundaries', 'Refs usage'],
            expert: ['Advanced hooks patterns', 'Render optimization', 'Code splitting', 'Server components', 'Suspense and lazy loading', 'Advanced state management', 'Testing strategies', 'Architecture patterns'],
        },
        // Add more topics as needed
    };

    // Check if we have topic-specific concepts
    const topicKey = topic.toLowerCase().trim();
    if (topicSpecificConcepts[topicKey]) {
        return topicSpecificConcepts[topicKey][level];
    }

    // Generic fallback if topic not found
    const genericConcepts = {
        beginner: [
            `${topic} fundamentals`,
            `Basic ${topic} syntax`,
            `Core ${topic} concepts`,
            `Essential ${topic} operations`,
            `Getting started with ${topic}`,
            `Basic problem solving`,
            `Common ${topic} patterns`,
            `Practical ${topic} examples`,
        ],
        intermediate: [
            `Advanced ${topic} concepts`,
            `${topic} best practices`,
            `Real-world ${topic} applications`,
            `Problem-solving with ${topic}`,
            `${topic} design patterns`,
            `Common ${topic} pitfalls`,
            `Debugging ${topic} code`,
            `Optimizing ${topic} code`,
        ],
        expert: [
            `${topic} architecture`,
            `Advanced ${topic} patterns`,
            `Performance optimization`,
            `${topic} system design`,
            `Edge cases in ${topic}`,
            `Expert ${topic} techniques`,
            `${topic} internals`,
            `Production-ready ${topic}`,
        ],
    };

    return genericConcepts[level];
}

// Validate AI response is proper JSON array
export function validateConceptResponse(response: string): string[] | null {
    try {
        // Remove potential markdown code blocks
        let cleaned = response.trim();
        cleaned = cleaned.replace(/^```json\s*/i, '');
        cleaned = cleaned.replace(/^```\s*/i, '');
        cleaned = cleaned.replace(/\s*```$/i, '');
        cleaned = cleaned.trim();

        // Parse JSON
        const parsed = JSON.parse(cleaned);

        // Validate it's an array of strings with exactly 8 items
        if (!Array.isArray(parsed)) {
            console.error('Response is not an array');
            return null;
        }

        if (parsed.length !== 8) {
            console.error(`Expected 8 concepts, got ${parsed.length}`);
            return null;
        }

        if (!parsed.every(item => typeof item === 'string' && item.length > 0)) {
            console.error('Not all items are valid strings');
            return null;
        }

        // Validate concept length (2-10 words)
        const validConcepts = parsed.filter(concept => {
            const wordCount = concept.trim().split(/\s+/).length;
            return wordCount >= 2 && wordCount <= 10;
        });

        if (validConcepts.length < 6) {
            console.error('Too many concepts are invalid length');
            return null;
        }

        return parsed;
    } catch (error) {
        console.error('Failed to parse concept response:', error);
        return null;
    }
}