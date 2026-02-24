import { Topic, QuizResult, Concept } from '@/types';

// Initial mock data to seed the app if empty
const INITIAL_TOPICS: Topic[] = [
    {
        id: 'topic-1',
        name: 'Photosynthesis',
        concepts: [
            { id: 'c-1', text: 'Light-dependent reactions', status: 'strong' },
            { id: 'c-2', text: 'Calvin cycle', status: 'weak' },
            { id: 'c-3', text: 'Chloroplast structure', status: 'neutral' },
        ],
        memoryScore: 65,
        lastPracticed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        nextReviewDate: new Date(Date.now() - 1000 * 60 * 60 * 2), // Due now
        totalAttempts: 3,
        level: 'intermediate'
    },
];

const STORAGE_KEY = 'learning-retention-mvp-data';

export const storage = {
    // Helper to save all topics
    _saveTopics: (topics: Topic[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
        }
    },

    getTopics: (): Topic[] => {
        if (typeof window === 'undefined') return INITIAL_TOPICS;
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TOPICS));
            return INITIAL_TOPICS;
        }
        // Need to parse dates back from strings
        return JSON.parse(data, (key, value) => {
            if (key === 'lastPracticed' || key === 'nextReviewDate') return new Date(value);
            return value;
        });
    },

    saveTopic: (topic: Topic) => {
        const topics = storage.getTopics();
        const existingIndex = topics.findIndex((t) => t.id === topic.id);

        if (existingIndex >= 0) {
            topics[existingIndex] = topic;
        } else {
            topics.push(topic);
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
        }
    },

    // Create a new topic from just a name
    createTopic: (name: string, level: 'beginner' | 'intermediate' | 'expert' = 'beginner'): Topic => {
        // Concepts are set by the caller after AI generation
        const newTopic: Topic = {
            id: crypto.randomUUID(),
            name,
            concepts: [],
            memoryScore: 0,
            lastPracticed: new Date(),
            nextReviewDate: new Date(), // Due immediately
            totalAttempts: 0,
            level
        };

        storage.saveTopic(newTopic);
        return newTopic;
    },

    updateTopicAfterQuiz: (topicId: string, result: QuizResult) => {
        const topics = storage.getTopics();
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;

        console.log('Before update:', {
            oldMemoryScore: topic.memoryScore,
            totalAttempts: topic.totalAttempts,
            newQuizScore: result.score
        });

        // Simple scoring logic: 
        // New Score = (Old Score * attempts + current score) / (attempts + 1)
        // Or just weighted average. Let's keep it simple as per Master Prompt.
        const newMemoryScore = Math.round((topic.memoryScore * topic.totalAttempts + result.score) / (topic.totalAttempts + 1));
        topic.memoryScore = newMemoryScore;
        topic.totalAttempts += 1;
        topic.lastPracticed = new Date();

        console.log('After update:', {
            newMemoryScore: topic.memoryScore,
            totalAttempts: topic.totalAttempts
        });

        // Spaced repetition logic (Naive)
        // If score > 80, 3 days. > 60, 1 day. Else, 4 hours.
        const hoursToAdd = result.score > 80 ? 72 : result.score > 60 ? 24 : 4;
        topic.nextReviewDate = new Date(Date.now() + 1000 * 60 * 60 * hoursToAdd);

        // Update concepts
        topic.concepts = topic.concepts.map(c => {
            if (result.weakConcepts.includes(c.id)) return { ...c, status: 'weak' };
            return { ...c, status: 'strong' }; // Assume others are strong if not marked weak
        });

        storage.saveTopic(topic);
        console.log('Topic saved successfully');
    },

    deleteTopic: (id: string) => {
        const topics = storage.getTopics();
        const filtered = topics.filter(t => t.id !== id);
        storage._saveTopics(filtered);
    },

    updateTopic: function (updatedTopic: Topic): void {
        const topics = this.getTopics();
        const index = topics.findIndex(t => t.id === updatedTopic.id);
        if (index !== -1) {
            topics[index] = updatedTopic;
            this._saveTopics(topics);
        }
    },

    updateConceptFamiliarity: (topicId: string, conceptId: string, familiar: boolean) => {
        const topics = storage.getTopics();
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;

        topic.concepts = topic.concepts.map(c =>
            c.id === conceptId ? { ...c, familiar } : c
        );

        storage.saveTopic(topic);
    },

    addCustomConcept: (topicId: string, conceptText: string) => {
        const topics = storage.getTopics();
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;

        const newConcept: Concept = {
            id: crypto.randomUUID(),
            text: conceptText,
            status: 'neutral',
            familiar: false
        };

        topic.concepts.push(newConcept);
        storage.saveTopic(topic);
        return newConcept;
    },

    deleteConcept: (topicId: string, conceptId: string) => {
        const topics = storage.getTopics();
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;

        topic.concepts = topic.concepts.filter(c => c.id !== conceptId);
        storage.saveTopic(topic);
    }
};
