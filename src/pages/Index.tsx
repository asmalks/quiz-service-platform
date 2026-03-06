import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trophy, Clock, Users, Brain, Award, Zap, Target, Loader2, X, ExternalLink, Instagram, Youtube, MessageCircle, Send, Heart, Sparkles, BookOpen, Bell, Star, ArrowRight } from "lucide-react";
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
    if (todayQuizId) {
      navigate(`/quiz/${todayQuizId}`);
    } else {
      toast({
        title: "No Active Quiz",
        description: "There's no quiz available right now. Please check back later!",
        variant: "destructive",
      });
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
              Live Daily Quizzes
            </span>
          </div>

          {/* Title - Hardcoded */}
          <h1 className="animate-slide-up text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PSC BRO
            </span>
          </h1>

          {/* Subtitle - Hardcoded */}
          <p className="animate-slide-up text-xl sm:text-2xl text-muted-foreground font-medium mb-10 max-w-2xl mx-auto" style={{ animationDelay: '0.1s' }}>
            Master PSC Exams with Daily Challenges
          </p>

          {/* CTA Buttons */}
          <div className="animate-slide-up flex flex-col sm:flex-row gap-4 justify-center items-center mb-12" style={{ animationDelay: '0.2s' }}>
            <Button
              size="lg"
              className="group gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-2xl shadow-primary/30 transition-all duration-300"
              onClick={handleTakeQuiz}
            >
              {loadingQuiz ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Start Quiz
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <Link to="/leaderboard">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 px-8 py-6 text-lg font-semibold rounded-full transition-all duration-300"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Leaderboard
              </Button>
            </Link>
          </div>

          {/* Schedule - Hardcoded */}
          <div className="animate-slide-up inline-flex items-center gap-3 px-6 py-3 bg-card/50 backdrop-blur-sm border border-border rounded-full" style={{ animationDelay: '0.3s' }}>
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Daily at 8 PM</span>
          </div>

          {/* Quick Stats */}
          <div className="animate-slide-up flex items-center justify-center gap-8 mt-16 text-sm text-muted-foreground" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>70K+ Members</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>5.0 Rating</span>
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
                { icon: Instagram, label: "Instagram Family", value: "70K+", color: "from-pink-500 to-rose-500" },
                { icon: MessageCircle, label: "WhatsApp Groups", value: "5+", color: "from-green-500 to-emerald-500" },
                { icon: Users, label: "Community Members", value: "5000+", color: "from-blue-500 to-indigo-500" },
                { icon: Trophy, label: "Daily Winners", value: "100+", color: "from-amber-500 to-orange-500" },
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
              Our Story
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Who We Are
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
                    <h3 className="text-2xl font-bold text-foreground mb-4">Built by Aspirants, for Aspirants</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      PSC BRO started as a small Instagram page and grew into Kerala's most active PSC preparation community.
                      We share daily current affairs, study materials, exam notifications, syllabus updates, and results — all completely free.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-card" />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">Join 70K+ aspirants</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Right - Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Zap, title: "Daily Updates", desc: "Current affairs & study materials", color: "from-blue-400 to-indigo-500" },
                { icon: Bell, title: "Notifications", desc: "Exam alerts & results", color: "from-violet-400 to-purple-500" },
                { icon: Trophy, title: "Competitions", desc: "Daily quiz with prizes", color: "from-amber-400 to-orange-500" },
                { icon: BookOpen, title: "Free Resources", desc: "100% community driven", color: "from-green-400 to-emerald-500" },
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
              Why Choose PSC BRO?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to ace your PSC exams with confidence
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Daily Fresh Quizzes",
                description: "New challenges every day with time-bound questions to sharpen your speed.",
                color: "from-blue-500 to-indigo-600",
              },
              {
                icon: Trophy,
                title: "Real-time Leaderboard",
                description: "Compete with thousands and track your ranking instantly.",
                color: "from-amber-500 to-orange-600",
              },
              {
                icon: Target,
                title: "Exam-Focused Content",
                description: "Questions curated specifically for Kerala PSC exams.",
                color: "from-blue-500 to-cyan-600",
              },
              {
                icon: Award,
                title: "Rewards & Recognition",
                description: "Top performers win prizes and get featured in our Hall of Fame.",
                color: "from-pink-500 to-rose-600",
              },
              {
                icon: Zap,
                title: "Instant Results",
                description: "Get immediate feedback with detailed explanations.",
                color: "from-green-500 to-emerald-600",
              },
              {
                icon: Brain,
                title: "Topic-wise Practice",
                description: "Master specific subjects with our practice library.",
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

      {/* Join Community Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-6 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto">
            <Card className="card-premium overflow-hidden border-0 shadow-xl">
              <CardContent className="p-0">
                <div className="gradient-primary p-8 sm:p-12 text-center space-y-6 sm:space-y-8">
                  <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">
                    Join Our Community
                  </h2>
                  <p className="text-lg text-primary-foreground/90 max-w-xl mx-auto">
                    Connect with 70,000+ PSC aspirants. Get daily updates, study materials, and compete in quizzes!
                  </p>

                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                    <a
                      href="https://instagram.com/pscbro"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button size="lg" className="w-full sm:w-auto min-w-[140px] bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm rounded-xl h-12">
                        <Instagram className="w-5 h-5 mr-2" />
                        Instagram
                      </Button>
                    </a>
                    <a
                      href="https://chat.whatsapp.com/pscbro"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button size="lg" className="w-full sm:w-auto min-w-[140px] bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm rounded-xl h-12">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                    <a
                      href="https://youtube.com/@pscbro"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button size="lg" className="w-full sm:w-auto min-w-[140px] bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm rounded-xl h-12">
                        <Youtube className="w-5 h-5 mr-2" />
                        YouTube
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-xl mx-auto">
          <ScrollReveal className="text-center mb-10 space-y-4">
            <Badge className="badge-pill bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              Get in Touch
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              Share Your Thoughts
            </h2>
            <p className="text-muted-foreground">
              Have ideas, feedback, or suggestions? We'd love to hear from you!
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
            PSC BRO
          </h3>
          <p className="text-sm text-muted-foreground">
            © 2025 PSC BRO. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Developed by <span className="font-medium text-foreground">Darvesh</span> with <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
