import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Clock, CheckCircle2, XCircle, Share2, Home } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { useClientTheme } from "@/hooks/use-client-theme";

interface ResultData {
    participant: { name: string; total_score: number; total_time_taken: number };
    questions: Array<{
        question_text: string;
        options: any;
        correct_answer: string;
        user_answer: string;
        is_correct: boolean;
    }>;
    totalQuestions: number;
}

const ClientResults = () => {
    const { clientSlug, quizId, participantId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { width, height } = useWindowSize();
    const { theme } = useClientTheme(clientSlug);

    const [result, setResult] = useState<ResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        fetchResults();
    }, [participantId]);

    const fetchResults = async () => {
        try {
            const { data: participant } = await supabase
                .from("participants")
                .select("name, total_score, total_time_taken")
                .eq("id", participantId)
                .single();

            if (!participant) throw new Error("Participant not found");

            const { data: responses } = await supabase
                .from("responses")
                .select("question_id, answer, is_correct")
                .eq("participant_id", participantId);

            const { data: questions } = await supabase
                .from("questions")
                .select("id, question_text, options, correct_answer")
                .eq("quiz_id", quizId);

            const questionsWithAnswers = (questions || []).map((q) => {
                const response = responses?.find((r) => r.question_id === q.id);
                return {
                    question_text: q.question_text,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    user_answer: response?.answer || "",
                    is_correct: response?.is_correct || false,
                };
            });

            setResult({
                participant,
                questions: questionsWithAnswers,
                totalQuestions: questions?.length || 0,
            });

            if (participant.total_score > 0) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }
        } catch (error) {
            console.error("Error:", error);
            toast({ title: "Error", description: "Failed to load results", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!result) return;
        const text = `I scored ${result.participant.total_score}/${result.totalQuestions} on ${theme.name} quiz! 🎉`;
        if (navigator.share) {
            try {
                await navigator.share({ title: theme.name, text, url: window.location.href });
            } catch { }
        } else {
            navigator.clipboard.writeText(text);
            toast({ title: "Copied!", description: "Result text copied to clipboard" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background_color }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary_color }} />
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Results not found.</p>
            </div>
        );
    }

    const scorePercent = (result.participant.total_score / result.totalQuestions) * 100;

    return (
        <div className="min-h-screen p-4" style={{ backgroundColor: theme.background_color }}>
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-12 mx-auto object-contain" />
                    )}
                    <h1 className="text-2xl font-bold" style={{ color: theme.primary_color }}>
                        Quiz Results
                    </h1>
                    <p className="text-muted-foreground">{result.participant.name}</p>
                </div>

                {/* Score Card */}
                <Card style={{ borderColor: theme.primary_color, borderWidth: "2px" }}>
                    <CardContent className="p-6 text-center space-y-4">
                        <div className="text-6xl font-bold" style={{ color: theme.primary_color }}>
                            {result.participant.total_score}/{result.totalQuestions}
                        </div>
                        <p className="text-lg">
                            {scorePercent >= 80 ? "🎉 Excellent!" : scorePercent >= 60 ? "👍 Good Job!" : scorePercent >= 40 ? "📚 Keep Studying!" : "💪 Don't Give Up!"}
                        </p>
                        <div className="flex justify-center gap-6 text-sm">
                            <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" style={{ color: theme.primary_color }} />
                                <span>Score: {result.participant.total_score}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span>Time: {result.participant.total_time_taken}s</span>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={handleShare} variant="outline" size="sm">
                                <Share2 className="mr-1 h-3 w-3" />
                                Share
                            </Button>
                            <Link to={`/leaderboard/${clientSlug}/${quizId}`}>
                                <Button size="sm" style={{ backgroundColor: theme.primary_color }} className="text-white">
                                    <Trophy className="mr-1 h-3 w-3" />
                                    Leaderboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Review */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Question Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {result.questions.map((q, index) => (
                            <div key={index} className={`p-4 rounded-lg border-2 ${q.is_correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                                <div className="flex items-start gap-2 mb-2">
                                    {q.is_correct ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    )}
                                    <p className="font-medium">{index + 1}. {q.question_text}</p>
                                </div>
                                <div className="ml-7 text-sm space-y-1">
                                    <p>
                                        Your answer: <span className={q.is_correct ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                                            {q.user_answer || "No answer"}
                                        </span>
                                    </p>
                                    {!q.is_correct && (
                                        <p>Correct answer: <span className="text-green-700 font-semibold">{q.correct_answer}</span></p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ClientResults;
