import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Filter, Trophy, Calendar, MapPin, Target, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getAvatarColor, getInitials } from "@/lib/avatarUtils";

interface ParticipantData {
  id: string;
  name: string;
  city: string | null;
  whatsapp: string | null;
  total_score: number;
  total_time_taken: number;
  created_at: string;
  quiz_id: string;
  quiz_title: string;
  total_questions: number;
  rank: number;
}

interface Quiz {
  id: string;
  title: string;
}

const AdminLeaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<ParticipantData[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const { toast } = useToast();

  // Filter states
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [scoreThreshold, setScoreThreshold] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [participants, selectedQuiz, startDate, endDate, cityFilter, scoreThreshold]);

  const fetchData = async () => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Request Timeout",
        description: "Loading took too long. Please try again.",
        variant: "destructive",
      });
    }, 10000);

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      // Fetch all quizzes
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("id, title")
        .order("created_at", { ascending: false });

      if (quizzesData) {
        setQuizzes(quizzesData);
      }

      // Fetch all participants with quiz details
      const { data: participantsData } = await supabase
        .from("participants")
        .select(`
          id,
          name,
          city,
          whatsapp,
          total_score,
          total_time_taken,
          created_at,
          quiz_id,
          quizzes (
            title,
            questions (id)
          )
        `)
        .not("end_time", "is", null)
        .order("total_score", { ascending: false })
        .order("total_time_taken", { ascending: true });

      if (participantsData) {
        const formattedData: ParticipantData[] = participantsData.map((p: any, index) => ({
          id: p.id,
          name: p.name,
          city: p.city,
          whatsapp: p.whatsapp,
          total_score: p.total_score || 0,
          total_time_taken: p.total_time_taken || 0,
          created_at: p.created_at,
          quiz_id: p.quiz_id,
          quiz_title: p.quizzes?.title || "Unknown Quiz",
          total_questions: p.quizzes?.questions?.length || 0,
          rank: index + 1,
        }));
        setParticipants(formattedData);
        setFilteredParticipants(formattedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...participants];

    // Quiz filter
    if (selectedQuiz !== "all") {
      filtered = filtered.filter((p) => p.quiz_id === selectedQuiz);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(
        (p) => new Date(p.created_at) >= new Date(startDate)
      );
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (p) => new Date(p.created_at) <= endDateTime
      );
    }

    // City filter
    if (cityFilter) {
      filtered = filtered.filter((p) =>
        p.city?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Score threshold filter
    if (scoreThreshold) {
      const threshold = parseInt(scoreThreshold);
      filtered = filtered.filter((p) => p.total_score >= threshold);
    }

    // Re-rank after filtering
    filtered = filtered
      .sort((a, b) => {
        if (b.total_score !== a.total_score) {
          return b.total_score - a.total_score;
        }
        return a.total_time_taken - b.total_time_taken;
      })
      .map((p, index) => ({ ...p, rank: index + 1 }));

    setFilteredParticipants(filtered);
  };

  const exportToCSV = () => {
    if (filteredParticipants.length === 0) {
      toast({
        title: "No Data",
        description: "No participants to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Rank",
      "Name",
      "Quiz",
      "Score",
      "Time Taken (s)",
      "Percentage",
      "City",
      "WhatsApp",
      "Date",
    ];

    const rows = filteredParticipants.map((p) => [
      p.rank,
      p.name,
      p.quiz_title,
      p.total_score,
      p.total_time_taken,
      p.total_questions > 0
        ? `${Math.round((p.total_score / p.total_questions) * 100)}%`
        : "0%",
      p.city || "N/A",
      p.whatsapp || "N/A",
      format(new Date(p.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `leaderboard_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: `Exported ${filteredParticipants.length} participants to CSV`,
    });
  };

  const clearFilters = () => {
    setSelectedQuiz("all");
    setStartDate("");
    setEndDate("");
    setCityFilter("");
    setScoreThreshold("");
  };

  const deleteParticipant = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete participant "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Participant deleted successfully",
      });

      // Update local state
      setParticipants(participants.filter(p => p.id !== id));
      setFilteredParticipants(filteredParticipants.filter(p => p.id !== id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete participant",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700 text-white">🥉 3rd</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Admin Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Manage and export participant performance data
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          className="bg-primary hover:bg-primary-light"
          disabled={filteredParticipants.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export to CSV ({filteredParticipants.length})
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          <CardDescription>
            Filter participants by quiz, date range, city, or score threshold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-filter" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Quiz
              </Label>
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger id="quiz-filter">
                  <SelectValue placeholder="All Quizzes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quizzes</SelectItem>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city-filter" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                City
              </Label>
              <Input
                id="city-filter"
                type="text"
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="score-filter" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Minimum Score
              </Label>
              <Input
                id="score-filter"
                type="number"
                placeholder="Minimum score..."
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(e.target.value)}
                min="0"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Leaderboard Results ({filteredParticipants.length} participants)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No participants found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                    <TableHead className="text-center">Time</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>WhatsApp</TableHead>

                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant) => (
                    <TableRow
                      key={participant.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>{getRankBadge(participant.rank)}</TableCell>
                      <TableCell>
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(participant.name)} flex items-center justify-center text-xs font-bold text-foreground shadow-sm`}>
                          {getInitials(participant.name)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {participant.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {participant.quiz_title}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {participant.total_score}/{participant.total_questions}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            participant.total_questions > 0 &&
                              (participant.total_score /
                                participant.total_questions) *
                              100 >=
                              70
                              ? "default"
                              : "secondary"
                          }
                        >
                          {participant.total_questions > 0
                            ? `${Math.round(
                              (participant.total_score /
                                participant.total_questions) *
                              100
                            )}%`
                            : "0%"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatTime(participant.total_time_taken)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {participant.city || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {participant.whatsapp || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(
                          new Date(participant.created_at),
                          "dd MMM yyyy HH:mm"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteParticipant(participant.id, participant.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeaderboard;
