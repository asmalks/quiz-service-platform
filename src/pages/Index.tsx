import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trophy, Clock, Users, Brain, Award, Zap, Target, Loader2, X, ExternalLink, Instagram, Youtube, MessageCircle, Send, Heart, Sparkles, BookOpen, Bell, Star, ArrowRight, Mail } from "lucide-react";
import { ScrollReveal } from "@/hooks/use-scroll-reveal";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  link: string | null;
  is_active: boolean;
}

interface Announcement {
  enabled: boolean;
  title: string;
  message: string;
}

const Index = () => {
  const [todayQuizId, setTodayQuizId] = useState<string | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submittingContact, setSubmittingContact] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizIdInput, setQuizIdInput] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchTodayQuiz();
    fetchSponsors();
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "announcement")
        .maybeSingle();

      if (data?.value) {
        setAnnouncement(data.value as unknown as Announcement);
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
    }
  };

  const fetchSponsors = async () => {
    try {
      const { data } = await supabase
        .from("sponsors")
        .select("*")
        .eq("is_active", true);

      if (data) {
        setSponsors(data);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    }
  };

  const fetchTodayQuiz = async () => {
    try {
      const now = new Date().toISOString();

      const { data: activeQuiz } = await supabase
        .from("quizzes")
        .select("id")
        .eq("status", "published")
        .lte("start_time", now)
        .gte("end_time", now)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeQuiz) {
        setTodayQuizId(activeQuiz.id);
        return;
      }

      const { data: latestQuiz } = await supabase
        .from("quizzes")
        .select("id")
        .eq("status", "published")
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestQuiz) {
        setTodayQuizId(latestQuiz.id);
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  };

  const handleTakeQuiz = () => {
    const trimmedId = quizIdInput.trim();
    if (!trimmedId) {
      toast({
        title: "Quiz ID Required",
        description: "Please enter a valid Quiz ID to join.",
        variant: "destructive",
      });
      return;
    }
    setShowQuizModal(false);
    setQuizIdInput("");
    navigate(`/quiz/${trimmedId}`);
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact-section");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.message.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill in your name and message.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingContact(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          name: contactForm.name.trim(),
          email: contactForm.email.trim() || null,
          message: contactForm.message.trim(),
        });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for your feedback. We'll get back to you soon!",
      });
      setContactForm({ name: "", email: "", message: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingContact(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Banner */}
      {announcement?.enabled && !announcementDismissed && (
        <div className="gradient-primary text-primary-foreground py-3 px-4 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 pr-8">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">{announcement.title}</span>
            <span className="opacity-90">{announcement.message}</span>
          </div>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Hero Section - Clean Professional Design */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Clean Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-background to-background" />

        {/* Soft Gradient Blobs */}
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />

        {/* Subtle Geometric Accents */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 border border-primary/10 rounded-full hidden lg:block" />
        <div className="absolute bottom-1/3 left-1/5 w-48 h-48 border border-accent/10 rounded-full hidden lg:block" />
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-primary/30 rounded-full hidden lg:block" />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-accent/40 rounded-full hidden lg:block" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Live Badge */}
          <div className="animate-fade-in mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Quiz as a Service Platform
            </span>
          </div>

          {/* Title - Hardcoded */}
          <h1 className="animate-slide-up text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              QQuiz
            </span>
          </h1>

          {/* Subtitle - Hardcoded */}
          <p className="animate-slide-up text-xl sm:text-2xl text-muted-foreground font-medium mb-10 max-w-2xl mx-auto" style={{ animationDelay: '0.1s' }}>
            Host, Brand & Conduct Quizzes for Any Organization
          </p>

          {/* CTA Buttons */}
          <div className="animate-slide-up flex flex-col sm:flex-row gap-4 justify-center items-center mb-12" style={{ animationDelay: '0.2s' }}>
            <Button
              size="lg"
              className="group gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-2xl shadow-primary/30 transition-all duration-300"
              onClick={() => setShowQuizModal(true)}
            >
              Start Quiz
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 px-8 py-6 text-lg font-semibold rounded-full transition-all duration-300"
              onClick={scrollToContact}
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact Us
            </Button>
          </div>

          {/* Quiz ID Modal */}
          {showQuizModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowQuizModal(false)}>
              <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">Join a Quiz</h3>
                  <button onClick={() => setShowQuizModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter the Quiz ID shared by your organizer to join the quiz.
                </p>
                <Input
                  value={quizIdInput}
                  onChange={(e) => setQuizIdInput(e.target.value)}
                  placeholder="Enter Quiz ID"
                  className="h-12 text-base rounded-xl"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleTakeQuiz()}
                />
                <Button
                  className="w-full h-12 gradient-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  onClick={handleTakeQuiz}
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Join Quiz
                </Button>
              </div>
            </div>
          )}


          {/* Schedule - Hardcoded */}
          <div className="animate-slide-up inline-flex items-center gap-3 px-6 py-3 bg-card/50 backdrop-blur-sm border border-border rounded-full" style={{ animationDelay: '0.3s' }}>
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Launch Quizzes Anytime</span>
          </div>

          {/* Quick Stats */}
          <div className="animate-slide-up flex items-center justify-center gap-8 mt-16 text-sm text-muted-foreground" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Multi-Client Support</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Custom Branding</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Users, label: "Organizations Served", value: "∞", color: "from-pink-500 to-rose-500" },
                { icon: Brain, label: "Custom Branded Quizzes", value: "Unlimited", color: "from-green-500 to-emerald-500" },
                { icon: Target, label: "Real-time Leaderboards", value: "Live", color: "from-blue-500 to-indigo-500" },
                { icon: Trophy, label: "Anti-Cheat Protected", value: "100%", color: "from-amber-500 to-orange-500" },
              ].map((stat, idx) => (
                <ScrollReveal key={idx} delay={idx * 0.1} direction="up">
                  <div className="text-center p-6 group">
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16 space-y-4">
            <Badge className="badge-pill bg-accent/10 text-accent border-accent/20 hover:bg-accent/10">
              About QQuiz
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              What We Do
            </h2>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Card - Story */}
            <ScrollReveal delay={0.1} direction="left">
              <Card className="card-premium hover-lift overflow-hidden h-full">
                <CardContent className="p-8 space-y-6">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                    <Heart className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">Your Platform, Your Brand, Your Quiz</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      QQuiz is a quiz-as-a-service platform that lets colleges, coaching institutes, companies, and influencers
                      run their own branded quiz competitions — with custom logos, colors, leaderboards, and isolated admin access.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-card" />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">Trusted by organizations everywhere</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Right - Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Zap, title: "Instant Setup", desc: "Create quizzes in minutes", color: "from-blue-400 to-indigo-500" },
                { icon: Bell, title: "Custom Branding", desc: "Your logo, your colors", color: "from-violet-400 to-purple-500" },
                { icon: Trophy, title: "Live Leaderboards", desc: "Real-time competition", color: "from-amber-400 to-orange-500" },
                { icon: BookOpen, title: "Client Admin", desc: "Dedicated control panel", color: "from-green-400 to-emerald-500" },
              ].map((item, idx) => (
                <ScrollReveal key={idx} delay={0.2 + idx * 0.1} direction="scale">
                  <Card className="card-premium hover-lift h-full">
                    <CardContent className="p-5 space-y-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 gradient-soft">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16 space-y-4">
            <Badge className="badge-pill bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              Our Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Why Choose QQuiz?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run professional quiz competitions
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Timed Quiz Engine",
                description: "Set per-question timers with automatic submission. Keep your participants on their toes.",
                color: "from-blue-500 to-indigo-600",
              },
              {
                icon: Trophy,
                title: "Live Leaderboards",
                description: "Instant ranking by score and time. Share branded leaderboard links with participants.",
                color: "from-amber-500 to-orange-600",
              },
              {
                icon: Target,
                title: "Custom Branding",
                description: "Your logo, colors, headline — every quiz page is fully branded to your organization.",
                color: "from-blue-500 to-cyan-600",
              },
              {
                icon: Award,
                title: "Client Admin Panel",
                description: "Each organization gets their own admin dashboard to create quizzes and manage content.",
                color: "from-pink-500 to-rose-600",
              },
              {
                icon: Zap,
                title: "Anti-Cheat System",
                description: "Device fingerprinting, server-side validation, and duplicate detection built in.",
                color: "from-green-500 to-emerald-600",
              },
              {
                icon: Brain,
                title: "Multi-Client Platform",
                description: "Run quizzes for multiple organizations simultaneously with isolated data and branding.",
                color: "from-indigo-500 to-violet-600",
              },
            ].map((feature, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.1} direction="up">
                <Card className="card-premium hover-lift group h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      {sponsors.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card border-y border-border">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal className="text-center mb-12 space-y-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Trusted by</p>
              <h2 className="text-2xl font-bold text-foreground">
                Our Sponsors
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="flex flex-wrap justify-center gap-8">
                {sponsors.map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.link || "#"}
                    target={sponsor.link ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="card-premium w-44 h-28 flex items-center justify-center hover-lift">
                      <CardContent className="p-4 text-center">
                        {sponsor.logo_url ? (
                          <img
                            src={sponsor.logo_url}
                            alt={sponsor.name}
                            className="max-h-14 max-w-full object-contain mx-auto group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {sponsor.name}
                            </span>
                            {sponsor.link && (
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Join Community Section - HIDDEN (no social accounts yet) */}
      {/* Will be re-enabled when social media accounts are created */}

      {/* Contact Form Section */}
      <section id="contact-section" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-xl mx-auto">
          <ScrollReveal className="text-center mb-10 space-y-4">
            <Badge className="badge-pill bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              Get in Touch
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              Share Your Thoughts
            </h2>
            <p className="text-muted-foreground">
              Want to run quizzes for your organization? Have feedback? Let us know!
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Card className="card-premium">
              <CardContent className="p-8">
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-sm font-medium">Your Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="Enter your name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-sm font-medium">Email (Optional)</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="your@email.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message" className="text-sm font-medium">Your Message *</Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Share your ideas, feedback, or suggestions..."
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="rounded-xl resize-none"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 gradient-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    disabled={submittingContact}
                  >
                    {submittingContact ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            QQuiz
          </h3>
          <p className="text-sm text-muted-foreground">
            © 2026 QQuiz. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Built with <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
