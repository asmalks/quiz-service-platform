import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Users, Brain, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClientTheme } from "@/hooks/use-client-theme";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    status: string;
}

const ClientEntry = () => {
    const { clientSlug, quizId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme, loading: themeLoading, error: themeError } = useClientTheme(clientSlug);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [city, setCity] = useState("");
    const [examTarget, setExamTarget] = useState("");
    const [fingerprint, setFingerprint] = useState<string | null>(null);
    const [alreadyParticipated, setAlreadyParticipated] = useState(false);

    useEffect(() => {
        initializeFingerprint();
    }, []);

    useEffect(() => {
        if (quizId) {
            fetchQuiz();
        }
    }, [quizId]);

    useEffect(() => {
        if (fingerprint && quizId) {
            checkExistingParticipation();
        }
    }, [fingerprint, quizId]);

    const initializeFingerprint = async () => {
        try {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            setFingerprint(result.visitorId);
        } catch (error) {
            console.error("Fingerprint error:", error);
        }
    };

    const checkExistingParticipation = async () => {
        if (!fingerprint || !quizId) return;
        try {
            const { data } = await supabase
                .from("participants")
                .select("id, end_time")
                .eq("quiz_id", quizId)
                .eq("device_fingerprint", fingerprint)
                .not("end_time", "is", null);

            if (data && data.length > 0) {
                setAlreadyParticipated(true);
            }
        } catch (error) {
            console.error("Error checking participation:", error);
        }
    };

    const fetchQuiz = async () => {
        try {
            const { data, error } = await supabase
                .from("quizzes")
                .select("id, title, description, start_time, end_time, status")
                .eq("id", quizId)
                .single();

            if (error) throw error;
            setQuiz(data);
        } catch (error) {
            console.error("Error fetching quiz:", error);
            toast({ title: "Error", description: "Quiz not found", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast({ title: "Error", description: "Name is required", variant: "destructive" });
            return;
        }

        try {
            setSubmitting(true);
            const { data, error } = await supabase
                .from("participants")
                .insert([{
                    quiz_id: quizId,
                    name,
                    whatsapp: whatsapp || null,
                    city: city || null,
                    exam_target: examTarget || null,
                    device_fingerprint: fingerprint,
                }])
                .select()
                .single();

            if (error) {
                if (error.message?.includes("already completed") || error.message?.includes("active quiz session")) {
                    toast({ title: "Already Participated", description: error.message, variant: "destructive" });
                    return;
                }
                throw error;
            }

            navigate(`/quiz/${clientSlug}/${quizId}/take/${data.id}`);
        } catch (error: any) {
            console.error("Error:", error);
            toast({ title: "Error", description: error.message || "Failed to register", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (themeLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background_color }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary_color }} />
            </div>
        );
    }

    if (themeError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold">Not Available</h2>
                        <p className="text-muted-foreground mt-2">This quiz campaign is not available.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const now = new Date();
    const quizStarted = quiz && new Date(quiz.start_time) <= now;
    const quizEnded = quiz && new Date(quiz.end_time) <= now;
    const quizActive = quizStarted && !quizEnded && quiz?.status === "published";

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.background_color }}>
            <Card className="w-full max-w-lg shadow-xl" style={{ borderColor: theme.primary_color, borderWidth: "2px" }}>
                <CardHeader className="text-center space-y-3">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-14 mx-auto object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.primary_color }}>
                            {theme.headline || theme.name}
                        </h1>
                        {theme.subheadline && (
                            <p className="text-sm mt-1" style={{ color: theme.secondary_color }}>
                                {theme.subheadline}
                            </p>
                        )}
                    </div>
                    {quiz && (
                        <div>
                            <h2 className="text-lg font-semibold">{quiz.title}</h2>
                            {quiz.description && <p className="text-sm text-muted-foreground">{quiz.description}</p>}
                        </div>
                    )}
                </CardHeader>

                <CardContent>
                    {alreadyParticipated ? (
                        <div className="text-center py-4">
                            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                            <h3 className="font-semibold text-lg">Already Participated</h3>
                            <p className="text-sm text-muted-foreground">You have already completed this quiz.</p>
                            <Button className="mt-4" style={{ backgroundColor: theme.primary_color }} onClick={() => navigate(`/leaderboard/${clientSlug}/${quizId}`)}>
                                View Leaderboard
                            </Button>
                        </div>
                    ) : !quizActive ? (
                        <div className="text-center py-4">
                            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="font-semibold text-lg">
                                {quizEnded ? "Quiz Has Ended" : "Quiz Not Started Yet"}
                            </h3>
                            {quiz && !quizStarted && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Starts: {new Date(quiz.start_time).toLocaleString()}
                                </p>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp Number</Label>
                                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Your WhatsApp number" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Exam</Label>
                                    <Input value={examTarget} onChange={(e) => setExamTarget(e.target.value)} placeholder="e.g. PSC" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full text-white" style={{ backgroundColor: theme.primary_color }} disabled={submitting}>
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                                Start Quiz
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ClientEntry;
