// Parser for AI-generated concept lists

/**
 * Parse AI response text into an array of concept strings.
 * Handles multiple formats: JSON arrays, numbered lists, bullet lists.
 */
export function parseConceptResponse(responseText: string): string[] {
    const trimmed = responseText.trim();

    // Try JSON array first
    try {
        // Find the first '[' and last ']'
        const startIdx = trimmed.indexOf('[');
        const endIdx = trimmed.lastIndexOf(']');

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const jsonStr = trimmed.substring(startIdx, endIdx + 1);
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                return parsed.map(s => s.trim()).filter(s => s.length > 0);
            }
        }
    } catch {
        // Fall through to text parsing
    }

    // Try line-by-line parsing (numbered lists, bullet lists)
    const lines = trimmed.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        // Remove numbering: "1. ", "1) ", "- ", "* ", "• "
        .map(line => line.replace(/^(\d+[\.\)]\s*|[-\*•]\s*)/, '').trim())
        // Remove surrounding quotes
        .map(line => line.replace(/^["']|["']$/g, '').trim())
        // Remove trailing commas
        .map(line => line.replace(/,\s*$/, '').trim())
        .filter(line => line.length > 2 && line.length < 100);

    return lines;
}
