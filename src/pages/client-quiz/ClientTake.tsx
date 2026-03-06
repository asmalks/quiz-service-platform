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

    useEffect(() => {
        fetchQuizData();
    }, [quizId]);

    const fetchQuizData = async () => {
        try {
            const { data: quiz } = await supabase
                .from("quizzes")
                .select("timer_per_question, randomize_questions, randomize_options")
                .eq("id", quizId)
                .single();

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
                let processedQuestions = [...questionsData] as Question[];

                if (quiz?.randomize_questions) {
                    processedQuestions.sort(() => Math.random() - 0.5);
                }

                if (quiz?.randomize_options) {
                    processedQuestions = processedQuestions.map((q) => {
                        const originalOptions = q.options as { A: string; B: string; C: string; D: string };
                        const keys = ["A", "B", "C", "D"] as const;
                        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
                        const newOptions: any = {};
                        const reverseKeyMapping: any = {};
                        shuffledKeys.forEach((origKey, i) => {
                            const newKey = keys[i];
                            newOptions[newKey] = originalOptions[origKey];
                            reverseKeyMapping[newKey] = origKey;
                        });
                        return { ...q, options: newOptions, reverseKeyMapping };
                    });
                }

                setQuestions(processedQuestions);
            }
        } catch (error) {
            console.error("Error:", error);
            toast({ title: "Error", description: "Failed to load quiz", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = useCallback(async () => {
        if (quizSubmitted || questions.length === 0) return;

        const currentQuestion = questions[currentQ];
        let actualAnswer = selectedAnswer || "";

        if (randomizeOptions && currentQuestion.reverseKeyMapping && selectedAnswer) {
            actualAnswer = currentQuestion.reverseKeyMapping[selectedAnswer] || selectedAnswer;
        }

        const timeTaken = timerPerQuestion - timeLeft;

        const response = {
            participant_id: participantId,
            quiz_id: quizId,
            question_id: currentQuestion.id,
            answer: actualAnswer,
            is_correct: false,
            time_taken: timeTaken,
        };

        const newResponses = [...responses, response];

        try {
            await supabase.from("responses").insert([response]);
        } catch (error) {
            console.error("Error saving response:", error);
        }

        if (currentQ + 1 < questions.length) {
            setResponses(newResponses);
            setCurrentQ(currentQ + 1);
            setSelectedAnswer(null);
            setTimeLeft(timerPerQuestion);
        } else {
            await submitQuiz(newResponses);
        }
    }, [currentQ, selectedAnswer, timeLeft, questions, responses, quizSubmitted]);

    const submitQuiz = async (allResponses: any[]) => {
        setQuizSubmitted(true);
        try {
            const totalTime = allResponses.reduce((sum, r) => sum + r.time_taken, 0);
            await supabase
                .from("participants")
                .update({
                    end_time: new Date().toISOString(),
                    total_time_taken: totalTime,
                    total_score: 0,
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
        if (loading || quizSubmitted || questions.length === 0) return;
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
    }, [loading, quizSubmitted, submitAnswer, timerPerQuestion, questions.length]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background_color }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary_color }} />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background_color }}>
                <Card><CardContent className="p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold">No Questions</h2>
                    <p className="text-muted-foreground">This quiz has no questions yet.</p>
                </CardContent></Card>
            </div>
        );
    }

    const currentQuestion = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen flex flex-col font-malayalam" style={{ backgroundColor: theme.background_color }}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between shadow-sm bg-white/40 backdrop-blur-md" style={{ borderBottom: `2px solid ${theme.primary_color}20` }}>
                <div className="flex items-center gap-3">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-8 object-contain" />
                    )}
                    <span className="font-semibold text-sm" style={{ color: theme.primary_color }}>{theme.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline">
                        {currentQ + 1} / {questions.length}
                    </Badge>
                    <div className="flex items-center gap-1">
                        <Clock className={`h-4 w-4 ${timeLeft <= 5 ? "text-red-500" : ""}`} />
                        <span className={`font-mono font-bold ${timeLeft <= 5 ? "text-red-500" : ""}`}>
                            {timeLeft}s
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <Progress value={progress} className="h-1 rounded-none" />

            {/* Question */}
            <div className="flex-1 flex items-center justify-center p-4">
                <Card key={currentQ} className="w-full max-w-2xl shadow-2xl animate-fade-in" style={{ borderColor: theme.primary_color, borderWidth: "2px" }}>
                    <CardContent className="p-6 space-y-6">
                        <h2 className="text-2xl font-bold leading-relaxed">{currentQuestion.question_text}</h2>

                        <div className="grid gap-3">
                            {(["A", "B", "C", "D"] as const).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedAnswer(key)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${selectedAnswer === key
                                        ? "text-white shadow-lg scale-[1.02]"
                                        : "hover:border-opacity-50 bg-white"
                                        }`}
                                    style={
                                        selectedAnswer === key
                                            ? { backgroundColor: theme.primary_color, borderColor: theme.primary_color }
                                            : { borderColor: `${theme.primary_color}30` }
                                    }
                                >
                                    <span className="font-bold mr-3">{key}.</span>
                                    {(currentQuestion.options as any)[key]}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={submitAnswer}
                            className="w-full text-white"
                            style={{ backgroundColor: theme.primary_color }}
                            disabled={!selectedAnswer}
                        >
                            {currentQ + 1 < questions.length ? "Next Question" : "Submit Quiz"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ClientTake;
