import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { utcToISTInput, istInputToUTC } from "@/lib/dateUtils";

interface Question {
  id?: string;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
}

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const isEditMode = !!quizId;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(isEditMode);

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
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: "",
      options: { A: "", B: "", C: "", D: "" },
      correct_answer: "A",
    },
  ]);

  useEffect(() => {
    if (isEditMode) {
      fetchQuizData();
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizError) throw quizError;

       setQuizData({
        title: quiz.title || "",
        description: quiz.description || "",
        start_time: quiz.start_time ? utcToISTInput(quiz.start_time) : "",
        end_time: quiz.end_time ? utcToISTInput(quiz.end_time) : "",
        timer_per_question: quiz.timer_per_question || 10,
        randomize_questions: quiz.randomize_questions || false,
        randomize_options: quiz.randomize_options || false,
        show_leaderboard: quiz.show_leaderboard ?? true,
        whatsapp_required: (quiz as any).whatsapp_required || false,
        badge_text: (quiz as any).badge_text || "",
      });

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/admin/quizzes");
    } finally {
      setLoadingQuiz(false);
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
      updated[index][field] = value;
    } else {
      updated[index].options[field as keyof typeof updated[0]["options"]] = value;
    }
    setQuestions(updated);
  };

  const handleSubmit = async (status: "draft" | "published") => {
    setLoading(true);

    try {
      // Validate
      if (!quizData.title || !quizData.start_time || !quizData.end_time) {
        throw new Error("Please fill in all required fields");
      }

      if (questions.some((q) => !q.question_text || Object.values(q.options).some((o) => !o))) {
        throw new Error("Please complete all questions and options");
      }

      if (isEditMode) {
        // Update existing quiz
        const { error: quizError } = await supabase
          .from("quizzes")
          .update({
            title: quizData.title,
            description: quizData.description,
            start_time: istInputToUTC(quizData.start_time),
            end_time: istInputToUTC(quizData.end_time),
            timer_per_question: quizData.timer_per_question,
            randomize_questions: quizData.randomize_questions,
            randomize_options: quizData.randomize_options,
            show_leaderboard: quizData.show_leaderboard,
            whatsapp_required: quizData.whatsapp_required,
            badge_text: quizData.badge_text,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", quizId);

        if (quizError) throw quizError;

        // Delete existing questions and insert new ones
        const { error: deleteError } = await supabase
          .from("questions")
          .delete()
          .eq("quiz_id", quizId);

        if (deleteError) throw deleteError;

        const questionsWithQuizId = questions.map((q, index) => ({
          quiz_id: quizId,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          order_index: index + 1,
        }));

        const { error: questionsError } = await supabase
          .from("questions")
          .insert(questionsWithQuizId);

        if (questionsError) throw questionsError;

        toast({
          title: "Success!",
          description: `Quiz updated and ${status === "published" ? "published" : "saved as draft"} successfully.`,
        });
      } else {
        // Create new quiz
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            title: quizData.title,
            description: quizData.description,
            start_time: istInputToUTC(quizData.start_time),
            end_time: istInputToUTC(quizData.end_time),
            timer_per_question: quizData.timer_per_question,
            randomize_questions: quizData.randomize_questions,
            randomize_options: quizData.randomize_options,
            show_leaderboard: quizData.show_leaderboard,
            whatsapp_required: quizData.whatsapp_required,
            badge_text: quizData.badge_text,
            status,
            created_by: user.id,
          })
          .select()
          .single();

        if (quizError) throw quizError;

        const questionsWithQuizId = questions.map((q, index) => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          order_index: index + 1,
        }));

        const { error: questionsError } = await supabase
          .from("questions")
          .insert(questionsWithQuizId);

        if (questionsError) throw questionsError;

        toast({
          title: "Success!",
          description: `Quiz ${status === "published" ? "published" : "saved as draft"} successfully.`,
        });
      }

      navigate("/admin/quizzes");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingQuiz) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? "Edit Quiz" : "Create New Quiz"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Update the quiz details and questions" : "Fill in the details to create a new quiz"}
          </p>
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
                placeholder="e.g., Daily Quiz - Kerala GK"
                value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badge_text">Badge Text (Default: QQuiz)</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions</CardTitle>
          <Button onClick={addQuestion} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, qIndex) => (
            <Card key={qIndex} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <h3 className="font-semibold">Question {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-destructive hover:text-destructive"
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
                      <Label>Option {option}</Label>
                      <Input
                        placeholder={`Option ${option}`}
                        value={question.options[option]}
                        onChange={(e) => updateQuestion(qIndex, option, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={question.correct_answer}
                    onChange={(e) => updateQuestion(qIndex, "correct_answer", e.target.value)}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" />
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit("published")}
          disabled={loading}
          className="bg-primary hover:bg-primary-light"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEditMode ? "Update & Publish" : "Publish Quiz"}
        </Button>
      </div>
    </div>
  );
};

export default CreateQuiz;
