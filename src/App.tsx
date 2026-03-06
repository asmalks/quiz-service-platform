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
import AdminClients from "./pages/admin/Clients";
import AdminClientDetail from "./pages/admin/ClientDetail";
import QuizEntry from "./pages/quiz/Entry";
import QuizTake from "./pages/quiz/Take";
import QuizResults from "./pages/quiz/Results";
import Leaderboard from "./pages/Leaderboard";

// Client Admin
import ClientLogin from "./pages/client/Login";
import { ClientAdminLayout } from "./components/client/ClientAdminLayout";
import ClientDashboard from "./pages/client/Dashboard";
import ClientQuizzes from "./pages/client/Quizzes";
import ClientCreateQuiz from "./pages/client/CreateQuiz";
import ClientAdminLeaderboard from "./pages/client/Leaderboard";
import ClientBranding from "./pages/client/Branding";

// Client-Branded Public Quiz Pages
import ClientEntry from "./pages/client-quiz/ClientEntry";
import ClientTake from "./pages/client-quiz/ClientTake";
import ClientResults from "./pages/client-quiz/ClientResults";
import ClientLeaderboardPage from "./pages/client-quiz/ClientLeaderboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Super Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="quizzes" element={<QuizList />} />
            <Route path="quizzes/create" element={<CreateQuiz />} />
            <Route path="quizzes/edit/:quizId" element={<CreateQuiz />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="clients/:clientId" element={<AdminClientDetail />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Client Admin Panel */}
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client" element={<ClientAdminLayout />}>
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="quizzes" element={<ClientQuizzes />} />
            <Route path="quizzes/create" element={<ClientCreateQuiz />} />
            <Route path="quizzes/edit/:quizId" element={<ClientCreateQuiz />} />
            <Route path="leaderboard" element={<ClientAdminLeaderboard />} />
            <Route path="branding" element={<ClientBranding />} />
          </Route>

          {/* Original PSC BRo quiz flow (unchanged) */}
          <Route path="/quiz/:quizId" element={<QuizEntry />} />
          <Route path="/quiz/:quizId/take/:participantId" element={<QuizTake />} />
          <Route path="/quiz/:quizId/results/:participantId" element={<QuizResults />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/leaderboard/:quizId" element={<Leaderboard />} />

          {/* Client-Branded Quiz Flow */}
          <Route path="/quiz/:clientSlug/:quizId" element={<ClientEntry />} />
          <Route path="/quiz/:clientSlug/:quizId/take/:participantId" element={<ClientTake />} />
          <Route path="/quiz/:clientSlug/:quizId/results/:participantId" element={<ClientResults />} />
          <Route path="/leaderboard/:clientSlug/:quizId" element={<ClientLeaderboardPage />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

