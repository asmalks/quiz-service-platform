import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Clock, CheckCircle2, XCircle, Share2, Home, Target, ArrowRight } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { useClientTheme } from "@/hooks/use-client-theme";

interface ResultData {
    participant: { 
        name: string; 
        total_score: number; 
        total_time_taken: number;
        quizzes?: { badge_text: string | null };
    };
    questions: Array<{
        id: string;
        question_text: string;
        options: any;
        correct_answer: string;
        user_answer: string;
        is_correct: boolean;
        show_review: boolean;
    }>;
    totalQuestions: number;
    badgeText?: string;
    quizTitle?: string;
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
            const { data: participant } = await (supabase
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
                .single() as any);

            if (!participant) throw new Error("Participant not found");

            const { data: questionReview, error: reviewError } = await supabase
                .rpc("get_participant_results", { p_participant_id: participantId });

            if (reviewError) throw reviewError;

            const questionsWithAnswers = (questionReview || []).map((q: any) => ({
                id: q.question_id,
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                user_answer: q.user_answer,
                is_correct: q.is_correct,
                show_review: q.show_review
            }));

            setResult({
                participant,
                questions: questionsWithAnswers,
                totalQuestions: questionReview?.length || 0,
                badgeText: (participant.quizzes as any)?.badge_text || theme?.badge_text || theme?.name || "QQuiz",
                quizTitle: (participant.quizzes as any)?.title || "Quiz",
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
        const text = `I scored ${result.participant.total_score}/${result.totalQuestions} on ${result.quizTitle}! 🎉\n\nJoin ${result.badgeText}: ${window.location.href}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: theme.name, text, url: window.location.href });
            } catch { }
        } else {
            navigator.clipboard.writeText(text);
            toast({ title: "Copied!", description: "Result text copied to clipboard" });
        }
    };

    const handleWhatsAppShare = () => {
        if (result) {
            const accuracy = Math.round((result.participant.total_score / result.totalQuestions) * 100) || 0;
            const emoji = accuracy >= 80 ? "🏆" : accuracy >= 60 ? "🌟" : "💪";

            const text = `${emoji} I just completed ${result.quizTitle}!\n\n` +
                `📊 Score: ${result.participant.total_score}/${result.totalQuestions} (${accuracy}%)\n` +
                `⏱️ Time: ${result.participant.total_time_taken}s\n\n` +
                `Check out the leaderboard: ${window.location.origin}/leaderboard/${clientSlug}/${quizId}\n\n` +
                `Join ${result.badgeText} and test your knowledge: ${window.location.origin}/quiz/${clientSlug}/${quizId}`;

            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background_color }}>
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: theme.primary_color }} />
                    <p className="text-lg font-medium text-muted-foreground">Calculating your results...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center space-y-4">
                    <XCircle className="h-16 w-16 text-destructive mx-auto" />
                    <h2 className="text-2xl font-bold">Results Not Found</h2>
                    <p className="text-muted-foreground">We couldn't retrieve your quiz results.</p>
                    <Button className="w-full" onClick={() => navigate("/")}>Go Home</Button>
                </Card>
            </div>
        );
    }

    const totalQs = result.totalQuestions || 1;
    const accuracy = Math.round((result.participant.total_score / totalQs) * 100);

    return (
        <div className="min-h-screen p-4 sm:p-6 font-malayalam relative pb-12" style={{ backgroundColor: theme.background_color }}>
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />}

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4 animate-fade-in">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-16 mx-auto object-contain animate-fade-in-scale" />
                    )}
                    <div className="space-y-1">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: theme.primary_color }}>
                            Quiz Results
                        </h1>
                        <p className="text-muted-foreground text-lg">Great job, {result.participant.name}!</p>
                    </div>
                </div>

                {/* Main Score Card */}
                <Card className="shadow-2xl animate-scale-in overflow-hidden border-0" style={{ boxShadow: `0 20px 50px ${theme.primary_color}15` }}>
                    <div className="h-2 w-full" style={{ backgroundColor: theme.primary_color }} />
                    <CardContent className="p-8 sm:p-12 text-center space-y-8">
                        <div className="relative inline-block">
                            <div className="text-8xl sm:text-9xl font-black tracking-tighter" style={{ color: theme.primary_color }}>
                                {result.participant.total_score}
                            </div>
                            <div className="absolute -top-2 -right-8 bg-slate-100 px-3 py-1 rounded-full text-lg font-bold border-2">
                                /{result.totalQuestions}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl sm:text-3xl font-bold">
                                {accuracy >= 80 ? "🎉 Outstanding!" : accuracy >= 60 ? "👍 Great Effort!" : accuracy >= 40 ? "📚 Good Try!" : "💪 Keep Learning!"}
                            </h2>
                            <p className="text-muted-foreground">You finished the quiz in {result.participant.total_time_taken} seconds.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-6">
                                <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-100 shadow-sm transition-transform hover:scale-105">
                                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-blue-600 opacity-70" />
                                    <div className="text-xl sm:text-2xl font-black text-blue-900">{result.participant.total_score}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-blue-600/70 font-bold">Score</div>
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl bg-purple-50 border border-purple-100 shadow-sm transition-transform hover:scale-105">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-purple-600 opacity-70" />
                                    <div className="text-xl sm:text-2xl font-black text-purple-900">{result.participant.total_time_taken}s</div>
                                    <div className="text-[10px] uppercase tracking-wider text-purple-600/70 font-bold">Time</div>
                                </div>
                                <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm transition-transform hover:scale-105 overflow-hidden">
                                    <Target className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-emerald-600 opacity-70" />
                                    <div className="text-xl sm:text-2xl font-black text-emerald-900 truncate">{accuracy}%</div>
                                    <div className="text-[10px] uppercase tracking-wider text-emerald-600/70 font-bold">Accuracy</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                onClick={handleWhatsAppShare}
                                className="flex-1 h-14 rounded-xl text-white font-bold"
                                style={{ backgroundColor: "#25D366" }}
                            >
                                <Share2 className="mr-2 h-5 w-5" />
                                WhatsApp
                            </Button>
                            <Button onClick={handleShare} variant="outline" size="lg" className="flex-1 h-14 rounded-xl border-2">
                                <Share2 className="mr-2 h-5 w-5" />
                                Share
                            </Button>
                            <Link to={`/leaderboard/${clientSlug}/${quizId}`} className="flex-1">
                                <Button size="lg" className="w-full h-14 rounded-xl shadow-lg font-bold text-white hover:scale-[1.02] transition-transform"
                                    style={{ backgroundColor: theme.primary_color }}>
                                    <Trophy className="mr-2 h-5 w-5" />
                                    View Leaderboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Review */}
                <div className="space-y-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: theme.primary_color }} />
                        <h2 className="text-2xl font-bold">Question Review</h2>
                    </div>

                    <div className="space-y-4">
                        {!result.questions[0]?.show_review && (
                            <Card className="p-6 text-center border-2 border-dashed">
                                <p className="text-muted-foreground">Answer review has been disabled for this quiz</p>
                            </Card>
                        )}
                        {result.questions[0]?.show_review && result.questions.map((q, index) => (
                            <Card key={q.id} className={`overflow-hidden border-2 transition-all hover:shadow-md ${q.is_correct ? "border-green-100" : "border-red-100"}`}>
                                <div className={`p-1 ${q.is_correct ? "bg-green-500" : "bg-red-500"}`} />
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${q.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-xs font-bold uppercase tracking-widest ${q.is_correct ? "text-green-600" : "text-red-600"}`}>
                                                    {q.is_correct ? "Correct" : "Incorrect"}
                                                </span>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    {q.is_correct ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold leading-snug">{q.question_text}</h3>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 pl-14">
                                        {Object.entries(q.options).map(([key, value]) => {
                                            const isUserAnswer = q.user_answer === key;
                                            const isCorrectAnswer = q.correct_answer === key;

                                            let bgColor = "bg-slate-50";
                                            let textColor = "text-slate-700";
                                            let borderColor = "border-slate-200";

                                            if (isCorrectAnswer) {
                                                bgColor = "bg-green-100";
                                                textColor = "text-green-800 font-bold";
                                                borderColor = "border-green-300 shadow-sm";
                                            } else if (isUserAnswer && !q.is_correct) {
                                                bgColor = "bg-red-100";
                                                textColor = "text-red-800 font-bold";
                                                borderColor = "border-red-300";
                                            }

                                            return (
                                                <div key={key} className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${bgColor} ${textColor} ${borderColor}`}>
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrectAnswer ? "bg-green-500 text-white" : isUserAnswer ? "bg-red-500 text-white" : "bg-slate-200 text-slate-500"
                                                        }`}>
                                                        {key}
                                                    </span>
                                                    <span className="flex-1">{value as string}</span>
                                                    {isCorrectAnswer && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                                                    {isUserAnswer && !q.is_correct && <XCircle className="h-4 w-4 flex-shrink-0" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="pt-8 text-center flex flex-col items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                        <Home className="mr-2 h-4 w-4" />
                        Return to Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ClientResults;
