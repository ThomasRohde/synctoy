/**
 * Markdown detection and utilities for text handoffs
 * Used to detect Claude/ChatGPT style markdown content
 */

/**
 * Detects if text content appears to be markdown
 * Uses heuristics to identify common markdown patterns from AI chatbots
 */
export function isMarkdown(text: string): boolean {
    if (!text || text.length < 10) return false;

    // Count markdown indicators
    let score = 0;

    // Check for code fences (```language or ```)
    const codeFencePattern = /```[\w-]*\n[\s\S]*?```/;
    if (codeFencePattern.test(text)) {
        score += 3; // Strong indicator
    }

    // Check for headings (# Heading) - must be at start of line
    const headingPattern = /^#{1,6}\s+.+$/m;
    if (headingPattern.test(text)) {
        score += 2;
    }

    // Check for bullet lists (- item or * item at start of line)
    const bulletListPattern = /^[\t ]*[-*+]\s+\S/m;
    if (bulletListPattern.test(text)) {
        score += 1;
    }

    // Check for numbered lists (1. item)
    const numberedListPattern = /^[\t ]*\d+\.\s+\S/m;
    if (numberedListPattern.test(text)) {
        score += 1;
    }

    // Check for inline code (`code`)
    const inlineCodePattern = /`[^`\n]+`/;
    if (inlineCodePattern.test(text)) {
        score += 1;
    }

    // Check for bold (**text**) - more permissive pattern
    const boldPattern = /\*\*[^*\n]+\*\*/;
    if (boldPattern.test(text)) {
        score += 2; // Increased weight - common in chatbot output
    }

    // Check for italic (*text* or _text_) - single markers
    // Avoid matching bullets or underscores in words
    const italicPattern = /(?<![*\w])\*[^*\n]+\*(?![*\w])|(?<![_\w])_[^_\n]+_(?![_\w])/;
    if (italicPattern.test(text)) {
        score += 1;
    }

    // Check for links [text](url)
    const linkPattern = /\[[^\]]+\]\([^)]+\)/;
    if (linkPattern.test(text)) {
        score += 2;
    }

    // Check for blockquotes (> text)
    const blockquotePattern = /^>\s+\S/m;
    if (blockquotePattern.test(text)) {
        score += 1;
    }

    // Check for horizontal rules (---, ***, ___)
    const hrPattern = /^[-*_]{3,}\s*$/m;
    if (hrPattern.test(text)) {
        score += 1;
    }

    // Check for tables (| col | col |)
    const tablePattern = /^\|.+\|$/m;
    if (tablePattern.test(text)) {
        score += 2;
    }

    // Check for definition-style bold headers (common in newsletters)
    // Pattern: **Title** — or **Title** - at start of paragraph
    const boldHeaderPattern = /^\*\*[^*]+\*\*\s*[—–-]/m;
    if (boldHeaderPattern.test(text)) {
        score += 2;
    }

    // Need at least score of 2 to consider it markdown
    // This prevents false positives from plain text with occasional special chars
    return score >= 2;
}

/**
 * Gets a preview-safe version of markdown content
 * Strips markdown syntax for cleaner previews
 */
export function stripMarkdown(text: string): string {
    return text
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '[code]')
        // Remove inline code
        .replace(/`([^`]+)`/g, '$1')
        // Remove bold
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        // Remove italic
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Remove links, keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove headings markers
        .replace(/^#{1,6}\s+/gm, '')
        // Remove blockquote markers
        .replace(/^>\s+/gm, '')
        // Remove bullet markers
        .replace(/^[\s]*[-*+]\s+/gm, '')
        // Remove numbered list markers
        .replace(/^[\s]*\d+\.\s+/gm, '')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim();
}
