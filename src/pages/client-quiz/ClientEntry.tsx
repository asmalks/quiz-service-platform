import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    whatsapp_required: boolean;
    badge_text: string | null;
}

const ClientEntry = () => {
    const { clientSlug, quizId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { theme, loading: themeLoading, error: themeError } = useClientTheme(clientSlug);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        whatsapp: "",
        city: "",
    });
    const [fingerprint, setFingerprint] = useState<string | null>(null);
    const [alreadyParticipated, setAlreadyParticipated] = useState(false);
    const [existingParticipantName, setExistingParticipantName] = useState<string>("");
    const [expired, setExpired] = useState(false);

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
            // Fallback
            const fallback = btoa(
                navigator.userAgent +
                screen.width +
                screen.height +
                new Date().getTimezoneOffset() +
                navigator.language
            );
            setFingerprint(fallback);
        }
    };

    const checkExistingParticipation = async () => {
        if (!fingerprint || !quizId) return;
        try {
            const { data: existingParticipant } = await supabase
                .from("participants")
                .select("name, end_time")
                .eq("quiz_id", quizId)
                .eq("device_fingerprint", fingerprint)
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
            const { data, error } = await (supabase
                .from("quizzes")
                .select("id, title, description, start_time, end_time, status, whatsapp_required, badge_text")
                .eq("id", quizId)
                .single() as any);

            if (error) throw error;

            const now = new Date();
            const endTime = new Date(data.end_time);
            if (now > endTime) {
                setExpired(true);
            }

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
        if (!formData.name.trim()) {
            toast({ title: "Error", description: "Name is required", variant: "destructive" });
            return;
        }

        try {
            setSubmitting(true);
            const { data, error } = await supabase
                .from("participants")
                .insert([{
                    quiz_id: quizId,
                    name: formData.name.trim(),
                    whatsapp: formData.whatsapp.trim() || null,
                    city: formData.city.trim() || null,
                    device_fingerprint: fingerprint,
                }])
                .select()
                .single();

            if (error) {
                if (error.message?.includes("already completed") || error.message?.includes("active quiz session")) {
                    setAlreadyParticipated(true);
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
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: theme.primary_color }} />
                    <p className="text-lg font-medium text-muted-foreground">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (themeError || !quiz) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Card className="max-w-md w-full mx-4 shadow-2xl">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
                        <h2 className="text-2xl font-bold">Not Available</h2>
                        <p className="text-muted-foreground">This quiz campaign is not available or has been removed.</p>
                        <Button className="w-full" variant="outline" onClick={() => navigate("/")}>Go Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (alreadyParticipated) {
        const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

        const handleReset = async () => {
            try {
                setLoading(true);
                // Delete responses first
                const { data: partData } = await supabase
                    .from("participants")
                    .select("id")
                    .eq("quiz_id", quizId)
                    .eq("device_fingerprint", fingerprint)
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
            <div className="min-h-screen flex items-center justify-center p-4 font-malayalam" style={{ backgroundColor: theme.background_color }}>
                <Card className="w-full max-w-md shadow-2xl" style={{ borderColor: theme.primary_color, borderWidth: "2px" }}>
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
                            className="w-full text-white h-12 text-lg"
                            style={{ backgroundColor: theme.primary_color }}
                            onClick={() => navigate(`/leaderboard/${clientSlug}/${quizId}`)}
                        >
                            View Leaderboard
                        </Button>
                        {isDev && (
                            <Button
                                variant="destructive"
                                className="w-full border-2 border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-white h-12 text-lg"
                                onClick={handleReset}
                            >
                                Developer: Reset Participation
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (expired) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 font-malayalam" style={{ backgroundColor: theme.background_color }}>
                <Card className="w-full max-w-md shadow-2xl" style={{ borderColor: theme.primary_color, borderWidth: "2px" }}>
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                            <Clock className="w-8 h-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl">Quiz Expired</CardTitle>
                        <CardDescription>
                            This quiz has ended. Check the leaderboard to see the winners!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            className="w-full text-white h-12 text-lg font-semibold"
                            style={{ backgroundColor: theme.primary_color }}
                            onClick={() => navigate(`/leaderboard/${clientSlug}/${quizId}`)}
                        >
                            View Leaderboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const now = new Date();
    const quizStarted = new Date(quiz.start_time) <= now;
    const quizActive = quizStarted && quiz.status === "published";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-malayalam" style={{ backgroundColor: theme.background_color }}>
            <Card className="w-full max-w-md shadow-2xl transition-all duration-300 hover:shadow-glow" style={{ borderColor: theme.primary_color, borderWidth: "2px" }}>
                <CardHeader className="text-center space-y-4">
                    {theme.logo_url && (
                        <img src={theme.logo_url} alt={theme.name} className="h-16 mx-auto object-contain animate-fade-in-scale" />
                    )}
                    <div className="space-y-2">
                        <Badge style={{ backgroundColor: theme.primary_color, color: "#fff" }} className="mb-2 px-3 py-1 shadow-sm animate-fade-in text-xs font-semibold">
                            {quiz.badge_text || theme.badge_text || theme.name}
                        </Badge>
                        <h1 className="text-2xl sm:text-3xl font-bold animate-slide-up leading-tight" style={{ color: theme.primary_color }}>
                            {quiz.title}
                        </h1>
                        {quiz.description && (
                            <p className="text-sm mt-2 animate-slide-up text-muted-foreground" style={{ animationDelay: "100ms" }}>
                                {quiz.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4">
                        <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100 transition-all duration-300 hover:scale-105 hover:bg-blue-100 hover:shadow-md cursor-pointer group">
                            <Brain className="w-5 h-5 mx-auto mb-1 transition-transform duration-300 group-hover:scale-110" style={{ color: theme.primary_color }} />
                            <p className="text-xs text-blue-600/70 font-medium">Test Your</p>
                            <p className="text-sm font-bold text-blue-800">Knowledge</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100 transition-all duration-300 hover:scale-105 hover:bg-purple-100 hover:shadow-md cursor-pointer group">
                            <Clock className="w-5 h-5 mx-auto mb-1 text-accent transition-transform duration-300 group-hover:scale-110" />
                            <p className="text-xs text-purple-600/70 font-medium">Timed</p>
                            <p className="text-sm font-bold text-purple-800">Challenge</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100 transition-all duration-300 hover:scale-105 hover:bg-emerald-100 hover:shadow-md cursor-pointer group">
                            <Users className="w-5 h-5 mx-auto mb-1 transition-transform duration-300 group-hover:scale-110" style={{ color: theme.secondary_color }} />
                            <p className="text-xs text-emerald-600/70 font-medium">Compete</p>
                            <p className="text-sm font-bold text-emerald-800">& Win</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-2">
                    {!quizActive ? (
                        <div className="text-center py-6 animate-fade-in">
                            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${theme.primary_color}20` }}>
                                <Clock className="h-8 w-8" style={{ color: theme.primary_color }} />
                            </div>
                            <h3 className="font-semibold text-xl mb-2">Quiz Not Started Yet</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Starts: {new Date(quiz.start_time).toLocaleString()}
                            </p>
                            <Button className="w-full mt-6" variant="outline" onClick={() => navigate(`/leaderboard/${clientSlug}/${quizId}`)}>View Leaderboard</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
                            <div className="space-y-2">
                                <Label className="font-semibold">Full Name *</Label>
                                <Input
                                    className="h-12"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Location / City (Optional)</Label>
                                <Input
                                    className="h-12"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="Where are you from?"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">WhatsApp Number {(quiz as any).whatsapp_required && "*"}</Label>
                                <Input
                                    className="h-12"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    placeholder="Your WhatsApp number"
                                    required={(quiz as any).whatsapp_required}
                                />
                            </div>

                            <Button type="submit" className="w-full h-14 text-white text-lg mt-6 shadow-md transition-all hover:scale-[1.02]" style={{ backgroundColor: theme.primary_color }} disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="mr-2 h-5 w-5" />
                                        Start Quiz
                                    </>
                                )}
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
