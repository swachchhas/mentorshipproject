// Hugging Face API client for Next.js

const HF_API_URL = 'https://api-inference.huggingface.co/models';
const MODEL_ID = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

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
  maxTokens = 800,
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
    const response = await fetch(`${HF_API_URL}/${MODEL_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: temperature,
          return_full_text: false,
          top_p: 0.9,
          do_sample: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HuggingFace API Error:', errorText);
      
      // Handle specific errors
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

    // HuggingFace returns an array with generated_text
    if (!Array.isArray(data) || !data[0]?.generated_text) {
      return {
        text: '',
        success: false,
        error: 'Unexpected API response format',
      };
    }

    return {
      text: data[0].generated_text,
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

// Helper with retry logic for rate limits
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
      const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
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