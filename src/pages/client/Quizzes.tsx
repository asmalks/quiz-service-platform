import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Copy, Pencil } from "lucide-react";
import { ClientAdminSession } from "@/components/client/ClientAdminLayout";

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    status: string;
    start_time: string;
    end_time: string;
}

const ClientQuizzes = () => {
    const session = useOutletContext<ClientAdminSession>();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchQuizzes();
    }, [session]);

    const fetchQuizzes = async () => {
        try {
            const { data, error } = await supabase
                .from("quizzes")
                .select("id, title, description, status, start_time, end_time")
                .eq("client_id", session.client_id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setQuizzes(data || []);
        } catch (error) {
            console.error("Error fetching quizzes:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyQuizUrl = (quizId: string) => {
        const url = `${window.location.origin}/quiz/${session.client_slug}/${quizId}`;
        navigator.clipboard.writeText(url);
        toast({ title: "Copied!", description: "Quiz URL copied to clipboard" });
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quizzes</h1>
                    <p className="text-muted-foreground">Manage your quiz campaigns</p>
                </div>
                <Link to="/client/quizzes/create">
                    <Button className="bg-primary hover:bg-primary-light">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quiz
                    </Button>
                </Link>
            </div>

            {quizzes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <h3 className="text-lg font-semibold">No Quizzes Yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create your first quiz to get started
                        </p>
                        <Link to="/client/quizzes/create" className="mt-4">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Quiz
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {quizzes.map((quiz) => (
                        <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold">{quiz.title}</h3>
                                    {quiz.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {quiz.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(quiz.start_time).toLocaleString()} —{" "}
                                        {new Date(quiz.end_time).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <Badge
                                        variant={
                                            quiz.status === "published"
                                                ? "default"
                                                : quiz.status === "draft"
                                                    ? "secondary"
                                                    : "outline"
                                        }
                                    >
                                        {quiz.status}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyQuizUrl(quiz.id)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <Link to={`/client/quizzes/edit/${quiz.id}`}>
                                        <Button variant="outline" size="sm">
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientQuizzes;
