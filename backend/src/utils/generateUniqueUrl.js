import crypto from 'crypto';

/**
 * Generates a unique, URL-safe slug for quizzes
 * Format: {prefix}-{random-string}
 * Example: "meditation-day-1-quiz-abc123xyz"
 */
export function generateUniqueUrl(prefix = 'quiz') {
  // Generate a random string (12 characters)
  const randomString = crypto.randomBytes(8).toString('base64url').toLowerCase();
  
  // Create a URL-friendly slug
  const slug = `${prefix}-${randomString}`;
  
  return slug;
}

/**
 * Generates a unique URL and ensures it doesn't exist in the database
 */
export async function generateUniqueQuizUrl(prisma, prefix = 'quiz') {
  let uniqueUrl;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    uniqueUrl = generateUniqueUrl(prefix);
    
    const existing = await prisma.quiz.findUnique({
      where: { uniqueUrl },
    });

    if (!existing) {
      isUnique = true;
    } else {
      attempts++;
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique URL after multiple attempts');
  }

  return uniqueUrl;
}

/**
 * Generates a unique URL for a FlashCardDeck (for public full-screen viewer)
 */
export async function generateUniqueFlashDeckUrl(prisma, prefix = 'flash') {
  let uniqueUrl;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    uniqueUrl = generateUniqueUrl(prefix);
    const existing = await prisma.flashCardDeck.findUnique({
      where: { uniqueUrl },
    });
    if (!existing) isUnique = true;
    else attempts++;
  }
  if (!isUnique) throw new Error('Failed to generate unique flash deck URL');
  return uniqueUrl;
}
