import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Medal, Award, Clock, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvatarColor, getInitials } from "@/lib/avatarUtils";
import { ClientAdminSession } from "@/components/client/ClientAdminLayout";

interface LeaderboardEntry {
    id: string;
    name: string;
    total_score: number;
    total_time_taken: number;
    city: string | null;
}

interface Quiz {
    id: string;
    title: string;
}

const ClientLeaderboard = () => {
    const session = useOutletContext<ClientAdminSession>();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<string>("");
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchQuizzes();
    }, [session]);

    const fetchQuizzes = async () => {
        try {
            const { data, error } = await supabase
                .from("quizzes")
                .select("id, title")
                .eq("client_id", session.client_id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setQuizzes(data || []);
            if (data && data.length > 0) {
                setSelectedQuiz(data[0].id);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedQuiz) {
            fetchLeaderboard();
        }
    }, [selectedQuiz]);

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from("participants")
                .select("id, name, total_score, total_time_taken, city")
                .eq("quiz_id", selectedQuiz)
                .not("end_time", "is", null)
                .order("total_score", { ascending: false })
                .order("total_time_taken", { ascending: true })
                .limit(50);

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 2: return <Medal className="h-5 w-5 text-gray-400" />;
            case 3: return <Award className="h-5 w-5 text-amber-600" />;
            default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
                    <p className="text-muted-foreground">View quiz rankings</p>
                </div>
                {quizzes.length > 0 && (
                    <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select quiz" />
                        </SelectTrigger>
                        <SelectContent>
                            {quizzes.map((q) => (
                                <SelectItem key={q.id} value={q.id}>
                                    {q.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {entries.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Entries Yet</h3>
                        <p className="text-sm text-muted-foreground">
                            Participants will appear here after completing the quiz
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry, index) => {
                        const rank = index + 1;
                        return (
                            <Card key={entry.id} className={rank <= 3 ? "border-2 border-primary/20" : ""}>
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="w-8 flex items-center justify-center">
                                        {getRankIcon(rank)}
                                    </div>
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                        style={{ backgroundColor: getAvatarColor(entry.name) }}
                                    >
                                        {getInitials(entry.name)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{entry.name}</p>
                                        {entry.city && (
                                            <p className="text-xs text-muted-foreground">{entry.city}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Target className="h-4 w-4 text-green-500" />
                                            <span className="font-bold">{entry.total_score}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            <span>{entry.total_time_taken}s</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClientLeaderboard;
