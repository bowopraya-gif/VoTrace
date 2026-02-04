
function cleanText(text) {
    return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'…​​]/g, '') // Strip punctuation
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
}

function calculateSimilarity(a, b) {
    const aLower = cleanText(a);
    const bLower = cleanText(b);

    if (aLower === bLower) return 1.0;
    if (aLower.length === 0 || bLower.length === 0) return 0.0;

    const matrix = [];
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
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[bLower.length][aLower.length];
    const maxLen = Math.max(aLower.length, bLower.length);
    return maxLen === 0 ? 1.0 : 1.0 - distance / maxLen;
}

const sentence = "Tiba-tiba, lampu padam.";
const correctAnswer = "tiba-tiba";

// Logic from TypingQuestion.tsx
const tokens = sentence.split(/(\b|\W+)/);
console.log("Tokens:", tokens);

const possibleAnswers = correctAnswer.split(/[\/,|]/).map(s => s.trim());
console.log("Possible Answers:", possibleAnswers);

const THRESHOLD = 0.6;

const maskedTokens = tokens.map((token, i) => {
    // Skip non-word tokens
    if (!/\w+/.test(token)) {
        console.log(`Token '${token}' skipped (non-word)`);
        return token;
    }

    // Check similarity against ANY possible correct answer
    const isMatch1 = possibleAnswers.some(ans => {
        const sim = calculateSimilarity(token, ans);
        console.log(`Checking '${token}' vs '${ans}': sim=${sim}`);
        return sim >= THRESHOLD;
    });

    if (isMatch1) {
        return "____";
    }
    return token;
});

console.log("Result:", maskedTokens.join(""));
