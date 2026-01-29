/**
 * Server-side score calculation for quiz attempts
 * This ensures security - scores are never calculated on the frontend
 */

/**
 * Calculates the score for a quiz attempt
 * 
 * Rules:
 * - Single Choice: User must select the correct option (1 point if correct, 0 if wrong)
 * - Multiple Choice: User must select ALL correct options and NO incorrect options (1 point if perfect, 0 if any mistake)
 * 
 * @param {Object} quiz - Quiz with questions and options
 * @param {Array} userAnswers - Array of UserAnswer records
 * @returns {Object} - { score, totalQuestions, details }
 */
export function calculateQuizScore(quiz, userAnswers) {
  const questions = quiz.questions || [];
  let score = 0;
  const details = [];

  questions.forEach((question) => {
    // Get correct options for this question
    const correctOptions = question.options.filter((opt) => opt.isCorrect);
    const correctOptionIds = new Set(correctOptions.map((opt) => opt.id));

    // Get user's selected options for this question
    const userSelectedAnswers = userAnswers.filter(
      (answer) => answer.questionId === question.id
    );
    const userSelectedOptionIds = new Set(
      userSelectedAnswers.map((answer) => answer.optionId)
    );

    let isCorrect = false;

    if (question.type === 'SINGLE_CHOICE') {
      // Single choice: User must select exactly one correct option
      if (userSelectedOptionIds.size === 1 && correctOptionIds.size === 1) {
        const userOptionId = Array.from(userSelectedOptionIds)[0];
        isCorrect = correctOptionIds.has(userOptionId);
      }
    } else if (question.type === 'MULTIPLE_CHOICE') {
      // Multiple choice: User must select ALL correct options and NO incorrect options
      if (
        userSelectedOptionIds.size === correctOptionIds.size &&
        userSelectedOptionIds.size > 0
      ) {
        // Check if all selected options are correct and all correct options are selected
        const allSelectedAreCorrect = Array.from(userSelectedOptionIds).every(
          (id) => correctOptionIds.has(id)
        );
        const allCorrectAreSelected = Array.from(correctOptionIds).every(
          (id) => userSelectedOptionIds.has(id)
        );
        isCorrect = allSelectedAreCorrect && allCorrectAreSelected;
      }
    }

    if (isCorrect) {
      score++;
    }

    details.push({
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      isCorrect,
      correctOptionIds: Array.from(correctOptionIds),
      userSelectedOptionIds: Array.from(userSelectedOptionIds),
    });
  });

  return {
    score,
    totalQuestions: questions.length,
    details,
  };
}
