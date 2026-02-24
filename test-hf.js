// test-hf.js
// Unified Hugging Face API test — replaces test-hf-api.js, test-ai-route.ts, huggingface-client.ts
// Run with: node test-hf.js

require('dotenv').config({ path: '.env.local' });

const HF_TOKEN = process.env.HF_TOKEN;
const API_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL = 'meta-llama/Llama-3.1-8B-Instruct:novita';

// ─── Core API call (matches test.js pattern) ────────────────────────────────
async function callHF(messages, { maxTokens = 500, temperature = 0.7 } = {}) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            max_tokens: maxTokens,
            temperature,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
}

// ─── Retry wrapper (from huggingface-client.ts logic) ───────────────────────
async function callWithRetry(messages, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await callHF(messages, options);
        } catch (err) {
            const isRetryable =
                err.message.includes('503') ||
                err.message.includes('rate') ||
                err.message.includes('loading');

            if (isRetryable && i < maxRetries - 1) {
                const wait = Math.pow(2, i) * 1000;
                console.log(`  ⏳ Retrying in ${wait / 1000}s... (attempt ${i + 1}/${maxRetries})`);
                await new Promise((r) => setTimeout(r, wait));
            } else {
                throw err;
            }
        }
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────
async function run() {
    console.log('━'.repeat(50));
    console.log('  Hugging Face API Test Suite');
    console.log('━'.repeat(50));

    // 1. Token check
    console.log('\n[1/3] Token check...');
    if (!HF_TOKEN) {
        console.error('❌ HF_TOKEN not found in .env.local');
        process.exit(1);
    }
    console.log('✅ HF_TOKEN loaded');

    // 2. Basic call (same as test.js)
    console.log('\n[2/3] Basic API call — "What is the capital of France?"');
    try {
        const answer = await callHF([
            { role: 'user', content: 'What is the capital of France? Reply in one sentence.' },
        ]);
        console.log('✅ Response:', answer.trim());
    } catch (err) {
        console.error('❌ Basic call failed:', err.message);
        process.exit(1);
    }

    // 3. App-style prompt (what the AI route / huggingface-client was doing)
    console.log('\n[3/3] App-style quiz generation prompt (with retry)...');
    try {
        const quiz = await callWithRetry([
            {
                role: 'system',
                content: 'You are a quiz generator. Reply with JSON only.',
            },
            {
                role: 'user',
                content:
                    'Generate a beginner-level quiz question about Python variables. ' +
                    'Return JSON with keys: question, options (array of 4), correctIndex, explanation.',
            },
        ], { maxTokens: 400, temperature: 0.7 });

        console.log('✅ Quiz response:\n');
        // Pretty-print if valid JSON, otherwise just print raw
        try {
            const parsed = JSON.parse(quiz.trim().replace(/^```json\n?/, '').replace(/\n?```$/, ''));
            console.log(JSON.stringify(parsed, null, 2));
        } catch {
            console.log(quiz.trim());
        }
    } catch (err) {
        console.error('❌ Quiz generation failed:', err.message);
    }

    console.log('\n' + '━'.repeat(50));
    console.log('  All tests done!');
    console.log('━'.repeat(50) + '\n');
}

run();
