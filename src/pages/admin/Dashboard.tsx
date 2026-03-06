import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ClipboardList, Trophy, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    activeQuizzes: 0,
    totalParticipants: 0,
    todayParticipants: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: quizCount } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true });

      const now = new Date().toISOString();
      const { count: activeCount } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .lte("start_time", now)
        .gte("end_time", now);

      const { count: participantCount } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split("T")[0];
      const { count: todayCount } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      setStats({
        totalQuizzes: quizCount || 0,
        activeQuizzes: activeCount || 0,
        totalParticipants: participantCount || 0,
        todayParticipants: todayCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statCards = [
    {
      title: "Total Quizzes",
      value: stats.totalQuizzes,
      icon: ClipboardList,
      color: "from-primary to-primary-light",
    },
    {
      title: "Active Quizzes",
      value: stats.activeQuizzes,
      icon: TrendingUp,
      color: "from-accent to-accent-light",
    },
    {
      title: "Total Participants",
      value: stats.totalParticipants,
      icon: Users,
      color: "from-primary-light to-accent",
    },
    {
      title: "Today's Participants",
      value: stats.todayParticipants,
      icon: Trophy,
      color: "from-accent-light to-primary",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>
        <Link to="/admin/quizzes/create">
          <Button className="bg-primary hover:bg-primary-light">
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card
            key={idx}
            className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/quizzes/create">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Quiz
              </Button>
            </Link>
            <Link to="/admin/quizzes">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="mr-2 h-4 w-4" />
                Manage Quizzes
              </Button>
            </Link>
            <Link to="/admin/leaderboard">
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="mr-2 h-4 w-4" />
                View Leaderboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">New</Badge>
                <span>{stats.todayParticipants} participants joined today</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Active</Badge>
                <span>{stats.activeQuizzes} quizzes currently running</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
