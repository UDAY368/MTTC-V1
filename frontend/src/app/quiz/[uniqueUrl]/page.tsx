'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import quizApi from '@/lib/quizApi';
import { usePreventNavigation } from '@/hooks/usePreventNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Menu, 
  X, 
  Flag, 
  AlertTriangle,
  CircleDot,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  course: {
    name: string;
  };
  questions: Question[];
}

interface Question {
  id: string;
  text: string;      // English
  textTe?: string;   // Telugu
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  order: number;
  options: Option[];
}

interface Option {
  id: string;
  text: string;      // English
  textTe?: string;   // Telugu
  order: number;
}

interface QuizAttempt {
  attemptId: string;
  startedAt: string;
  durationMinutes: number;
  totalQuestions: number;
  language: 'en' | 'te';
}

type Language = 'en' | 'te';

interface Answer {
  questionId: string;
  optionIds: string[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const uniqueUrl = params.uniqueUrl as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('');
  const [nameStepDone, setNameStepDone] = useState(false);

  // Helper function to get localized text
  const getLocalizedText = (item: { text: string; textTe?: string }) => {
    if (selectedLanguage === 'te' && item.textTe) {
      return item.textTe;
    }
    return item.text;
  };

  useEffect(() => {
    loadQuiz();
  }, [uniqueUrl]);

  // Prevent navigation during quiz
  usePreventNavigation(!!attempt && !submitted);

  useEffect(() => {
    if (attempt && !submitted) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
        const remaining = attempt.durationMinutes * 60 - elapsed;
        
        if (remaining <= 0) {
          clearInterval(interval);
          handleAutoSubmit();
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [attempt, submitted]);

  const loadQuiz = async () => {
    try {
      const response = await quizApi.get(`/quiz/${uniqueUrl}`);
      setQuiz(response.data.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Quiz not found');
      setLoading(false);
    }
  };

  const startQuiz = async (language: Language = selectedLanguage) => {
    try {
      const response = await quizApi.post(`/quiz/${uniqueUrl}/start`, { language });
      setAttempt(response.data.data);
      setSelectedLanguage(language);
      setTimeRemaining(response.data.data.durationMinutes * 60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start quiz');
    }
  };

  const handleAnswer = (questionId: string, optionId: string) => {
    if (submitted) return;

    const question = quiz?.questions.find(q => q.id === questionId);
    if (!question) return;

    if (question.type === 'SINGLE_CHOICE') {
      setAnswers({ ...answers, [questionId]: [optionId] });
    } else {
      const currentAnswers = answers[questionId] || [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      setAnswers({ ...answers, [questionId]: newAnswers });
    }
  };

  const submitAnswer = async (questionId: string) => {
    const optionIds = answers[questionId] || [];
    if (optionIds.length === 0) return;

    try {
      await quizApi.post(`/attempts/${attempt?.attemptId}/answers`, {
        questionId,
        optionIds,
      });
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;

    setSubmitting(true);

    try {
      // Submit all answers first
      const answerPromises = Object.entries(answers)
        .filter(([_, optionIds]) => optionIds.length > 0)
        .map(([questionId, optionIds]) =>
          quizApi.post(`/attempts/${attempt.attemptId}/answers`, {
            questionId,
            optionIds,
          })
        );
      
      await Promise.all(answerPromises);

      // Submit quiz
      const response = await quizApi.post(`/attempts/${attempt.attemptId}/submit`);
      
      // Add a small delay for smooth animation transition
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setResults(response.data.data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAnswered = (questionId: string) => {
    return answers[questionId] && answers[questionId].length > 0;
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getQuestionState = (index: number) => {
    const questionId = quiz?.questions[index].id || '';
    if (index === currentQuestionIndex) return 'current';
    if (markedForReview.has(questionId)) return 'marked';
    if (isAnswered(questionId)) return 'answered';
    return 'unanswered';
  };

  const getUnansweredCount = () => {
    if (!quiz) return 0;
    return quiz.questions.filter(q => !isAnswered(q.id)).length;
  };

  const getMarkedCount = () => {
    return markedForReview.size;
  };

  const getGrade = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-500', message: 'Excellent!' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500', message: 'Great job!' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-500', message: 'Good work!' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-500', message: 'Keep practicing!' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-500', message: 'Needs improvement' };
    return { grade: 'F', color: 'text-red-500', message: 'Try again!' };
  };

  const handleConfirmSubmit = () => {
    setShowConfirmSubmit(true);
  };

  const handleCancelSubmit = () => {
    setShowConfirmSubmit(false);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmSubmit(false);
    await handleSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attempt && quiz) {
    // Step 1: Name entry (before language)
    if (!nameStepDone) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl sm:text-2xl font-light">{quiz.course.name}</CardTitle>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">{quiz.title}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="quiz-user-name" className="text-sm font-medium text-foreground block text-center">
                    Please enter your name / దయచేసి మీ పేరు నమోదు చేయండి
                  </label>
                  <input
                    id="quiz-user-name"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value.trim())}
                    placeholder={selectedLanguage === 'en' ? 'Your name' : 'మీ పేరు'}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-base"
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <Button
                  onClick={() => {
                    const name = userName.trim();
                    if (name) {
                      setUserName(name);
                      setNameStepDone(true);
                    }
                  }}
                  className="w-full"
                  size="lg"
                  disabled={!userName.trim()}
                >
                  Continue / కొనసాగించండి
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    // Step 2: Language selection + Start
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-light">{quiz.course.name}</CardTitle>
              <p className="text-muted-foreground mt-2">{quiz.title}</p>
              <p className="text-sm text-primary font-medium mt-1">Hi, {userName}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {quiz.description && (
                <p className="text-muted-foreground text-center">{quiz.description}</p>
              )}
              <div className="text-center space-y-2">
                <p className="text-foreground">Duration: {quiz.durationMinutes} minutes</p>
                <p className="text-foreground">Questions: {quiz.questions.length}</p>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <p className="text-center text-sm font-medium text-muted-foreground">
                  Select your preferred language / మీకు నచ్చిన భాషను ఎంచుకోండి
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedLanguage('en')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedLanguage === 'en'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg font-medium">English</div>
                    <div className="text-sm text-muted-foreground">Questions in English</div>
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('te')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedLanguage === 'te'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg font-medium">తెలుగు</div>
                    <div className="text-sm text-muted-foreground">Telugu లో ప్రశ్నలు</div>
                  </button>
                </div>
              </div>

              <Button
                onClick={() => startQuiz(selectedLanguage)}
                className="w-full"
                size="lg"
              >
                {selectedLanguage === 'en' ? 'Start Quiz' : 'క్విజ్ ప్రారంభించండి'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (submitted && results) {
    const gradeInfo = getGrade(results.score, results.totalQuestions);
    const percentage = Math.round((results.score / results.totalQuestions) * 100);
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="text-3xl font-light">{quiz?.course.name}</h1>
            <h2 className="text-2xl font-light text-muted-foreground">{quiz?.title}</h2>
          </motion.div>

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-card overflow-hidden">
              <CardContent className="pt-6 pb-8">
                <div className="text-center space-y-6">
                  {/* User name */}
                  {userName && (
                    <p className="text-lg font-medium text-foreground">
                      {selectedLanguage === 'en' ? (
                        <>Well done, <span className="text-primary font-semibold">{userName}</span>!</>
                      ) : (
                        <>చాలా బాగుంది, <span className="text-primary font-semibold">{userName}</span>!</>
                      )}
                    </p>
                  )}
                  {/* Grade Circle */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="relative inline-flex"
                  >
                    <div className={`w-32 h-32 rounded-full border-8 ${
                      percentage >= 60 ? 'border-green-500' : percentage >= 40 ? 'border-yellow-500' : 'border-red-500'
                    } flex items-center justify-center`}>
                      <span className={`text-5xl font-bold ${gradeInfo.color}`}>
                        {gradeInfo.grade}
                      </span>
                    </div>
                  </motion.div>

                  {/* Message */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className={`text-2xl font-medium ${gradeInfo.color}`}
                  >
                    {gradeInfo.message}
                  </motion.p>

                  {/* Score Details */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border max-w-md mx-auto">
                    <div>
                      <p className="text-3xl font-light text-primary">{results.score}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLanguage === 'en' ? 'Correct' : 'సరైనవి'}
                      </p>
                    </div>
                    <div>
                      <p className="text-3xl font-light text-destructive">{results.totalQuestions - results.score}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLanguage === 'en' ? 'Wrong' : 'తప్పు'}
                      </p>
                    </div>
                    <div>
                      <p className="text-3xl font-light">{percentage}%</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLanguage === 'en' ? 'Score' : 'స్కోరు'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="max-w-md mx-auto">
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          percentage >= 60 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-medium mb-4">
              {selectedLanguage === 'en' ? 'Question Review' : 'ప్రశ్న సమీక్ష'}
            </h3>
          </motion.div>

          <div className="space-y-4">
            {results.questions.map((q: any, index: number) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Card className={`border-l-4 ${q.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {q.isCorrect ? (
                        <div className="p-2 rounded-full bg-green-500/10">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-full bg-red-500/10">
                          <XCircle className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          {selectedLanguage === 'en' ? 'Question' : 'ప్రశ్న'} {index + 1}
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            q.isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {q.isCorrect 
                              ? (selectedLanguage === 'en' ? 'Correct' : 'సరైనది')
                              : (selectedLanguage === 'en' ? 'Incorrect' : 'తప్పు')}
                          </span>
                        </CardTitle>
                        <p className="text-foreground mt-2">{q.text}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pl-14">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-2">
                        {selectedLanguage === 'en' ? 'Correct Answer:' : 'సరైన సమాధానం:'}
                      </p>
                      <div className="space-y-2">
                        {q.correctOptions.map((opt: any) => (
                          <div
                            key={opt.id}
                            className="p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400"
                          >
                            <CheckCircle2 className="h-4 w-4 inline mr-2" />
                            {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    {!q.isCorrect && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-2">
                          {selectedLanguage === 'en' ? 'Your Answer:' : 'మీ సమాధానం:'}
                        </p>
                        <div className="space-y-2">
                          {q.userSelectedOptions.length > 0 ? (
                            q.userSelectedOptions.map((opt: any) => (
                              <div
                                key={opt.id}
                                className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400"
                              >
                                <XCircle className="h-4 w-4 inline mr-2" />
                                {opt.text}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 rounded-md bg-muted text-muted-foreground italic">
                              {selectedLanguage === 'en' ? 'No answer selected' : 'సమాధానం ఎంచుకోలేదు'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center pt-6 pb-8"
          >
            <Button
              onClick={() => {
                setAttempt(null);
                setSubmitted(false);
                setResults(null);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setMarkedForReview(new Set());
              }}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {selectedLanguage === 'en' ? 'Retake Quiz' : 'క్విజ్ మళ్ళీ తీసుకోండి'}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!quiz || !attempt) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLowTime = timeRemaining < 300; // 5 minutes
  const isCriticalTime = timeRemaining < 120; // 2 minutes
  const progressPercentage = (Object.keys(answers).filter(k => answers[k].length > 0).length / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Fixed Header - Course Name - Visible on all screen sizes */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center justify-center">
          <h1 className="text-lg md:text-xl font-semibold text-primary text-center">
            {quiz.course.name}
          </h1>
        </div>
      </header>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-semibold">
                  {selectedLanguage === 'en' ? 'Submit Quiz?' : 'క్విజ్ సమర్పించాలా?'}
                </h3>
              </div>
              
              {getUnansweredCount() > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {selectedLanguage === 'en' 
                      ? `You have ${getUnansweredCount()} unanswered question(s).`
                      : `మీకు ${getUnansweredCount()} సమాధానం ఇవ్వని ప్రశ్నలు ఉన్నాయి.`}
                  </p>
                </div>
              )}

              {getMarkedCount() > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-md p-3 mb-4">
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {selectedLanguage === 'en'
                      ? `You have ${getMarkedCount()} question(s) marked for review.`
                      : `మీకు ${getMarkedCount()} సమీక్ష కోసం గుర్తు పెట్టిన ప్రశ్నలు ఉన్నాయి.`}
                  </p>
                </div>
              )}

              <p className="text-muted-foreground mb-6">
                {selectedLanguage === 'en'
                  ? 'Are you sure you want to submit? This action cannot be undone.'
                  : 'మీరు ఖచ్చితంగా సమర్పించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేరు.'}
              </p>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleCancelSubmit} disabled={submitting}>
                  {selectedLanguage === 'en' ? 'Cancel' : 'రద్దు'}
                </Button>
                <Button onClick={handleFinalSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {selectedLanguage === 'en' ? 'Submitting...' : 'సమర్పిస్తోంది...'}
                    </>
                  ) : (
                    selectedLanguage === 'en' ? 'Submit' : 'సమర్పించు'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submitting Overlay */}
      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Backdrop with blur */}
            <motion.div
              initial={{ backdropFilter: 'blur(0px)' }}
              animate={{ backdropFilter: 'blur(8px)' }}
              className="absolute inset-0 bg-background/80"
            />
            
            {/* Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative z-10 flex flex-col items-center gap-6"
            >
              {/* Animated circles */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2 w-20 h-20 rounded-full border-4 border-secondary/20 border-t-secondary"
                  style={{ top: '8px', left: '8px', width: '80px', height: '80px' }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
              </div>

              {/* Text */}
              <div className="text-center space-y-2">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-semibold text-foreground"
                >
                  {selectedLanguage === 'en' ? 'Submitting Your Quiz' : 'మీ క్విజ్ సమర్పిస్తోంది'}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground"
                >
                  {selectedLanguage === 'en' ? 'Please wait while we calculate your results...' : 'మీ ఫలితాలను లెక్కిస్తున్నాము...'}
                </motion.p>
              </div>

              {/* Progress dots */}
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-3 h-3 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Panel - Question Navigation - Always visible on desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-card p-4 overflow-y-auto">
          <div className="space-y-4">

            <div>
              {userName && (
                <p className="text-sm font-medium text-foreground truncate" title={userName}>
                  {selectedLanguage === 'en' ? 'Name: ' : 'పేరు: '}{userName}
                </p>
              )}
              <h3 className="text-lg font-light mt-1">{quiz.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedLanguage === 'en' ? 'Language: English' : 'భాష: తెలుగు'}
              </p>
            </div>

          {/* Timer */}
          <motion.div
            animate={isCriticalTime ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: isCriticalTime ? Infinity : 0, duration: 1 }}
            className={`flex items-center gap-2 p-3 rounded-md ${
              isCriticalTime ? 'bg-red-500/20 border border-red-500' : 
              isLowTime ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-muted'
            }`}
          >
            <Clock className={`h-4 w-4 ${
              isCriticalTime ? 'text-red-500' : 
              isLowTime ? 'text-yellow-500' : 'text-foreground'
            }`} />
            <span className={`font-mono text-lg ${
              isCriticalTime ? 'text-red-500 font-bold' : 
              isLowTime ? 'text-yellow-500' : 'text-foreground'
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedLanguage === 'en' ? 'Progress' : 'పురోగతి'}
              </span>
              <span className="text-foreground font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                className="h-full bg-primary rounded-full"
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/20 border border-primary" />
              <span>{selectedLanguage === 'en' ? 'Answered' : 'సమాధానం'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500" />
              <span>{selectedLanguage === 'en' ? 'Review' : 'సమీక్ష'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary border-2 border-secondary" />
              <span>{selectedLanguage === 'en' ? 'Current' : 'ప్రస్తుతం'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border border-border" />
              <span>{selectedLanguage === 'en' ? 'Not visited' : 'సందర్శించలేదు'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {selectedLanguage === 'en' ? 'Questions' : 'ప్రశ్నలు'}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {quiz.questions.map((q, index) => {
                const state = getQuestionState(index);
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setSidebarOpen(false);
                    }}
                    className={`
                      aspect-square rounded-md text-sm font-medium transition-all relative
                      ${
                        state === 'current'
                          ? 'bg-secondary border-2 border-secondary text-foreground'
                          : state === 'marked'
                          ? 'bg-orange-500/20 border border-orange-500 text-orange-600'
                          : state === 'answered'
                          ? 'bg-primary/20 border border-primary text-primary'
                          : 'bg-muted border border-border text-muted-foreground hover:bg-accent'
                      }
                    `}
                  >
                    {index + 1}
                    {markedForReview.has(q.id) && (
                      <Flag className="h-2 w-2 absolute top-0.5 right-0.5 text-orange-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-4 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{selectedLanguage === 'en' ? 'Answered' : 'సమాధానం'}:</span>
              <span className="font-medium text-primary">{quiz.questions.length - getUnansweredCount()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{selectedLanguage === 'en' ? 'Unanswered' : 'సమాధానం లేదు'}:</span>
              <span className="font-medium">{getUnansweredCount()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{selectedLanguage === 'en' ? 'Marked' : 'గుర్తు'}:</span>
              <span className="font-medium text-orange-500">{getMarkedCount()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Panel - Question Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile/Tablet Top Navigation Panel - Fixed at top */}
        <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-border">
          {/* Top Row: Name, Title, Timer */}
          <div className="p-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {userName && (
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedLanguage === 'en' ? 'Name: ' : 'పేరు: '}{userName}
                </p>
              )}
              <h3 className="text-sm font-medium truncate">{quiz.title}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedLanguage === 'en' ? 'Language: English' : 'భాష: తెలుగు'}
              </p>
            </div>
            <motion.div
              animate={isCriticalTime ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: isCriticalTime ? Infinity : 0, duration: 1 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                isCriticalTime ? 'bg-red-500/20 border border-red-500' : 
                isLowTime ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-muted'
              }`}
            >
              <Clock className={`h-4 w-4 ${
                isCriticalTime ? 'text-red-500' : 
                isLowTime ? 'text-yellow-500' : 'text-foreground'
              }`} />
              <span className={`font-mono font-bold ${
                isCriticalTime ? 'text-red-500' : 
                isLowTime ? 'text-yellow-500' : 'text-foreground'
              }`}>
                {formatTime(timeRemaining)}
              </span>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="px-3 pb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                {quiz.questions.length - getUnansweredCount()}/{quiz.questions.length} {selectedLanguage === 'en' ? 'answered' : 'సమాధానాలు'}
              </span>
              <span className="text-foreground font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Question Navigation Grid */}
          <div className="px-3 pb-3 overflow-x-auto">
            <div className="flex gap-1.5 min-w-max">
              {quiz.questions.map((q, index) => {
                const state = getQuestionState(index);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`
                      w-8 h-8 rounded-md text-xs font-medium transition-all relative flex-shrink-0
                      ${
                        state === 'current'
                          ? 'bg-secondary border-2 border-secondary text-foreground'
                          : state === 'marked'
                          ? 'bg-orange-500/20 border border-orange-500 text-orange-600'
                          : state === 'answered'
                          ? 'bg-primary/20 border border-primary text-primary'
                          : 'bg-muted border border-border text-muted-foreground'
                      }
                    `}
                  >
                    {index + 1}
                    {markedForReview.has(q.id) && (
                      <Flag className="h-2 w-2 absolute -top-0.5 -right-0.5 text-orange-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-xl font-light">
                      {selectedLanguage === 'en' ? 'Question' : 'ప్రశ్న'} {currentQuestionIndex + 1} {selectedLanguage === 'en' ? 'of' : '/'} {quiz.questions.length}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Question Type Badge */}
                      <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                        {currentQuestion.type === 'SINGLE_CHOICE' ? (
                          <>
                            <CircleDot className="h-3 w-3" />
                            <span>{selectedLanguage === 'en' ? 'Single Choice' : 'ఒకే ఎంపిక'}</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-3 w-3" />
                            <span>{selectedLanguage === 'en' ? 'Multiple Choice' : 'బహుళ ఎంపిక'}</span>
                          </>
                        )}
                      </div>
                      {/* Mark for Review Button */}
                      <Button
                        variant={markedForReview.has(currentQuestion.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleMarkForReview(currentQuestion.id)}
                        className={markedForReview.has(currentQuestion.id) ? 'bg-orange-500 hover:bg-orange-600' : ''}
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        {markedForReview.has(currentQuestion.id) 
                          ? (selectedLanguage === 'en' ? 'Marked' : 'గుర్తించబడింది')
                          : (selectedLanguage === 'en' ? 'Mark' : 'గుర్తు')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg text-foreground leading-relaxed">{getLocalizedText(currentQuestion)}</p>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, optIndex) => {
                      const isSelected = answers[currentQuestion.id]?.includes(option.id);
                      return (
                        <motion.button
                          key={option.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: optIndex * 0.05 }}
                          onClick={() => {
                            handleAnswer(currentQuestion.id, option.id);
                            submitAnswer(currentQuestion.id);
                          }}
                          className={`
                            w-full p-4 rounded-lg text-left transition-all flex items-center gap-3
                            ${
                              isSelected
                                ? 'bg-primary/10 border-2 border-primary text-foreground'
                                : 'bg-background border border-border text-foreground hover:bg-muted hover:border-muted-foreground/30'
                            }
                          `}
                        >
                          <div className={`
                            w-6 h-6 rounded-${currentQuestion.type === 'SINGLE_CHOICE' ? 'full' : 'md'} 
                            border-2 flex items-center justify-center flex-shrink-0
                            ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}
                          `}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-primary-foreground"
                              >
                                {currentQuestion.type === 'SINGLE_CHOICE' ? (
                                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </motion.div>
                            )}
                          </div>
                          <span className="flex-1">{getLocalizedText(option)}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-border bg-card p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{selectedLanguage === 'en' ? 'Previous' : 'మునుపటి'}</span>
            </Button>

            <div className="hidden sm:flex text-sm text-muted-foreground">
              {quiz.questions.length - getUnansweredCount()} {selectedLanguage === 'en' ? 'of' : '/'} {quiz.questions.length} {selectedLanguage === 'en' ? 'answered' : 'సమాధానాలు'}
            </div>

            <div className="flex gap-2">
              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button
                  onClick={handleConfirmSubmit}
                  disabled={submitted || submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {selectedLanguage === 'en' ? 'Submitting...' : 'సమర్పిస్తోంది...'}
                    </>
                  ) : (
                    selectedLanguage === 'en' ? 'Submit Quiz' : 'క్విజ్ సమర్పించండి'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">{selectedLanguage === 'en' ? 'Next' : 'తదుపరి'}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
