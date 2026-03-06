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
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [timerPerQuestion, setTimerPerQuestion] = useState(10);
    const [randomizeQuestions, setRandomizeQuestions] = useState(false);
    const [randomizeOptions, setRandomizeOptions] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(true);
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

            setTitle(quiz.title);
            setDescription(quiz.description || "");
            setStartTime(new Date(quiz.start_time).toISOString().slice(0, 16));
            setEndTime(new Date(quiz.end_time).toISOString().slice(0, 16));
            setTimerPerQuestion(quiz.timer_per_question);
            setRandomizeQuestions(quiz.randomize_questions || false);
            setRandomizeOptions(quiz.randomize_options || false);
            setShowLeaderboard(quiz.show_leaderboard !== false);

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
        if (field.startsWith("option_")) {
            const key = field.replace("option_", "") as keyof Question["options"];
            updated[index].options[key] = value;
        } else {
            (updated[index] as any)[field] = value;
        }
        setQuestions(updated);
    };

    const handleSubmit = async (status: "draft" | "published") => {
        if (!title || !startTime || !endTime) {
            toast({ title: "Error", description: "Title, start time and end time are required", variant: "destructive" });
            return;
        }

        if (questions.some((q) => !q.question_text || !q.options.A || !q.options.B)) {
            toast({ title: "Error", description: "All questions must have text and at least options A and B", variant: "destructive" });
            return;
        }

        try {
            setSaving(true);
            const { data: { session: authSession } } = await supabase.auth.getSession();

            // Client admins use a service-level insert — we use the admin session's user_id if available,
            // otherwise use a placeholder for created_by since client admins don't have Supabase Auth
            const createdBy = authSession?.user?.id || "00000000-0000-0000-0000-000000000000";

            const quizData = {
                title,
                description: description || null,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                timer_per_question: timerPerQuestion,
                randomize_questions: randomizeQuestions,
                randomize_options: randomizeOptions,
                show_leaderboard: showLeaderboard,
                status,
                client_id: session.client_id,
                created_by: createdBy,
            };

            let savedQuizId = quizId;

            if (isEditing) {
                const { error } = await supabase
                    .from("quizzes")
                    .update(quizData)
                    .eq("id", quizId);
                if (error) throw error;

                // Delete old questions and re-insert
                await supabase.from("questions").delete().eq("quiz_id", quizId);
            } else {
                const { data, error } = await supabase
                    .from("quizzes")
                    .insert([quizData])
                    .select()
                    .single();
                if (error) throw error;
                savedQuizId = data.id;
            }

            // Insert questions
            const questionsToInsert = questions.map((q, i) => ({
                quiz_id: savedQuizId!,
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                order_index: i,
            }));

            const { error: qError } = await supabase
                .from("questions")
                .insert(questionsToInsert);
            if (qError) throw qError;

            toast({
                title: "Success",
                description: `Quiz ${isEditing ? "updated" : "created"} successfully`,
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
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Link to="/client/quizzes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {isEditing ? "Edit Quiz" : "Create Quiz"}
                    </h1>
                    <p className="text-muted-foreground">for {session.client_name}</p>
                </div>
            </div>

            {/* Quiz Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quiz description" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time *</Label>
                            <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>End Time *</Label>
                            <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Timer per Question (seconds)</Label>
                        <Input type="number" value={timerPerQuestion} onChange={(e) => setTimerPerQuestion(Number(e.target.value))} min={5} max={120} />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Switch checked={randomizeQuestions} onCheckedChange={setRandomizeQuestions} />
                            <Label>Randomize Questions</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={randomizeOptions} onCheckedChange={setRandomizeOptions} />
                            <Label>Randomize Options</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={showLeaderboard} onCheckedChange={setShowLeaderboard} />
                            <Label>Show Leaderboard</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Questions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Questions ({questions.length})</CardTitle>
                    <Button onClick={addQuestion} size="sm">
                        <Plus className="mr-1 h-3 w-3" />
                        Add Question
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="font-semibold">Question {index + 1}</Label>
                                {questions.length > 1 && (
                                    <Button variant="ghost" size="sm" onClick={() => removeQuestion(index)} className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <Input
                                value={q.question_text}
                                onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                                placeholder="Enter question text"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                {(["A", "B", "C", "D"] as const).map((key) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <span className={`text-sm font-bold w-6 ${q.correct_answer === key ? "text-green-600" : ""}`}>
                                            {key}
                                        </span>
                                        <Input
                                            value={q.options[key]}
                                            onChange={(e) => updateQuestion(index, `option_${key}`, e.target.value)}
                                            placeholder={`Option ${key}`}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Correct Answer</Label>
                                <div className="flex gap-2">
                                    {(["A", "B", "C", "D"] as const).map((key) => (
                                        <Button
                                            key={key}
                                            variant={q.correct_answer === key ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => updateQuestion(index, "correct_answer", key)}
                                        >
                                            {key}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                </Button>
                <Button onClick={() => handleSubmit("published")} disabled={saving} className="bg-primary hover:bg-primary-light">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Publish Quiz
                </Button>
            </div>
        </div>
    );
};

export default ClientCreateQuiz;
