import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ClientAdminSession } from "@/components/client/ClientAdminLayout";
import { utcToISTInput, istInputToUTC } from "@/lib/dateUtils";

interface Question {
    id?: string;
    question_text: string;
    options: { A: string; B: string; C: string; D: string };
    correct_answer: string;
}

const ClientCreateQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const session = useOutletContext<ClientAdminSession>();
    const isEditing = !!quizId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [quizData, setQuizData] = useState({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        timer_per_question: 10,
        randomize_questions: false,
        randomize_options: false,
        show_leaderboard: true,
        whatsapp_required: false,
        badge_text: "",
        show_answer_review: true,
    });

    const [questions, setQuestions] = useState<Question[]>([
        {
            question_text: "",
            options: { A: "", B: "", C: "", D: "" },
            correct_answer: "A",
        },
    ]);

    useEffect(() => {
        if (isEditing) {
            fetchQuizData();
        }
    }, [quizId]);

    const fetchQuizData = async () => {
        try {
            setLoading(true);
            const { data: quiz, error: quizError } = await supabase
                .from("quizzes")
                .select("*")
                .eq("id", quizId)
                .eq("client_id", session.client_id)
                .single();

            if (quizError || !quiz) {
                toast({ title: "Error", description: "Quiz not found", variant: "destructive" });
                navigate("/client/quizzes");
                return;
            }

            setQuizData({
                title: quiz.title || "",
                description: quiz.description || "",
                start_time: quiz.start_time ? utcToISTInput(quiz.start_time) : "",
                end_time: quiz.end_time ? utcToISTInput(quiz.end_time) : "",
                timer_per_question: quiz.timer_per_question || 10,
                randomize_questions: quiz.randomize_questions || false,
                randomize_options: quiz.randomize_options || false,
                show_leaderboard: quiz.show_leaderboard !== false,
                whatsapp_required: (quiz as any).whatsapp_required || false,
                badge_text: (quiz as any).badge_text || "",
                show_answer_review: (quiz as any).show_answer_review ?? true,
            });

            const { data: questionsData } = await supabase
                .from("questions")
                .select("*")
                .eq("quiz_id", quizId)
                .order("order_index", { ascending: true });

            if (questionsData && questionsData.length > 0) {
                setQuestions(
                    questionsData.map((q) => ({
                        id: q.id,
                        question_text: q.question_text,
                        options: q.options as { A: string; B: string; C: string; D: string },
                        correct_answer: q.correct_answer,
                    }))
                );
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                question_text: "",
                options: { A: "", B: "", C: "", D: "" },
                correct_answer: "A",
            },
        ]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...questions];
        if (field === "question_text" || field === "correct_answer") {
            (updated[index] as any)[field] = value;
        } else {
            updated[index].options[field as keyof Question["options"]] = value;
        }
        setQuestions(updated);
    };

    const handleSubmit = async (status: "draft" | "published") => {
        if (!quizData.title.trim() || !quizData.start_time || !quizData.end_time) {
            toast({ title: "Error", description: "Title, start time and end time are required", variant: "destructive" });
            return;
        }

        if (questions.some((q) => !q.question_text || Object.values(q.options).some(o => !o))) {
            toast({ title: "Error", description: "Please complete all questions and options", variant: "destructive" });
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...quizData,
                start_time: istInputToUTC(quizData.start_time),
                end_time: istInputToUTC(quizData.end_time),
                status,
            };

            const questionsToInsert = questions.map((q, i) => ({
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                order_index: i + 1,
            }));

            // Use RPC to bypass standard RLS but validate admin session securely
            const { data: savedQuizId, error: rpcError } = await supabase.rpc("save_client_quiz", {
                p_admin_id: session.admin_id,
                p_client_id: session.client_id,
                p_quiz_id: isEditing ? quizId : null,
                p_quiz_data: payload,
                p_questions_data: questionsToInsert,
            });

            if (rpcError) throw rpcError;

            toast({
                title: "Success",
                description: `Quiz ${isEditing ? "updated" : "created"} and ${status === "published" ? "published" : "saved as draft"} successfully`,
            });
            navigate("/client/quizzes");
        } catch (error: any) {
            console.error("Error saving quiz:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save quiz",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/client/quizzes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {isEditing ? "Edit Quiz" : "Create New Quiz"}
                    </h1>
                    <p className="text-muted-foreground">for {session.client_name}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Quiz Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Daily Quiz - General Knowledge"
                                value={quizData.title}
                                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="badge_text">Badge Text (Default: QQuiz / Client Name)</Label>
                            <Input
                                id="badge_text"
                                placeholder="e.g., QQuiz"
                                value={quizData.badge_text}
                                onChange={(e) => setQuizData({ ...quizData, badge_text: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="timer">Timer per Question (seconds)</Label>
                            <Input
                                id="timer"
                                type="number"
                                min="5"
                                value={quizData.timer_per_question}
                                onChange={(e) =>
                                    setQuizData({ ...quizData, timer_per_question: parseInt(e.target.value) })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Quiz description..."
                            value={quizData.description}
                            onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Start Time (IST) *</Label>
                            <Input
                                id="start_time"
                                type="datetime-local"
                                value={quizData.start_time}
                                onChange={(e) => setQuizData({ ...quizData, start_time: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_time">End Time (IST) *</Label>
                            <Input
                                id="end_time"
                                type="datetime-local"
                                value={quizData.end_time}
                                onChange={(e) => setQuizData({ ...quizData, end_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="randomize-questions">Randomize Questions</Label>
                            <p className="text-xs text-muted-foreground">
                                Show questions in random order for each participant
                            </p>
                        </div>
                        <Switch
                            id="randomize-questions"
                            checked={quizData.randomize_questions}
                            onCheckedChange={(checked) =>
                                setQuizData({ ...quizData, randomize_questions: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="randomize-options">Randomize Options</Label>
                            <p className="text-xs text-muted-foreground">
                                Show answer options in random order
                            </p>
                        </div>
                        <Switch
                            id="randomize-options"
                            checked={quizData.randomize_options}
                            onCheckedChange={(checked) =>
                                setQuizData({ ...quizData, randomize_options: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-1">
                            <Label htmlFor="whatsapp-required">WhatsApp Mandatory</Label>
                            <p className="text-xs text-muted-foreground">
                                Require participants to enter their WhatsApp number
                            </p>
                        </div>
                        <Switch
                            id="whatsapp-required"
                            checked={quizData.whatsapp_required}
                            onCheckedChange={(checked) =>
                                setQuizData({ ...quizData, whatsapp_required: checked })
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-1">
                            <Label htmlFor="show-leaderboard">Show Leaderboard</Label>
                            <p className="text-xs text-muted-foreground">
                                Display this quiz's leaderboard publicly
                            </p>
                        </div>
                        <Switch
                            id="show-leaderboard"
                            checked={quizData.show_leaderboard}
                            onCheckedChange={(checked) =>
                                setQuizData({ ...quizData, show_leaderboard: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-1">
                            <Label htmlFor="show-answer-review">Show Answer Review</Label>
                            <p className="text-xs text-muted-foreground">
                                Allow participants to see correct answers and review their choices after the quiz
                            </p>
                        </div>
                        <Switch
                            id="show-answer-review"
                            checked={quizData.show_answer_review}
                            onCheckedChange={(checked) =>
                                setQuizData({ ...quizData, show_answer_review: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Questions ({questions.length})</CardTitle>
                    <Button onClick={addQuestion} variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {questions.map((question, qIndex) => (
                        <Card key={qIndex} className="border-2 shadow-none hover:border-primary/30 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <h3 className="font-semibold">Question {qIndex + 1}</h3>
                                {questions.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeQuestion(qIndex)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Question Text</Label>
                                    <Textarea
                                        placeholder="Enter your question..."
                                        value={question.question_text}
                                        onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(["A", "B", "C", "D"] as const).map((option) => (
                                        <div key={option} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Option {option}</Label>
                                                {question.correct_answer === option && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">CORRECT</span>
                                                )}
                                            </div>
                                            <Input
                                                placeholder={`Option ${option}`}
                                                value={question.options[option]}
                                                onChange={(e) => updateQuestion(qIndex, option, e.target.value)}
                                                className={question.correct_answer === option ? "border-green-500 focus-visible:ring-green-500" : ""}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Label>Correct Answer</Label>
                                    <div className="flex gap-2">
                                        {(["A", "B", "C", "D"] as const).map((key) => (
                                            <Button
                                                key={key}
                                                type="button"
                                                variant={question.correct_answer === key ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => updateQuestion(qIndex, "correct_answer", key)}
                                                className={question.correct_answer === key ? "bg-green-600 hover:bg-green-700" : ""}
                                            >
                                                {key}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                </Button>
                <Button onClick={() => handleSubmit("published")} disabled={saving} className="bg-primary hover:bg-primary-light min-w-[140px]">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isEditing ? "Update & Publish" : "Publish Quiz"}
                </Button>
            </div>
        </div>
    );
};

export default ClientCreateQuiz;
