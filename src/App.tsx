import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import CreateQuiz from "./pages/admin/CreateQuiz";
import QuizList from "./pages/admin/QuizList";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import AdminLeaderboard from "./pages/admin/Leaderboard";
import AdminMessages from "./pages/admin/Messages";
import QuizEntry from "./pages/quiz/Entry";
import QuizTake from "./pages/quiz/Take";
import QuizResults from "./pages/quiz/Results";
import Leaderboard from "./pages/Leaderboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="quizzes" element={<QuizList />} />
            <Route path="quizzes/create" element={<CreateQuiz />} />
            <Route path="quizzes/edit/:quizId" element={<CreateQuiz />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/quiz/:quizId" element={<QuizEntry />} />
          <Route path="/quiz/:quizId/take/:participantId" element={<QuizTake />} />
          <Route path="/quiz/:quizId/results/:participantId" element={<QuizResults />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/leaderboard/:quizId" element={<Leaderboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
