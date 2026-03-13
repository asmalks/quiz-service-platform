import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Medal, Award, Clock, Target, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme, loading: themeLoading } = useClientTheme(clientSlug);

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
            case 2: return <Medal className="h-6 w-6 text-slate-400" />;
            case 3: return <Award className="h-6 w-6 text-amber-600" />;
            default: return <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{rank}</span>;
        }
    };

    if (themeLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background_color }}>
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: theme.primary_color }} />
                    <p className="text-lg font-medium text-muted-foreground">Loading leaderboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 font-malayalam relative" style={{ backgroundColor: theme.background_color }}>
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4 py-8 animate-fade-in">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-16 mx-auto object-contain animate-fade-in-scale mb-4" />
                    )}
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: theme.primary_color }}>
                            Leaderboard
                        </h1>
                        <p className="text-muted-foreground font-medium text-lg">{quizTitle}</p>
                    </div>
                </div>

                {/* Top 3 Podium */}
                {entries.length >= 3 && (
                    <div className="flex items-end justify-center gap-2 sm:gap-6 pb-8 px-2 animate-scale-in">
                        {/* 2nd Place */}
                        <div className="text-center flex-1 max-w-[140px] space-y-3">
                            <div className="relative inline-block">
                                <div
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto ring-4 ring-slate-200 shadow-xl"
                                    style={{ backgroundColor: getAvatarColor(entries[1].name) }}
                                >
                                    {getInitials(entries[1].name)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-slate-100 p-1.5 rounded-full border-2 shadow-sm">
                                    <Medal className="h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold truncate px-1">{entries[1].name}</p>
                                <p className="text-xs font-black uppercase tracking-wider" style={{ color: theme.primary_color }}>{entries[1].total_score} Pts</p>
                            </div>
                            <div className="h-20 sm:h-24 rounded-t-2xl shadow-inner-lg mt-2 relative overflow-hidden"
                                style={{ background: `linear-gradient(to bottom, ${theme.primary_color}20, ${theme.primary_color}05)` }}>
                                <div className="text-4xl font-black opacity-10 absolute bottom-2 left-1/2 -translate-x-1/2">2</div>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="text-center flex-1 max-w-[160px] space-y-3 -translate-y-4">
                            <div className="relative inline-block">
                                <div
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white font-black text-2xl mx-auto ring-8 ring-yellow-400 shadow-2xl animate-pulse"
                                    style={{ backgroundColor: getAvatarColor(entries[0].name) }}
                                >
                                    {getInitials(entries[0].name)}
                                </div>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Trophy className="h-8 w-8 text-yellow-500 drop-shadow-lg" />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-base font-black truncate px-1">{entries[0].name}</p>
                                <p className="text-sm font-black uppercase tracking-wider" style={{ color: theme.primary_color }}>{entries[0].total_score} Pts</p>
                            </div>
                            <div className="h-32 sm:h-40 rounded-t-2xl shadow-2xl mt-2 relative overflow-hidden border-t-4 border-yellow-400"
                                style={{ background: `linear-gradient(to bottom, ${theme.primary_color}40, ${theme.primary_color}10)` }}>
                                <div className="text-6xl font-black opacity-10 absolute bottom-4 left-1/2 -translate-x-1/2">1</div>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="text-center flex-1 max-w-[140px] space-y-3">
                            <div className="relative inline-block">
                                <div
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto ring-4 ring-amber-100 shadow-xl"
                                    style={{ backgroundColor: getAvatarColor(entries[2].name) }}
                                >
                                    {getInitials(entries[2].name)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-slate-100 p-1.5 rounded-full border-2 shadow-sm">
                                    <Award className="h-4 w-4 text-amber-600" />
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold truncate px-1">{entries[2].name}</p>
                                <p className="text-xs font-black uppercase tracking-wider" style={{ color: theme.primary_color }}>{entries[2].total_score} Pts</p>
                            </div>
                            <div className="h-16 sm:h-16 rounded-t-2xl shadow-inner mt-2 relative overflow-hidden"
                                style={{ background: `linear-gradient(to bottom, ${theme.primary_color}15, ${theme.primary_color}05)` }}>
                                <div className="text-4xl font-black opacity-10 absolute bottom-1 left-1/2 -translate-x-1/2">3</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full List */}
                <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
                    {entries.length === 0 ? (
                        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
                            <CardContent className="p-12 text-center space-y-4">
                                <Trophy className="h-16 w-16 text-slate-300 mx-auto" />
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-600">No Champions Yet</h3>
                                    <p className="text-muted-foreground">
                                        Be the first to complete the quiz and claim your spot!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry, index) => {
                                const rank = index + 1;
                                return (
                                    <Card
                                        key={entry.id}
                                        className={`group hover:shadow-xl transition-all hover:scale-[1.01] border-2 ${rank <= 3 ? "bg-white" : "border-slate-100"
                                            }`}
                                        style={rank <= 3 ? { borderColor: `${theme.primary_color}20` } : {}}
                                    >
                                        <CardContent className="flex items-center gap-4 p-4">
                                            <div className="w-10 flex items-center justify-center">
                                                {getRankIcon(rank)}
                                            </div>
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-inner group-hover:rotate-6 transition-transform"
                                                style={{ backgroundColor: getAvatarColor(entry.name) }}
                                            >
                                                {getInitials(entry.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-lg truncate group-hover:translate-x-1 transition-transform">{entry.name}</p>
                                                {entry.city && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{entry.city}</p>}
                                            </div>
                                            <div className="flex items-center gap-6 px-4">
                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 justify-center">
                                                        <Target className="h-4 w-4 opacity-40" style={{ color: theme.primary_color }} />
                                                        <span className="font-black text-lg" style={{ color: theme.primary_color }}>{entry.total_score}</span>
                                                    </div>
                                                    <div className="text-[10px] uppercase font-black text-muted-foreground">Score</div>
                                                </div>
                                                <div className="text-center hidden sm:block">
                                                    <div className="flex items-center gap-1 justify-center">
                                                        <Clock className="h-4 w-4 text-blue-500 opacity-40" />
                                                        <span className="font-bold">{entry.total_time_taken}s</span>
                                                    </div>
                                                    <div className="text-[10px] uppercase font-black text-muted-foreground">Time</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="pt-12 text-center space-y-6">
                    <Button variant="outline" size="lg" onClick={() => navigate(-1)} className="rounded-xl border-2 hover:bg-slate-50">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Results
                    </Button>
                    <div className="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <p className="text-xs font-bold uppercase tracking-[0.2em]">Powered by</p>
                        <span className="font-black text-xs uppercase" style={{ color: theme.primary_color }}>{theme.name}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientLeaderboardPage;
