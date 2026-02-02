
// Tolerance thresholds: similarity score needed to pass
const THRESHOLDS: Record<TypoTolerance, number> = {
    strict: 1.0,   // Exact match only
    normal: 0.85,  // ~1 typo allowed per 7 chars
    lenient: 0.70, // ~2 typos allowed per 7 chars
};

export type TypoTolerance = 'strict' | 'normal' | 'lenient';


/**
 * Remove punctuation and extra spaces for relaxed comparison.
 * Keeps letters, numbers, and basic spacing.
 * Removes: . , ! ? : ; " ' ... () and more.
 */
function cleanText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'…​​]/g, '') // Strip punctuation
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
}

/**
 * Calculate Levenshtein Distance between two strings.
 * Returns similarity score (0.0 to 1.0).
 * Uses cleanText() to ignore punctuation.
 */
export function calculateSimilarity(a: string, b: string): number {
    const aLower = cleanText(a);
    const bLower = cleanText(b);

    if (aLower === bLower) return 1.0;
    // If strings become empty after cleaning (e.g. only punctuation), treat as empty
    if (aLower.length === 0 || bLower.length === 0) return 0.0;


    const matrix: number[][] = [];
    for (let i = 0; i <= bLower.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= aLower.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= bLower.length; i++) {
        for (let j = 1; j <= aLower.length; j++) {
            if (bLower[i - 1] === aLower[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    const distance = matrix[bLower.length][aLower.length];
    const maxLen = Math.max(aLower.length, bLower.length);
    return maxLen === 0 ? 1.0 : 1.0 - distance / maxLen;
}

/**
 * Validate user answer against correct answer.
 * Supports multiple correct answers separated by "/".
 * Example: "To go / Takeaway" matches "To go" OR "Takeaway".
 */
export function validateAnswer(
    userAnswer: string,
    correctAnswer: string,
    tolerance: TypoTolerance
): { isCorrect: boolean; similarity: number; matchedAnswer: string } {
    // Split by slash and trim each part
    const possibleAnswers = correctAnswer.split('/').map(s => s.trim());
    const threshold = THRESHOLDS[tolerance];

    let bestMatch = {
        isCorrect: false,
        similarity: -1,
        matchedAnswer: possibleAnswers[0] // Default to first part if no good match
    };

    for (const answer of possibleAnswers) {
        const similarity = calculateSimilarity(userAnswer, answer);
        const isCorrect = similarity >= threshold;

        // update best match if this is better
        if (similarity > bestMatch.similarity) {
            bestMatch = {
                isCorrect,
                similarity,
                matchedAnswer: answer
            };
        }
    }

    return bestMatch;
}

/**
 * Render Token for Unified Feedback
 * - match: Green
 * - wrong: Red (User's char)
 * - missing: Red Underscore
 * - extra: Red (User's char, essentially same as wrong but semantically distinct if we want)
 */
export type FeedbackToken = {
    char: string;
    status: 'correct' | 'wrong' | 'missing';
};

/**
 * Generate Visual Diff using Levenshtein Backtracking.
 * Produces a merged string representation for feedback.
 */
/**
 * Generate Visual Diff using Levenshtein Backtracking.
 * Produces a merged string representation for feedback.
 */
export function getVisualDiff(userAnswer: string, correctAnswer: string): FeedbackToken[] {
    // 1. Calculate similarity first
    const similarity = calculateSimilarity(userAnswer, correctAnswer);

    // 2. Hybrid Strategy: 
    // If similarity is low (< 60%), user likely typed a completely different word.
    // In this case, Levenshtein tries too hard to find "lucky" matches (e.g. 'u' in "sound" vs "audio").
    // We switch to Strict Index Diff to show position-based errors (mostly red).
    const THRESHOLD_SMART_DIFF = 0.6;

    if (similarity < THRESHOLD_SMART_DIFF) {
        return getStrictVisualDiff(userAnswer, correctAnswer);
    }

    // 3. Smart Diff (Levenshtein) for typos / similar words
    const s1 = userAnswer.trim(); // Preserve case for display, but logic usually creates matrix on lower
    // Note: To do simple matrix we need consistent indexing.
    // Let's use standard lowercased match for DP, but reconstruct using original chars.

    // Helper to get char at i (safe)
    const getChar1 = (i: number) => s1[i] || ''; // User char
    const getChar2 = (j: number) => correctAnswer[j] || ''; // Correct char

    const a = s1.toLowerCase();
    const b = correctAnswer.toLowerCase();
    const m = a.length;
    const n = b.length;

    // DP Matrix
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1]; // Match
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j - 1] + 1, // Subst
                    dp[i][j - 1] + 1,     // Insert (Missing in user)
                    dp[i - 1][j] + 1      // Delete (Extra in user)
                );
            }
        }
    }

    // Backtrack
    let i = m;
    let j = n;
    const tokens: FeedbackToken[] = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
            // Match
            tokens.push({ char: s1[i - 1], status: 'correct' });
            i--;
            j--;
        } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
            // Substitution
            tokens.push({ char: s1[i - 1], status: 'wrong' });
            i--;
            j--;
        } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
            // Insertion (Missing in user)
            tokens.push({ char: '_', status: 'missing' });
            j--;
        } else {
            // Deletion (Extra in user)
            tokens.push({ char: s1[i - 1], status: 'wrong' });
            i--;
        }
    }

    return tokens.reverse();
}

/**
 * Strict Column-based Diff
 * Compares strictly by index position.
 * Used when words are fundamentally different.
 */
function getStrictVisualDiff(userAnswer: string, correctAnswer: string): FeedbackToken[] {
    const s1 = userAnswer.trim();
    const s2 = correctAnswer.trim();
    const len1 = s1.length;
    const len2 = s2.length;
    const maxLen = Math.max(len1, len2);

    const tokens: FeedbackToken[] = [];

    for (let i = 0; i < maxLen; i++) {
        const char1 = s1[i]; // User
        const char2 = s2[i]; // Correct

        if (char1 !== undefined && char2 !== undefined) {
            // Both exist - compare
            if (char1.toLowerCase() === char2.toLowerCase()) {
                tokens.push({ char: char1, status: 'correct' });
            } else {
                tokens.push({ char: char1, status: 'wrong' });
            }
        } else if (char1 !== undefined) {
            // User has char, Correct doesn't (Extra)
            tokens.push({ char: char1, status: 'wrong' });
        } else {
            // User missing char (Underscore)
            tokens.push({ char: '_', status: 'missing' });
        }
    }
    return tokens;
}

/**
 * Legacy functions (kept for compatibility if needed, but getVisualDiff replaces them)
 */
export function getUserInputFeedback(userAnswer: string, correctAnswer: string): Array<{ char: string; status: 'correct' | 'wrong' }> {
    // Legacy wrapper
    return [];
}

