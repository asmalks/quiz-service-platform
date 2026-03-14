import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Clock, CheckCircle2, XCircle, Share2, Home, MessageCircle } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";

interface ResultData {
  participant: {
    name: string;
    total_score: number;
    total_time_taken: number;
  };
  questions: Array<{
    question_text: string;
    options: any;
    correct_answer: string;
    user_answer: string;
    is_correct: boolean;
  }>;
  totalQuestions: number;
  badgeText?: string;
  quizTitle?: string;
}

const QuizResults = () => {
  const { quizId, participantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    fetchResults();
  }, [quizId, participantId]);

  const fetchResults = async () => {
    try {
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .select(`
          name, 
          total_score, 
          total_time_taken,
          quizzes (
            title,
            badge_text
          )
        `)
        .eq("id", participantId)
        .single();

      if (participantError) throw participantError;

      const { data: responses, error: responsesError } = await supabase
        .from("responses")
        .select(`
          answer,
          is_correct,
          questions (
            question_text,
            options,
            correct_answer
          )
        `)
        .eq("participant_id", participantId)
        .order("created_at");

      if (responsesError) throw responsesError;

      const questionsData = responses.map((r: any) => {
        return {
          question_text: r.questions.question_text,
          options: r.questions.options,
          correct_answer: r.questions.correct_answer,
          user_answer: r.answer,
          is_correct: r.is_correct,
        };
      });

      const resultData = {
        participant,
        questions: questionsData,
        totalQuestions: questionsData.length,
        badgeText: (participant.quizzes as any)?.badge_text || "QQuiz",
        quizTitle: (participant.quizzes as any)?.title || "Quiz",
      };

      setResults(resultData);

      // Show confetti for high scores (80% or above)
      const percentage = (participant.total_score / questionsData.length) * 100;
      if (percentage >= 80) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000); // Stop after 5 seconds
      }
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

  const handleShare = () => {
    if (results) {
      const text = `I scored ${results.participant.total_score}/${results.totalQuestions} in ${results.quizTitle}! 🎯\n\nTime taken: ${results.participant.total_time_taken}s\n\nJoin ${results.badgeText}: ${window.location.origin}`;

      if (navigator.share) {
        navigator.share({ text });
      } else {
        navigator.clipboard.writeText(text);
        toast({
          title: "Copied!",
          description: "Share text copied to clipboard.",
        });
      }
    }
  };

  const handleWhatsAppShare = () => {
    if (results) {
      const percentage = (results.participant.total_score / results.totalQuestions) * 100;
      const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "🌟" : "💪";

      const text = `${emoji} I just completed ${results.quizTitle}!\n\n` +
        `📊 Score: ${results.participant.total_score}/${results.totalQuestions} (${percentage.toFixed(0)}%)\n` +
        `⏱️ Time: ${results.participant.total_time_taken}s\n\n` +
        `Check out the leaderboard: ${window.location.origin}/leaderboard/${quizId}\n\n` +
        `Join ${results.badgeText} and test your knowledge: ${window.location.origin}`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!results) return null;

  const percentage = (results.participant.total_score / results.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-subtle py-6 px-4 relative overflow-hidden">
      {/* Confetti Effect for High Scores */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={true}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {/* Celebration Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-violet-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-3xl mx-auto space-y-4 relative z-10">
        {/* Celebration Score Card */}
        <Card className="shadow-2xl border-2 border-violet-200 dark:border-violet-800 overflow-hidden animate-fade-in">
          {/* Confetti Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-pink-500/5" />

          <CardContent className="pt-8 pb-6 text-center space-y-6 relative">

            {/* Title */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-4xl font-bold text-primary">
                Well Done! 💪
              </h1>
              <p className="text-xl font-semibold text-foreground/80 tracking-wide">
                {results.participant.name}
              </p>
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="p-4 rounded-2xl bg-[#EEF2FF] border-2 border-[#C7D2FE] shadow-sm transition-transform hover:scale-105">
                <p className="text-xs text-[#6366F1] font-bold uppercase tracking-wider mb-1">Score</p>
                <p className="text-3xl font-black text-[#4338CA]">
                  {results.participant.total_score}/{results.totalQuestions}
                </p>
                <div className="mt-2 h-2 bg-[#E0E7FF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6366F1] to-[#4338CA] rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#F5F3FF] border-2 border-[#DDD6FE] shadow-sm transition-transform hover:scale-105">
                <p className="text-xs text-[#8B5CF6] font-bold uppercase tracking-wider mb-1">Time</p>
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-5 h-5 text-[#8B5CF6]" />
                  <p className="text-3xl font-black text-[#6D28D9]">{results.participant.total_time_taken}s</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#F0FDF4] border-2 border-[#BBF7D0] shadow-sm transition-transform hover:scale-105">
                <p className="text-xs text-[#22C55E] font-bold uppercase tracking-wider mb-1">Accuracy</p>
                <p className="text-3xl font-black text-[#15803D]">
                  {percentage.toFixed(0)}%
                </p>
                <div className="mt-2 h-1 bg-[#DCFCE7] rounded-full" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {/* Leaderboard - Primary Action */}
              <Link to={`/leaderboard/${quizId}`}>
                <Button
                  className="w-full h-auto py-3 sm:py-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 border-none ring-offset-2 focus:ring-2 ring-violet-500"
                >
                  {/* Mobile View: No Icon, 2 Lines */}
                  <div className="flex flex-col items-center leading-tight gap-0.5 sm:hidden">
                    <span className="text-sm font-medium opacity-90 text-white/90">Check Your</span>
                    <span className="text-xl font-black tracking-wide text-white drop-shadow-sm">Leaderboard Rank</span>
                  </div>

                  {/* Desktop View: Icon (No Animation), 1 Line */}
                  <div className="hidden sm:flex items-center justify-center gap-3">
                    <Trophy className="h-7 w-7 text-yellow-300 drop-shadow-md" />
                    <span className="text-xl font-bold text-white tracking-wide">Check Your Leaderboard Rank</span>
                  </div>
                </Button>
              </Link>

              {/* Share Options */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleWhatsAppShare}
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button onClick={handleShare} variant="outline" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Motivational Message */}
            {percentage >= 80 && (
              <p className="text-sm text-primary font-medium animate-fade-in" style={{ animationDelay: '0.4s' }}>
                🏆 You're in the top tier! Keep it up!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Detailed Answer Review for Learning */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="text-2xl">📚</span>
              Answer Review
            </CardTitle>
            <p className="text-sm text-muted-foreground">Review all questions and learn from your answers</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.questions.map((q, idx) => {
              const options = q.options || {};
              const correctAnswerText = options[q.correct_answer] || q.correct_answer;
              const userAnswerText = q.user_answer ? (options[q.user_answer] || q.user_answer) : null;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border-2 transition-all ${q.is_correct
                    ? 'border-green-500/40 bg-green-50 dark:bg-green-950/30'
                    : 'border-red-400/40 bg-red-50 dark:bg-red-950/30'
                    }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {/* Question Badge */}
                    <Badge
                      variant={q.is_correct ? "default" : "destructive"}
                      className={`text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 flex-shrink-0 ${q.is_correct ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      Q{idx + 1}
                    </Badge>

                    {/* Status Icon */}
                    {q.is_correct ? (
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    )}

                    {/* Question and Answer */}
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold text-sm sm:text-base leading-relaxed">{q.question_text}</p>

                      {/* Correct Answer Display */}
                      <div className="flex items-start gap-2 p-2 sm:p-3 rounded-xl bg-green-100 dark:bg-green-900/40 border-2 border-green-500/50">
                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-400 font-medium mb-0.5 sm:mb-1">Correct Answer</p>
                          <p className="text-sm font-semibold leading-snug text-green-800 dark:text-green-200">
                            {correctAnswerText}
                          </p>
                        </div>
                      </div>

                      {/* User's Wrong Answer */}
                      {!q.is_correct && (
                        <div className="flex items-start gap-2 p-2 sm:p-3 rounded-xl bg-red-100 dark:bg-red-900/40 border-2 border-red-400/50">
                          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium mb-0.5 sm:mb-1">Your Answer</p>
                            <p className="text-sm font-semibold leading-snug text-red-700 dark:text-red-200">
                              {userAnswerText || <span className="italic opacity-70">Not answered</span>}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3 pt-4 pb-8">
          <Link to={`/leaderboard/${quizId}`} className="w-full">
            <Button variant="secondary" className="w-full">
              <Trophy className="mr-2 h-4 w-4" />
              Check Leaderboard
            </Button>
          </Link>

          <Link to="/">
            <Button variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
