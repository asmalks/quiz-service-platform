import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  order_index: number;
  // Reverse mapping to convert shuffled key back to original key (only when randomize_options is true)
  reverseKeyMapping?: { [shuffledKey: string]: string };
}

const QuizTake = () => {
  const { quizId, participantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerPerQuestion, setTimerPerQuestion] = useState(10);
  const [responses, setResponses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [questionTransition, setQuestionTransition] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false); // Prevents duplicate submissions

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length && !isAnswering) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return timerPerQuestion;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentIndex, questions, timerPerQuestion, isAnswering]);

  const fetchQuizData = async () => {
    setLoading(true);
    try {
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("timer_per_question, randomize_questions, randomize_options")
        .eq("id", quizId)
        .single();

      if (quizError) throw quizError;

      setTimerPerQuestion(quizData.timer_per_question);
      setTimeLeft(quizData.timer_per_question);

      // Fetch from questions_public view - correct_answer is NOT included for security
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions_public")
        .select("id, quiz_id, question_text, options, order_index")
        .eq("quiz_id", quizId)
        .order("order_index");

      if (questionsError) throw questionsError;

      let processedQuestions = questionsData.map(q => ({
        ...q,
        options: q.options as { A: string; B: string; C: string; D: string },
        // No correct_answer - server validates answers
      }));

      if (quizData.randomize_questions) {
        processedQuestions = [...processedQuestions].sort(() => Math.random() - 0.5);
      }

      if (quizData.randomize_options) {
        processedQuestions = processedQuestions.map((q) => {
          const optionsArray = Object.entries(q.options);
          const shuffled = optionsArray.sort(() => Math.random() - 0.5);
          const newOptions: any = {};
          const reverseMapping: any = {}; // new key -> original key

          shuffled.forEach(([originalKey, value], idx) => {
            const newKey = String.fromCharCode(65 + idx);
            newOptions[newKey] = value;
            reverseMapping[newKey] = originalKey; // Store reverse mapping
          });

          return {
            ...q,
            options: newOptions,
            reverseKeyMapping: reverseMapping, // Store for use when submitting
          };
        });
      }

      setQuestions(processedQuestions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = useCallback(async () => {
    if (submitting || isAnswering) return;

    // Set flag immediately to prevent duplicate calls from timer + button click race condition
    setIsAnswering(true);

    const currentQuestion = questions[currentIndex];
    const timeTaken = Math.max(0, timerPerQuestion - timeLeft); // Ensure non-negative

    // If options were shuffled, convert the shuffled key back to the original key for storage
    // This ensures the Results page can correctly look up the answer text using original options
    const originalAnswerKey = currentQuestion.reverseKeyMapping && selectedAnswer
      ? currentQuestion.reverseKeyMapping[selectedAnswer]
      : selectedAnswer;

    // Note: is_correct is set to false here - the server-side trigger will
    // calculate the real value by comparing answer to questions.correct_answer
    const response = {
      participant_id: participantId,
      quiz_id: quizId,
      question_id: currentQuestion.id,
      answer: originalAnswerKey || "",
      is_correct: false, // Server will override this via trigger for security
      time_taken: timeTaken,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentIndex + 1 < questions.length) {
      // Trigger transition animation
      setQuestionTransition(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer("");
        setTimeLeft(timerPerQuestion);
        setQuestionTransition(false);
        setIsAnswering(false); // Reset for next question
      }, 300);
    } else {
      // Show celebration before submitting
      setShowCelebration(true);
      setTimeout(async () => {
        await submitQuiz(newResponses);
      }, 1500);
    }
  }, [currentIndex, questions, selectedAnswer, timeLeft, timerPerQuestion, responses, participantId, quizId, submitting, isAnswering]);

  const submitQuiz = async (allResponses: any[]) => {
    setSubmitting(true);

    try {
      // Insert all responses
      const { error: responsesError } = await supabase
        .from("responses")
        .insert(allResponses);

      if (responsesError) throw responsesError;

      // Calculate score and total time
      const totalScore = allResponses.filter((r) => r.is_correct).length;
      const totalTime = allResponses.reduce((sum, r) => sum + r.time_taken, 0);

      // Update participant
      const { error: updateError } = await supabase
        .from("participants")
        .update({
          end_time: new Date().toISOString(),
          total_score: totalScore,
          total_time_taken: totalTime,
        })
        .eq("id", participantId);

      if (updateError) throw updateError;

      navigate(`/quiz/${quizId}/results/${participantId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
          <p className="text-lg font-medium text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="text-lg font-semibold">No questions found</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-3 sm:p-4 relative">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in backdrop-blur-sm">
          <div className="text-center space-y-4 animate-scale-in">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center shadow-glow animate-pulse">
              <span className="text-4xl sm:text-6xl">🎉</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white animate-fade-in">Quiz Complete!</h2>
            <p className="text-base sm:text-xl text-white/80 animate-fade-in">Calculating your results...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade-in">
          <Badge variant="secondary" className="text-xs sm:text-sm px-3 sm:px-4 py-1.5">
            {currentIndex + 1}/{questions.length}
          </Badge>
          <div className="flex items-center gap-2 bg-background/80 rounded-full px-4 py-2 border">
            <Clock className={`w-4 h-4 ${timeLeft <= 3 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
            <span className={`text-xl sm:text-2xl font-bold tabular-nums ${timeLeft <= 3 ? "text-destructive" : "text-foreground"}`}>
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card - Centered and auto-sizing */}
        <Card className={`shadow-lg transition-all duration-300 ${questionTransition ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <CardContent className="p-5 sm:p-8 space-y-6 sm:space-y-8">
            {/* Question Text */}
            <div className="text-center">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-foreground leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSelectedAnswer(key)}
                  className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${selectedAnswer === key
                    ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-muted/50 hover:scale-[1.01]"
                    }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm sm:text-base font-bold text-primary">
                      {key}
                    </span>
                    <span className="flex-1 text-sm sm:text-base leading-snug">{value}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Submit Button - Centered */}
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer || submitting}
              className="w-full bg-primary hover:bg-primary/90 text-base sm:text-lg h-14 sm:h-16 rounded-xl flex items-center justify-center"
            >
              {currentIndex + 1 === questions.length ? "Submit Quiz" : "Next Question"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizTake;
