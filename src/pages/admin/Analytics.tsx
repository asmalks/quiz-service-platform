import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp, Users, Target, AlertCircle } from "lucide-react";

interface QuizStats {
  quiz_title: string;
  total_participants: number;
  avg_score: number;
  completion_rate: number;
}

interface QuestionDifficulty {
  question_text: string;
  correct_rate: number;
  total_attempts: number;
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [quizStats, setQuizStats] = useState<QuizStats[]>([]);
  const [questionDifficulty, setQuestionDifficulty] = useState<QuestionDifficulty[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalParticipants: 0,
    avgCompletionRate: 0,
    avgScore: 0,
    dropOffRate: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000);

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      // Fetch quiz-level statistics
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          participants (
            id,
            total_score,
            end_time
          ),
          questions (
            id
          )
        `)
        .eq("status", "published");

      if (quizzes) {
        const stats: QuizStats[] = quizzes.map((quiz) => {
          const participants = quiz.participants || [];
          const completedParticipants = participants.filter((p) => p.end_time);
          const totalQuestions = quiz.questions?.length || 1;

          return {
            quiz_title: quiz.title.substring(0, 20) + (quiz.title.length > 20 ? "..." : ""),
            total_participants: participants.length,
            avg_score: participants.length > 0
              ? Math.round(
                  participants.reduce((sum, p) => sum + (p.total_score || 0), 0) /
                    participants.length /
                    totalQuestions *
                    100
                )
              : 0,
            completion_rate: participants.length > 0
              ? Math.round((completedParticipants.length / participants.length) * 100)
              : 0,
          };
        });
        setQuizStats(stats);

        // Calculate overall stats
        const totalParts = stats.reduce((sum, s) => sum + s.total_participants, 0);
        const avgComp = stats.length > 0
          ? stats.reduce((sum, s) => sum + s.completion_rate, 0) / stats.length
          : 0;
        const avgSc = stats.length > 0
          ? stats.reduce((sum, s) => sum + s.avg_score, 0) / stats.length
          : 0;

        setOverallStats({
          totalParticipants: totalParts,
          avgCompletionRate: Math.round(avgComp),
          avgScore: Math.round(avgSc),
          dropOffRate: Math.round(100 - avgComp),
        });
      }

      // Fetch question difficulty analysis
      const { data: questions } = await supabase
        .from("questions")
        .select(`
          id,
          question_text,
          responses (
            is_correct
          )
        `)
        .limit(10);

      if (questions) {
        const difficulty: QuestionDifficulty[] = questions
          .map((q) => {
            const responses = q.responses || [];
            const correctCount = responses.filter((r) => r.is_correct).length;
            return {
              question_text: q.question_text.substring(0, 30) + "...",
              correct_rate: responses.length > 0
                ? Math.round((correctCount / responses.length) * 100)
                : 0,
              total_attempts: responses.length,
            };
          })
          .filter((q) => q.total_attempts > 0)
          .sort((a, b) => a.correct_rate - b.correct_rate);

        setQuestionDifficulty(difficulty);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
          <div className="h-80 bg-muted rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-80 bg-muted rounded"></div>
            <div className="h-80 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive insights into quiz performance and user engagement</p>
      </div>

      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Participants
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.totalParticipants}</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-accent transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Completion Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.avgCompletionRate}%</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.avgScore}%</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-destructive transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drop-off Rate
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.dropOffRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Participants per Quiz */}
      <Card>
        <CardHeader>
          <CardTitle>Participants per Quiz</CardTitle>
          <CardDescription>Total participants who attempted each quiz</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quizStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="quiz_title" className="text-xs" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="total_participants" fill="hsl(var(--primary))" name="Participants" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Average Scores by Quiz</CardTitle>
            <CardDescription>Performance metrics across different quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={quizStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="quiz_title" className="text-xs" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg_score"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  name="Avg Score (%)"
                  dot={{ fill: "hsl(var(--accent))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Completion Rates</CardTitle>
            <CardDescription>Percentage of participants who completed each quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={quizStats.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ quiz_title, completion_rate }) => `${quiz_title}: ${completion_rate}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="completion_rate"
                >
                  {quizStats.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Question Difficulty Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Question Difficulty Analysis</CardTitle>
          <CardDescription>Success rate for each question (lower = harder)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={questionDifficulty} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="question_text" type="category" width={200} className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="correct_rate" fill="hsl(var(--primary))" name="Correct Rate (%)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
