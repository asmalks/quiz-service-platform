import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Medal, Award, Clock, Target } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/avatarUtils";
import { useClientTheme } from "@/hooks/use-client-theme";

interface LeaderboardEntry {
    id: string;
    name: string;
    total_score: number;
    total_time_taken: number;
    city: string | null;
}

const ClientLeaderboardPage = () => {
    const { clientSlug, quizId } = useParams();
    const { toast } = useToast();
    const { theme, loading: themeLoading, error: themeError } = useClientTheme(clientSlug);

    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [quizTitle, setQuizTitle] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (quizId) {
            fetchLeaderboard();
        }
    }, [quizId]);

    const fetchLeaderboard = async () => {
        try {
            const { data: quiz } = await supabase
                .from("quizzes")
                .select("title, show_leaderboard")
                .eq("id", quizId)
                .single();

            if (quiz) {
                setQuizTitle(quiz.title);
                if (quiz.show_leaderboard === false) {
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase
                .from("participants")
                .select("id, name, total_score, total_time_taken, city")
                .eq("quiz_id", quizId)
                .not("end_time", "is", null)
                .order("total_score", { ascending: false })
                .order("total_time_taken", { ascending: true })
                .limit(100);

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error("Error:", error);
            toast({ title: "Error", description: "Failed to load leaderboard", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
            case 2: return <Medal className="h-6 w-6 text-gray-400" />;
            case 3: return <Award className="h-6 w-6 text-amber-600" />;
            default: return <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{rank}</span>;
        }
    };

    if (themeLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background_color }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary_color }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4" style={{ backgroundColor: theme.background_color }}>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-3 py-6">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-14 mx-auto object-contain" />
                    )}
                    <h1 className="text-3xl font-bold" style={{ color: theme.primary_color }}>
                        🏆 Leaderboard
                    </h1>
                    <p className="text-lg" style={{ color: theme.secondary_color }}>
                        {quizTitle}
                    </p>
                </div>

                {/* Top 3 Podium */}
                {entries.length >= 3 && (
                    <div className="flex items-end justify-center gap-3 pb-4">
                        {/* 2nd Place */}
                        <div className="text-center flex-1 max-w-[120px]">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2"
                                style={{ backgroundColor: getAvatarColor(entries[1].name) }}
                            >
                                {getInitials(entries[1].name)}
                            </div>
                            <p className="text-sm font-semibold truncate">{entries[1].name}</p>
                            <p className="text-xs" style={{ color: theme.primary_color }}>{entries[1].total_score} pts</p>
                            <div className="h-16 rounded-t-lg mt-2" style={{ backgroundColor: `${theme.secondary_color}40` }}>
                                <Medal className="h-5 w-5 text-gray-400 mx-auto pt-2" />
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="text-center flex-1 max-w-[130px]">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2 ring-4 ring-yellow-300"
                                style={{ backgroundColor: getAvatarColor(entries[0].name) }}
                            >
                                {getInitials(entries[0].name)}
                            </div>
                            <p className="text-sm font-bold truncate">{entries[0].name}</p>
                            <p className="text-xs font-semibold" style={{ color: theme.primary_color }}>{entries[0].total_score} pts</p>
                            <div className="h-24 rounded-t-lg mt-2" style={{ backgroundColor: `${theme.primary_color}40` }}>
                                <Trophy className="h-6 w-6 text-yellow-500 mx-auto pt-2" />
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="text-center flex-1 max-w-[120px]">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2"
                                style={{ backgroundColor: getAvatarColor(entries[2].name) }}
                            >
                                {getInitials(entries[2].name)}
                            </div>
                            <p className="text-sm font-semibold truncate">{entries[2].name}</p>
                            <p className="text-xs" style={{ color: theme.primary_color }}>{entries[2].total_score} pts</p>
                            <div className="h-12 rounded-t-lg mt-2" style={{ backgroundColor: `${theme.secondary_color}30` }}>
                                <Award className="h-5 w-5 text-amber-600 mx-auto pt-2" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Full List */}
                {entries.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">No Entries Yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Leaderboard will appear after participants complete the quiz
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {entries.map((entry, index) => {
                            const rank = index + 1;
                            return (
                                <Card
                                    key={entry.id}
                                    className="hover:shadow-md transition-shadow"
                                    style={rank <= 3 ? { borderColor: theme.primary_color, borderWidth: "1px" } : {}}
                                >
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
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{entry.name}</p>
                                            {entry.city && <p className="text-xs text-muted-foreground">{entry.city}</p>}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Target className="h-4 w-4" style={{ color: theme.primary_color }} />
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

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">
                        Powered by Quiz Service Platform
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClientLeaderboardPage;
