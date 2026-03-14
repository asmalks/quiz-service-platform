import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Medal, Award, Clock, Target, Home, Info } from "lucide-react";
import { getAvatarColor, getInitials } from "@/lib/avatarUtils";

interface LeaderboardEntry {
  id: string;
  name: string;
  total_score: number;
  total_time_taken: number;
  city: string | null;
}

interface QuizInfo {
  id: string;
  title: string;
  description: string | null;
  show_leaderboard: boolean | null;
}

const Leaderboard = () => {
  const { quizId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(quizId || null);
  const [leaderboardDisabled, setLeaderboardDisabled] = useState(false);

  useEffect(() => {
    if (quizId) {
      setActiveQuizId(quizId);
    } else {
      // Fetch the latest quiz with visible leaderboard
      fetchLatestQuizWithLeaderboard();
    }
  }, [quizId]);

  useEffect(() => {
    if (activeQuizId) {
      fetchLeaderboard();

      // Set up realtime subscription
      const channel = supabase
        .channel("leaderboard-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "participants",
            filter: `quiz_id=eq.${activeQuizId}`,
          },
          () => {
            fetchLeaderboard();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeQuizId]);

  const fetchLatestQuizWithLeaderboard = async () => {
    try {
      const { data: quiz, error } = await supabase
        .from("quizzes")
        .select("id, title, description, show_leaderboard")
        .eq("status", "published")
        .eq("show_leaderboard", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (quiz) {
        setActiveQuizId(quiz.id);
        setQuizInfo(quiz);
      } else {
        // Fallback: get any latest published quiz
        const { data: fallbackQuiz } = await supabase
          .from("quizzes")
          .select("id, title, description, show_leaderboard")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackQuiz) {
          setActiveQuizId(fallbackQuiz.id);
          setQuizInfo(fallbackQuiz);
          if (!fallbackQuiz.show_leaderboard) {
            setLeaderboardDisabled(true);
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching quiz:", error);
    } finally {
      if (!activeQuizId) setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      if (activeQuizId && !quizInfo) {
        const { data: quiz } = await supabase
          .from("quizzes")
          .select("id, title, description, show_leaderboard")
          .eq("id", activeQuizId)
          .maybeSingle();

        if (quiz) {
          setQuizInfo(quiz);
          if (!quiz.show_leaderboard) {
            setLeaderboardDisabled(true);
            setLoading(false);
            return;
          }
        }
      }

      // Check if leaderboard is disabled
      if (quizInfo && !quizInfo.show_leaderboard) {
        setLeaderboardDisabled(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("participants")
        .select("id, name, total_score, total_time_taken, city")
        .eq("quiz_id", activeQuizId!)
        .not("end_time", "is", null)
        .order("total_score", { ascending: false })
        .order("total_time_taken", { ascending: true });

      if (error) throw error;

      setEntries(data || []);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-400" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  // Pastel colors for top 3 ranks
  const getTopRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 shadow-amber-100";
      case 2:
        return "bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-slate-100";
      case 3:
        return "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 shadow-orange-100";
      default:
        return "";
    }
  };

  const getListItemStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200";
      case 2:
        return "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200";
      case 3:
        return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
      default:
        return "border-border hover:border-primary/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeQuizId || !quizInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Leaderboard Available</h2>
            <p className="text-muted-foreground mb-6">There's no active quiz leaderboard to display at the moment.</p>
            <Link to="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (leaderboardDisabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <Clock className="w-12 h-12 mx-auto text-primary mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Leaderboard Coming Soon</h2>
            <p className="text-muted-foreground mb-2">{quizInfo?.title}</p>
            <p className="text-muted-foreground mb-6">The leaderboard will be updated shortly. Please check back later!</p>
            <Link to="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header with Quiz Info */}
        <Card className="border-2 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Leaderboard</h1>
                  <p className="text-sm font-medium text-primary">{quizInfo.title}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs sm:text-sm font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="font-bold">{entries.length}</span>
                <span>Players</span>
              </div>
            </div>
            {quizInfo.description && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{quizInfo.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Winners Podium - Robust for 1, 2, or 3 players */}
        {entries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Mobile: Stack vertically with horizontal cards */}
            {/* Desktop: Keep podium style */}

            {/* 1st Place - Always first on mobile */}
            <Card className={`sm:order-2 border-2 ${getTopRankStyle(1)} shadow-lg`}>
              <CardContent className="p-4">
                <div className="flex sm:flex-col items-center gap-4 sm:gap-2 sm:text-center">
                  <div className="relative">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${getAvatarColor(entries[0].name)} flex items-center justify-center text-xl sm:text-2xl font-bold text-foreground border-3 border-amber-400 shadow-lg`}>
                      {getInitials(entries[0].name)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 sm:left-1/2 sm:-translate-x-1/2 sm:-bottom-2 bg-amber-100 rounded-full p-1.5 border-2 border-amber-300">
                      <Trophy className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1 sm:flex-none sm:mt-2">
                    <p className="font-bold text-base sm:text-lg text-foreground">{entries[0].name}</p>
                    {entries[0].city && (
                      <p className="text-xs text-muted-foreground">{entries[0].city}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 sm:justify-center">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-lg text-amber-700">{entries[0].total_score}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="text-sm">{entries[0].total_time_taken}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
 
             {/* 2nd Place */}
             {entries.length >= 2 && (
               <Card className={`sm:order-1 border-2 ${getTopRankStyle(2)} sm:mt-6`}>
                 <CardContent className="p-4">
                   <div className="flex sm:flex-col items-center gap-4 sm:gap-2 sm:text-center">
                     <div className="relative">
                       <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${getAvatarColor(entries[1].name)} flex items-center justify-center text-lg sm:text-xl font-bold text-foreground border-3 border-slate-300 shadow-md`}>
                         {getInitials(entries[1].name)}
                       </div>
                       <div className="absolute -bottom-1 -right-1 sm:left-1/2 sm:-translate-x-1/2 sm:-bottom-2 bg-slate-100 rounded-full p-1.5 border-2 border-slate-300">
                         <Medal className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                       </div>
                     </div>
                     <div className="flex-1 sm:flex-none sm:mt-2">
                       <p className="font-bold text-sm sm:text-base text-foreground">{entries[1].name}</p>
                       {entries[1].city && (
                         <p className="text-xs text-muted-foreground">{entries[1].city}</p>
                       )}
                       <div className="flex items-center gap-3 mt-1 sm:justify-center">
                         <div className="flex items-center gap-1">
                           <Target className="w-3 h-3 text-slate-500" />
                           <span className="font-bold text-base text-slate-600">{entries[1].total_score}</span>
                         </div>
                         <div className="flex items-center gap-1 text-muted-foreground">
                           <Clock className="w-3 h-3" />
                           <span className="text-sm">{entries[1].total_time_taken || 0}s</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             )}
 
             {/* 3rd Place */}
             {entries.length >= 3 && (
               <Card className={`sm:order-3 border-2 ${getTopRankStyle(3)} sm:mt-6`}>
                 <CardContent className="p-4">
                   <div className="flex sm:flex-col items-center gap-4 sm:gap-2 sm:text-center">
                     <div className="relative">
                       <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${getAvatarColor(entries[2].name)} flex items-center justify-center text-lg sm:text-xl font-bold text-foreground border-3 border-orange-300 shadow-md`}>
                         {getInitials(entries[2].name)}
                       </div>
                       <div className="absolute -bottom-1 -right-1 sm:left-1/2 sm:-translate-x-1/2 sm:-bottom-2 bg-orange-100 rounded-full p-1.5 border-2 border-orange-300">
                         <Award className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                       </div>
                     </div>
                     <div className="flex-1 sm:flex-none sm:mt-2">
                       <p className="font-bold text-sm sm:text-base text-foreground">{entries[2].name}</p>
                       {entries[2].city && (
                         <p className="text-xs text-muted-foreground">{entries[2].city}</p>
                       )}
                       <div className="flex items-center gap-3 mt-1 sm:justify-center">
                         <div className="flex items-center gap-1">
                           <Target className="w-3 h-3 text-orange-500" />
                           <span className="font-bold text-base text-orange-600">{entries[2].total_score}</span>
                         </div>
                         <div className="flex items-center gap-1 text-muted-foreground">
                           <Clock className="w-3 h-3" />
                           <span className="text-sm">{entries[2].total_time_taken || 0}s</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             )}
          </div>
        )}

        {/* Full Leaderboard List */}
        <Card>
          <CardContent className="p-4">
            {entries.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No participants yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, idx) => {
                  const rank = idx + 1;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${getListItemStyle(rank)}`}
                    >
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(entry.name)} flex items-center justify-center text-sm font-bold text-foreground shadow-sm`}>
                          {getInitials(entry.name)}
                        </div>
                        <div className="w-6 flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-foreground">
                          {entry.name}
                        </p>
                        {entry.city && (
                          <p className="text-xs truncate text-muted-foreground">
                            {entry.city}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="font-bold text-primary">
                            {entry.total_score}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            pts
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-sm font-medium text-accent">
                            {entry.total_time_taken}s
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center pt-2">
          <Link to="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
