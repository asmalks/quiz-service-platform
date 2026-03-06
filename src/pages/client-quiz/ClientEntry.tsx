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
        <div className="min-h-screen flex items-center justify-center p-4 font-malayalam" style={{ backgroundColor: theme.background_color }}>
            <Card className="w-full max-w-md shadow-2xl transition-all duration-300 hover:shadow-glow" style={{ borderColor: theme.primary_color, borderWidth: "2px" }}>
                <CardHeader className="text-center space-y-4">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-16 mx-auto object-contain animate-fade-in-scale" onError={(e) => (e.currentTarget.style.display = "none")} />
                    )}
                    <div className="space-y-2">
                        <Badge style={{ backgroundColor: theme.primary_color, color: "#fff" }} className="mb-2 px-3 py-1 shadow-sm animate-fade-in text-xs font-semibold">
                            {theme.badge_text || theme.name}
                        </Badge>
                        <h1 className="text-3xl font-bold animate-slide-up leading-tight" style={{ color: theme.primary_color }}>
                            {theme.headline || theme.name}
                        </h1>
                        {theme.subheadline && (
                            <p className="text-sm mt-2 animate-slide-up" style={{ color: theme.secondary_color, animationDelay: "100ms" }}>
                                {theme.subheadline}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4">
                        <div className="text-center p-3 rounded-lg bg-secondary/50 transition-all duration-300 hover:scale-105 hover:bg-primary/10 hover:shadow-md cursor-pointer group">
                            <Brain className="w-5 h-5 mx-auto mb-1 transition-transform duration-300 group-hover:scale-110" style={{ color: theme.primary_color }} />
                            <p className="text-xs text-muted-foreground">Test Your</p>
                            <p className="text-sm font-semibold">Knowledge</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-secondary/50 transition-all duration-300 hover:scale-105 hover:bg-accent/10 hover:shadow-md cursor-pointer group">
                            <Clock className="w-5 h-5 mx-auto mb-1 text-accent transition-transform duration-300 group-hover:scale-110" />
                            <p className="text-xs text-muted-foreground">Timed</p>
                            <p className="text-sm font-semibold">Challenge</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-secondary/50 transition-all duration-300 hover:scale-105 hover:bg-primary-light/10 hover:shadow-md cursor-pointer group">
                            <Users className="w-5 h-5 mx-auto mb-1 transition-transform duration-300 group-hover:scale-110" style={{ color: theme.secondary_color }} />
                            <p className="text-xs text-muted-foreground">Compete</p>
                            <p className="text-sm font-semibold">& Win</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {alreadyParticipated ? (
                        <div className="text-center py-6 animate-fade-in">
                            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-amber-600" />
                            </div>
                            <h3 className="font-semibold text-xl mb-2">Already Participated</h3>
                            <p className="text-sm text-muted-foreground mb-6">You have already completed this quiz.</p>
                            <Button className="w-full text-white py-6 text-lg" style={{ backgroundColor: theme.primary_color }} onClick={() => navigate(`/leaderboard/${clientSlug}/${quizId}`)}>
                                View Leaderboard
                            </Button>
                        </div>
                    ) : !quizActive ? (
                        <div className="text-center py-6 animate-fade-in">
                            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.primary_color}20` }}>
                                <Clock className="h-8 w-8" style={{ color: theme.primary_color }} />
                            </div>
                            <h3 className="font-semibold text-xl mb-2">
                                {quizEnded ? "Quiz Has Ended" : "Quiz Not Started Yet"}
                            </h3>
                            {quiz && !quizStarted && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Starts: {new Date(quiz.start_time).toLocaleString()}
                                </p>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
                            <div className="space-y-2">
                                <Label className="font-semibold">Full Name *</Label>
                                <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required />
                            </div>
                            <div className="space-y-2 hidden">
                                <Label>WhatsApp Number</Label>
                                <Input className="h-12" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Your WhatsApp number" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Location / City (Optional)</Label>
                                <Input className="h-12" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Where are you from?" />
                            </div>

                            <Button type="submit" className="w-full h-14 text-white text-lg mt-6 shadow-md transition-all hover:scale-[1.02]" style={{ backgroundColor: theme.primary_color }} disabled={submitting}>
                                {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Brain className="mr-2 h-5 w-5" />}
                                Start Quiz
                            </Button>

                            <p className="text-xs text-center text-muted-foreground mt-4">
                                By starting the quiz, you agree to our terms and conditions
                            </p>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ClientEntry;
