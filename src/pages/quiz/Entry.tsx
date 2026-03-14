import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Users, Brain, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: string;
  whatsapp_required: boolean;
  badge_text: string | null;
}

const QuizEntry = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [expired, setExpired] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("");
  const [alreadyParticipated, setAlreadyParticipated] = useState(false);
  const [existingParticipantName, setExistingParticipantName] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    city: "",
    exam_target: "",
  });

  useEffect(() => {
    initializeFingerprint();
  }, []);

  useEffect(() => {
    if (deviceFingerprint && quizId) {
      checkExistingParticipation();
      fetchQuiz();
    }
  }, [deviceFingerprint, quizId]);

  const initializeFingerprint = async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceFingerprint(result.visitorId);
    } catch (error) {
      console.error("Fingerprint error:", error);
      // Generate a fallback fingerprint using available browser data
      const fallback = btoa(
        navigator.userAgent +
        screen.width +
        screen.height +
        new Date().getTimezoneOffset() +
        navigator.language
      );
      setDeviceFingerprint(fallback);
    }
  };

  const checkExistingParticipation = async () => {
    if (!deviceFingerprint || !quizId) return;

    try {
      // Check if this device has already completed this quiz
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("name, end_time")
        .eq("quiz_id", quizId)
        .eq("device_fingerprint", deviceFingerprint)
        .not("end_time", "is", null)
        .maybeSingle();

      if (existingParticipant) {
        setAlreadyParticipated(true);
        setExistingParticipantName(existingParticipant.name);
      }
    } catch (error) {
      console.error("Error checking participation:", error);
    }
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from("quizzes")
        .select("id, title, description, start_time, end_time, status, whatsapp_required, badge_text")
        .eq("id", quizId)
        .eq("status", "published")
        .maybeSingle() as any);

      if (error) throw error;

      if (!data) {
        navigate("/");
        return;
      }

      // Check if quiz has expired
      const now = new Date();
      const endTime = new Date(data.end_time);

      if (now > endTime) {
        setExpired(true);
      }

      setQuiz(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Quiz not found or not available.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }

      // Create participant with device fingerprint
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert({
          quiz_id: quizId,
          name: formData.name.trim(),
          whatsapp: formData.whatsapp.trim() || null,
          city: formData.city.trim() || null,
          exam_target: formData.exam_target.trim() || null,
          device_fingerprint: deviceFingerprint,
        })
        .select()
        .single();

      if (participantError) {
        // Handle duplicate entry error from database trigger
        if (participantError.message.includes("already completed") ||
          participantError.message.includes("already have an active")) {
          setAlreadyParticipated(true);
          throw new Error("You have already participated in this quiz from this device.");
        }
        throw participantError;
      }

      // Navigate immediately without blocking toast
      navigate(`/quiz/${quizId}/take/${participant.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while fingerprinting
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-lavender via-pastel-pink to-pastel-peach p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
          <p className="text-lg font-medium text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Show already participated message
  if (alreadyParticipated) {
    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    const handleReset = async () => {
      try {
        setLoading(true);
        // Delete responses first (cascade might not be set up)
        const { data: partData } = await supabase
          .from("participants")
          .select("id")
          .eq("quiz_id", quizId)
          .eq("device_fingerprint", deviceFingerprint)
          .maybeSingle();

        if (partData) {
          await supabase.from("responses").delete().eq("participant_id", partData.id);
          await supabase.from("participants").delete().eq("id", partData.id);
        }

        setAlreadyParticipated(false);
        setExistingParticipantName("");
        toast({
          title: "Debug Mode",
          description: "Participation reset. You can now try again.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Could not reset: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-lavender via-pastel-pink to-pastel-peach p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Already Participated</CardTitle>
            <CardDescription>
              {existingParticipantName
                ? `You (${existingParticipantName}) have already completed this quiz from this device.`
                : "You have already participated in this quiz from this device."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-primary hover:bg-primary-light"
              onClick={() => navigate(`/leaderboard/${quizId}`)}
            >
              View Leaderboard
            </Button>
            {isDev && (
              <Button
                variant="destructive"
                className="w-full border-2 border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-white"
                onClick={handleReset}
              >
                Developer: Reset Participation
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-lavender via-pastel-pink to-pastel-peach p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Quiz Expired</CardTitle>
            <CardDescription>
              This quiz has ended. Check out our other quizzes or wait for tomorrow's quiz!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-primary hover:bg-primary-light" onClick={() => navigate("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-lavender via-pastel-pink to-pastel-peach p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-primary-foreground border-primary/30 shadow-sm">
              {quiz.badge_text || "QQuiz"}
            </Badge>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            {quiz.description && <CardDescription className="text-base">{quiz.description}</CardDescription>}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4">
            <div className="text-center p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-100 transition-all duration-300 hover:scale-105 hover:bg-blue-100 hover:shadow-md cursor-pointer">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
              <p className="text-[10px] sm:text-xs text-blue-600/70 font-medium">Test Your</p>
              <p className="text-[11px] sm:text-sm font-bold text-blue-800 break-words">Knowledge</p>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-purple-50 border border-purple-100 transition-all duration-300 hover:scale-105 hover:bg-purple-100 hover:shadow-md cursor-pointer">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-purple-600 transition-transform duration-300 group-hover:scale-110" />
              <p className="text-[10px] sm:text-xs text-purple-600/70 font-medium">Timed</p>
              <p className="text-[11px] sm:text-sm font-bold text-purple-800 break-words">Challenge</p>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-100 transition-all duration-300 hover:scale-105 hover:bg-emerald-100 hover:shadow-md cursor-pointer">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-emerald-600 transition-transform duration-300 group-hover:scale-110" />
              <p className="text-[10px] sm:text-xs text-emerald-600/70 font-medium">Compete</p>
              <p className="text-[11px] sm:text-sm font-bold text-emerald-800 break-words">& Win</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City (Optional)</Label>
              <Input
                id="city"
                placeholder="Enter your place"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number {quiz.whatsapp_required && "*"}</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="Enter your WhatsApp number"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required={quiz.whatsapp_required}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-light text-lg py-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting Quiz...
                </>
              ) : (
                "Start Quiz"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By starting the quiz, you agree to our terms and conditions
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizEntry;
