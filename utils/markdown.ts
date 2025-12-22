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
    const codeFencePattern = /^```[\w-]*$/m;
    if (codeFencePattern.test(text)) {
        score += 3; // Strong indicator
    }

    // Check for headings (# Heading)
    const headingPattern = /^#{1,6}\s+\S/m;
    if (headingPattern.test(text)) {
        score += 2;
    }

    // Check for bullet lists (- item or * item)
    const bulletListPattern = /^[\s]*[-*+]\s+\S/m;
    if (bulletListPattern.test(text)) {
        score += 1;
    }

    // Check for numbered lists (1. item)
    const numberedListPattern = /^[\s]*\d+\.\s+\S/m;
    if (numberedListPattern.test(text)) {
        score += 1;
    }

    // Check for inline code (`code`)
    const inlineCodePattern = /`[^`]+`/;
    if (inlineCodePattern.test(text)) {
        score += 1;
    }

    // Check for bold (**text** or __text__)
    const boldPattern = /(\*\*|__)[^*_]+\1/;
    if (boldPattern.test(text)) {
        score += 1;
    }

    // Check for italic (*text* or _text_) - be careful not to match bullet lists
    const italicPattern = /(?<!\*)\*(?!\*)([^*\n]+)\*(?!\*)|(?<!_)_(?!_)([^_\n]+)_(?!_)/;
    if (italicPattern.test(text)) {
        score += 1;
    }

    // Check for links [text](url)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/;
    if (linkPattern.test(text)) {
        score += 1;
    }

    // Check for blockquotes (> text)
    const blockquotePattern = /^>\s+\S/m;
    if (blockquotePattern.test(text)) {
        score += 1;
    }

    // Check for horizontal rules (---, ***, ___)
    const hrPattern = /^([-*_]){3,}$/m;
    if (hrPattern.test(text)) {
        score += 1;
    }

    // Check for tables (| col | col |)
    const tablePattern = /\|[^|]+\|/;
    if (tablePattern.test(text)) {
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
