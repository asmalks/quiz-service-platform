import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClientTheme } from "@/hooks/use-client-theme";

interface Question {
    id: string;
    question_text: string;
    options: { A: string; B: string; C: string; D: string };
    order_index: number;
    reverseKeyMapping?: { [shuffledKey: string]: string };
}

const ClientTake = () => {
    const { clientSlug, quizId, participantId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme } = useClientTheme(clientSlug);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(10);
    const [timerPerQuestion, setTimerPerQuestion] = useState(10);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState<any[]>([]);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [randomizeOptions, setRandomizeOptions] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [questionTransition, setQuestionTransition] = useState(false);
    const [isAnswering, setIsAnswering] = useState(false);
    const [quiz, setQuiz] = useState<any>(null);

    useEffect(() => {
        fetchQuizData();
    }, [quizId]);

    const fetchQuizData = async () => {
        try {
            const { data: quiz } = await supabase
                .from("quizzes")
                .select("timer_per_question, randomize_questions, randomize_options, badge_text")
                .eq("id", quizId)
                .single() as any;

            if (quiz) {
                setTimerPerQuestion(quiz.timer_per_question);
                setTimeLeft(quiz.timer_per_question);
                setRandomizeOptions(quiz.randomize_options || false);
            }

            const { data: questionsData } = await supabase
                .from("questions_public")
                .select("id, question_text, options, order_index")
                .eq("quiz_id", quizId)
                .order("order_index", { ascending: true });

            if (questionsData) {
                let processedQuestions = questionsData.map(q => ({
                    ...q,
                    options: q.options as { A: string; B: string; C: string; D: string },
                })) as Question[];

                if (quiz?.randomize_questions) {
                    processedQuestions = [...processedQuestions].sort(() => Math.random() - 0.5);
                }

                if (quiz?.randomize_options) {
                    processedQuestions = processedQuestions.map((q) => {
                        const originalOptions = q.options as { A: string; B: string; C: string; D: string };
                        const keys = Object.keys(originalOptions) as (keyof typeof originalOptions)[];
                        
                        for (let i = keys.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [keys[i], keys[j]] = [keys[j], keys[i]];
                        }
                        
                        const newOptions: any = {};
                        const reverseMapping: any = {};

                        keys.forEach((originalKey, idx) => {
                            const newKey = String.fromCharCode(65 + idx);
                            newOptions[newKey] = originalOptions[originalKey];
                            reverseMapping[newKey] = originalKey;
                        });

                        return {
                            ...q,
                            options: newOptions,
                            reverseKeyMapping: reverseMapping,
                        };
                    });
                }

                setQuestions(processedQuestions);
                setQuiz(quiz);
            }
        } catch (error) {
            console.error("Error:", error);
            toast({ title: "Error", description: "Failed to load quiz", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = useCallback(async () => {
        if (quizSubmitted || questions.length === 0 || isAnswering) return;

        setIsAnswering(true);
        const currentQuestion = questions[currentQ];
        let actualAnswer = selectedAnswer || "";

        if (currentQuestion.reverseKeyMapping && selectedAnswer) {
            actualAnswer = currentQuestion.reverseKeyMapping[selectedAnswer] || selectedAnswer;
        }

        const timeTaken = Math.max(0, timerPerQuestion - timeLeft);

        const response = {
            participant_id: participantId,
            quiz_id: quizId,
            question_id: currentQuestion.id,
            answer: actualAnswer,
            is_correct: false,
            time_taken: timeTaken,
        };

        const newResponses = [...responses, response];
        setResponses(newResponses);

        try {
            await supabase.from("responses").insert([response]);
        } catch (error) {
            console.error("Error saving response:", error);
        }

        if (currentQ + 1 < questions.length) {
            setQuestionTransition(true);
            setTimeout(() => {
                setCurrentQ(currentQ + 1);
                setSelectedAnswer(null);
                setTimeLeft(timerPerQuestion);
                setQuestionTransition(false);
                setIsAnswering(false);
            }, 300);
        } else {
            setShowCelebration(true);
            setTimeout(async () => {
                await submitQuiz(newResponses);
            }, 1500);
        }
    }, [currentQ, selectedAnswer, timeLeft, questions, responses, quizSubmitted, isAnswering, timerPerQuestion]);

    const submitQuiz = async (allResponses: any[]) => {
        setQuizSubmitted(true);
        try {
            const totalTime = allResponses.reduce((sum, r) => sum + r.time_taken, 0);
            await supabase
                .from("participants")
                .update({
                    end_time: new Date().toISOString(),
                    total_time_taken: totalTime,
                    // Score is calculated on Results page or by trigger
                })
                .eq("id", participantId);

            navigate(`/quiz/${clientSlug}/${quizId}/results/${participantId}`);
        } catch (error) {
            console.error("Error:", error);
            toast({ title: "Error", description: "Failed to submit quiz", variant: "destructive" });
        }
    };

    // Timer
    useEffect(() => {
        if (loading || quizSubmitted || questions.length === 0 || isAnswering || showCelebration) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    submitAnswer();
                    return timerPerQuestion;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, quizSubmitted, submitAnswer, timerPerQuestion, questions.length, isAnswering, showCelebration]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background_color }}>
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: theme.primary_color }} />
                    <p className="text-lg font-medium text-muted-foreground">Preparing your quiz...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.background_color }}>
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                        <h2 className="text-xl font-bold">No Questions</h2>
                        <p className="text-muted-foreground">This quiz has no questions yet. Please check back later.</p>
                        <Button className="w-full" variant="outline" onClick={() => navigate("/")}>Go Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen flex flex-col font-malayalam relative" style={{ backgroundColor: theme.background_color }}>
            {/* Celebration Overlay */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="text-center space-y-6 animate-scale-in">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full flex items-center justify-center shadow-2xl animate-pulse"
                            style={{ background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color})` }}>
                            <span className="text-4xl sm:text-6xl">🎉</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white">Quiz Complete!</h2>
                            <p className="text-white/80">Great job! Redirecting to your results...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 flex items-center justify-between shadow-sm bg-white/60 backdrop-blur-md sticky top-0 z-10"
                style={{ borderBottom: `2px solid ${theme.primary_color}20` }}>
                <div className="flex items-center gap-3">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-8 object-contain" />
                    )}
                    <span className="font-bold hidden sm:inline" style={{ color: theme.primary_color }}>
                        {(quiz as any)?.badge_text || theme.badge_text || theme.name}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="px-3 py-1 font-semibold">
                        {currentQ + 1} / {questions.length}
                    </Badge>
                    <div className="flex items-center gap-2 bg-background/80 rounded-full px-4 py-1.5 border shadow-sm">
                        <Clock className={`h-4 w-4 ${timeLeft <= 3 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                        <span className={`font-mono font-bold text-xl tabular-nums ${timeLeft <= 3 ? "text-destructive" : ""}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5">
                <div
                    className="h-full transition-all duration-300 ease-out"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: theme.primary_color
                    }}
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className={`w-full max-w-2xl shadow-2xl transition-all duration-300 ${questionTransition ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                    style={{ borderColor: theme.primary_color, borderWidth: "2px" }}>
                    <CardContent className="p-6 sm:p-10 space-y-8">
                        <div className="text-center">
                            <h2 className="text-xl sm:text-2xl font-bold leading-relaxed">
                                {currentQuestion.question_text}
                            </h2>
                        </div>

                        <div className="grid gap-4">
                            {(["A", "B", "C", "D"] as const).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedAnswer(key)}
                                    disabled={isAnswering}
                                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${selectedAnswer === key
                                            ? "text-white shadow-lg scale-[1.02]"
                                            : "bg-white hover:border-opacity-50 hover:shadow-md"
                                        }`}
                                    style={
                                        selectedAnswer === key
                                            ? { backgroundColor: theme.primary_color, borderColor: theme.primary_color }
                                            : { borderColor: `${theme.primary_color}20` }
                                    }
                                >
                                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 transition-colors ${selectedAnswer === key ? "bg-white/20" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                        }`}>
                                        {key}
                                    </span>
                                    <span className="text-base sm:text-lg font-medium">
                                        {(currentQuestion.options as any)[key]}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={submitAnswer}
                            size="lg"
                            className="w-full h-14 sm:h-16 text-white text-lg font-bold rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
                            style={{ backgroundColor: theme.primary_color }}
                            disabled={!selectedAnswer || isAnswering}
                        >
                            {isAnswering ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {currentQ + 1 < questions.length ? "Next Question" : "Complete Quiz"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ClientTake;
