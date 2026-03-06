import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Edit, Trash2, ExternalLink, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { formatToIST } from "@/lib/dateUtils";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: "draft" | "published" | "expired";
  created_at: string;
  show_leaderboard: boolean;
}

const QuizList = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Request Timeout",
        description: "Loading took too long. Please try again.",
        variant: "destructive",
      });
    }, 10000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz deleted successfully.",
      });

      fetchQuizzes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyShareLink = (quizId: string) => {
    const link = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Quiz link has been copied to clipboard.",
    });
  };

  const toggleLeaderboard = async (quizId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ show_leaderboard: !currentValue })
        .eq("id", quizId);

      if (error) throw error;

      setQuizzes(quizzes.map(q => 
        q.id === quizId ? { ...q, show_leaderboard: !currentValue } : q
      ));

      toast({
        title: "Success",
        description: `Leaderboard ${!currentValue ? "enabled" : "disabled"} for this quiz.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-primary text-primary-foreground";
      case "draft":
        return "bg-muted text-muted-foreground";
      case "expired":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Quizzes</h1>
          <p className="text-muted-foreground">Create, edit, and manage your quizzes</p>
        </div>
        <Link to="/admin/quizzes/create">
          <Button className="bg-primary hover:bg-primary-light">
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No quizzes found. Create your first quiz!</p>
            <Link to="/admin/quizzes/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      <Badge className={getStatusColor(quiz.status)}>
                        {quiz.status.toUpperCase()}
                      </Badge>
                    </div>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground">{quiz.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyShareLink(quiz.id)}
                      title="Copy share link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Link to={`/admin/quizzes/edit/${quiz.id}`}>
                      <Button variant="ghost" size="icon" title="Edit quiz">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteQuiz(quiz.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete quiz"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Start:</span>{" "}
                    {formatToIST(quiz.start_time)}
                  </div>
                  <div>
                    <span className="font-medium">End:</span>{" "}
                    {formatToIST(quiz.end_time)}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {formatToIST(quiz.created_at, "date")}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Link to={`/quiz/${quiz.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-3 w-3" />
                      View Quiz
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className={`h-4 w-4 ${quiz.show_leaderboard ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-muted-foreground">Leaderboard</span>
                    <Switch
                      checked={quiz.show_leaderboard ?? true}
                      onCheckedChange={() => toggleLeaderboard(quiz.id, quiz.show_leaderboard ?? true)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList;
