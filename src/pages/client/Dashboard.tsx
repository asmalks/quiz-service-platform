import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, ClipboardList, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { ClientAdminSession } from "@/components/client/ClientAdminLayout";

const ClientDashboard = () => {
    const session = useOutletContext<ClientAdminSession>();
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        activeQuizzes: 0,
        totalParticipants: 0,
    });

    useEffect(() => {
        fetchStats();
    }, [session]);

    const fetchStats = async () => {
        try {
            const { count: quizCount } = await supabase
                .from("quizzes")
                .select("*", { count: "exact", head: true })
                .eq("client_id", session.client_id);

            const now = new Date().toISOString();
            const { count: activeCount } = await supabase
                .from("quizzes")
                .select("*", { count: "exact", head: true })
                .eq("client_id", session.client_id)
                .eq("status", "published")
                .lte("start_time", now)
                .gte("end_time", now);

            // Get participant count for this client's quizzes
            const { data: clientQuizzes } = await supabase
                .from("quizzes")
                .select("id")
                .eq("client_id", session.client_id);

            let participantCount = 0;
            if (clientQuizzes && clientQuizzes.length > 0) {
                const quizIds = clientQuizzes.map((q) => q.id);
                const { count } = await supabase
                    .from("participants")
                    .select("*", { count: "exact", head: true })
                    .in("quiz_id", quizIds);
                participantCount = count || 0;
            }

            setStats({
                totalQuizzes: quizCount || 0,
                activeQuizzes: activeCount || 0,
                totalParticipants: participantCount,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {session.client_name}!
                    </p>
                </div>
                <Link to="/client/quizzes/create">
                    <Button className="bg-primary hover:bg-primary-light">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Quiz
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Quizzes
                        </CardTitle>
                        <ClipboardList className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalQuizzes}</div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Quizzes
                        </CardTitle>
                        <Trophy className="h-5 w-5 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.activeQuizzes}</div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Participants
                        </CardTitle>
                        <Users className="h-5 w-5 text-primary-light" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalParticipants}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link to="/client/quizzes/create">
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Quiz
                            </Button>
                        </Link>
                        <Link to="/client/quizzes">
                            <Button variant="outline" className="w-full justify-start">
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Manage Quizzes
                            </Button>
                        </Link>
                        <Link to="/client/leaderboard">
                            <Button variant="outline" className="w-full justify-start">
                                <Trophy className="mr-2 h-4 w-4" />
                                View Leaderboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quiz Link</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                            Share this base URL with participants:
                        </p>
                        <code className="text-sm bg-muted px-3 py-2 rounded block">
                            {window.location.origin}/quiz/{session.client_slug}/
                        </code>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ClientDashboard;
