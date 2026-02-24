// HuggingFace API client — matches test-hf.js pattern exactly
// Uses router.huggingface.co chat completions endpoint

const API_URL = 'https://router.huggingface.co/v1/chat/completions';
const MODEL = 'meta-llama/Llama-3.1-8B-Instruct:novita';

export interface HFMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface HFRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
}

export interface HFResponse {
    text: string;
    success: boolean;
    error?: string;
}

export async function callHuggingFace({
    prompt,
    maxTokens = 500,
    temperature = 0.7,
}: HFRequest): Promise<HFResponse> {
    const token = process.env.HF_TOKEN;

    if (!token) {
        return {
            text: '',
            success: false,
            error: 'HF_TOKEN not found in environment variables',
        };
    }

    try {
        const messages: HFMessage[] = [
            { role: 'user', content: prompt },
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
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
            const errorText = await response.text();
            console.error('HuggingFace API Error:', errorText);

            if (response.status === 503) {
                return {
                    text: '',
                    success: false,
                    error: 'Model is loading. Please try again in 30 seconds.',
                };
            }

            if (response.status === 401) {
                return {
                    text: '',
                    success: false,
                    error: 'Invalid API token. Check your HF_TOKEN in .env.local',
                };
            }

            return {
                text: '',
                success: false,
                error: `API Error: ${response.status} - ${errorText}`,
            };
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content ?? '';

        if (!text) {
            return {
                text: '',
                success: false,
                error: 'Empty response from API',
            };
        }

        return {
            text,
            success: true,
        };
    } catch (error) {
        console.error('Error calling HuggingFace:', error);
        return {
            text: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// Retry wrapper — same logic as test-hf.js
export async function callWithRetry(
    request: HFRequest,
    maxRetries = 3
): Promise<HFResponse> {
    for (let i = 0; i < maxRetries; i++) {
        const response = await callHuggingFace(request);

        if (response.success) {
            return response;
        }

        // If rate limited or model loading, wait and retry
        if (
            response.error?.includes('503') ||
            response.error?.includes('rate') ||
            response.error?.includes('loading')
        ) {
            const waitTime = Math.pow(2, i) * 1000;
            console.log(`Retrying in ${waitTime}ms... (attempt ${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
        }

        // Other errors, don't retry
        return response;
    }

    return {
        text: '',
        success: false,
        error: 'Max retries exceeded',
    };
}
