import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Settings2, Megaphone, Calendar, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface SiteSettings {
  landing_hero_title: string;
  landing_hero_subtitle: string;
  landing_description: string;
  quiz_schedule: string;
  announcement: {
    enabled: boolean;
    title: string;
    message: string;
  };
}

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  link: string | null;
  is_active: boolean;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState<SiteSettings>({
    landing_hero_title: "",
    landing_hero_subtitle: "",
    landing_description: "",
    quiz_schedule: "",
    announcement: {
      enabled: false,
      title: "",
      message: "",
    },
  });

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [newSponsor, setNewSponsor] = useState({
    name: "",
    logo_url: "",
    link: "",
  });

  useEffect(() => {
    fetchSettings();
    fetchSponsors();
  }, []);

  const fetchSettings = async () => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast({
        title: "Request Timeout",
        description: "Loading took too long. Please try again.",
        variant: "destructive",
      });
    }, 10000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      const { data } = await supabase.from("site_settings").select("*");

      if (data) {
        const settingsMap: any = {};
        data.forEach((item) => {
          settingsMap[item.key] = item.value;
        });

        setSettings({
          landing_hero_title: settingsMap.landing_hero_title || "",
          landing_hero_subtitle: settingsMap.landing_hero_subtitle || "",
          landing_description: settingsMap.landing_description || "",
          quiz_schedule: settingsMap.quiz_schedule || "",
          announcement: settingsMap.announcement || { enabled: false, title: "", message: "" },
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const fetchSponsors = async () => {
    try {
      const { data } = await supabase
        .from("sponsors")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setSponsors(data);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const updates = [
        { key: "landing_hero_title", value: settings.landing_hero_title },
        { key: "landing_hero_subtitle", value: settings.landing_hero_subtitle },
        { key: "landing_description", value: settings.landing_description },
        { key: "quiz_schedule", value: settings.quiz_schedule },
        { key: "announcement", value: settings.announcement },
      ];

      for (const update of updates) {
        await supabase
          .from("site_settings")
          .upsert(
            { key: update.key, value: update.value },
            { onConflict: "key" }
          );
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSponsor = async () => {
    if (!newSponsor.name) {
      toast({
        title: "Error",
        description: "Sponsor name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("sponsors")
        .insert([
          {
            name: newSponsor.name,
            logo_url: newSponsor.logo_url || null,
            link: newSponsor.link || null,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSponsors([data, ...sponsors]);
      setNewSponsor({ name: "", logo_url: "", link: "" });
      toast({
        title: "Success",
        description: "Sponsor added successfully",
      });
    } catch (error) {
      console.error("Error adding sponsor:", error);
      toast({
        title: "Error",
        description: "Failed to add sponsor",
        variant: "destructive",
      });
    }
  };

  const toggleSponsorStatus = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from("sponsors")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      setSponsors(
        sponsors.map((s) => (s.id === id ? { ...s, is_active: !currentStatus } : s))
      );
    } catch (error) {
      console.error("Error updating sponsor:", error);
      toast({
        title: "Error",
        description: "Failed to update sponsor status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your platform configuration</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="bg-primary hover:bg-primary-light">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      {/* Landing Page Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Landing Page Content
          </CardTitle>
          <CardDescription>Configure your homepage hero section and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hero-title">Hero Title</Label>
            <Input
              id="hero-title"
              value={settings.landing_hero_title}
              onChange={(e) =>
                setSettings({ ...settings, landing_hero_title: e.target.value })
              }
              placeholder="Daily PSC Quiz Competition"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
            <Input
              id="hero-subtitle"
              value={settings.landing_hero_subtitle}
              onChange={(e) =>
                setSettings({ ...settings, landing_hero_subtitle: e.target.value })
              }
              placeholder="Test your knowledge and compete..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={settings.landing_description}
              onChange={(e) =>
                setSettings({ ...settings, landing_description: e.target.value })
              }
              placeholder="Join our daily quiz competitions..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiz Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quiz Schedule
          </CardTitle>
          <CardDescription>Set the daily quiz timing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule Details</Label>
            <Input
              id="schedule"
              value={settings.quiz_schedule}
              onChange={(e) =>
                setSettings({ ...settings, quiz_schedule: e.target.value })
              }
              placeholder="Daily quizzes start at 9:00 AM and end at 9:00 PM"
            />
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
          <CardDescription>Display important messages to your users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="announcement-enabled" className="cursor-pointer">
              Enable Announcement Banner
            </Label>
            <Switch
              id="announcement-enabled"
              checked={settings.announcement.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  announcement: { ...settings.announcement, enabled: checked },
                })
              }
            />
          </div>

          {settings.announcement.enabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Announcement Title</Label>
                <Input
                  id="announcement-title"
                  value={settings.announcement.title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: {
                        ...settings.announcement,
                        title: e.target.value,
                      },
                    })
                  }
                  placeholder="Important Update"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-message">Message</Label>
                <Textarea
                  id="announcement-message"
                  value={settings.announcement.message}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      announcement: {
                        ...settings.announcement,
                        message: e.target.value,
                      },
                    })
                  }
                  placeholder="Enter your announcement message here..."
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sponsor Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Sponsor Management
          </CardTitle>
          <CardDescription>Add and manage quiz sponsors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h3 className="font-semibold">Add New Sponsor</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sponsor-name">Sponsor Name *</Label>
                <Input
                  id="sponsor-name"
                  value={newSponsor.name}
                  onChange={(e) =>
                    setNewSponsor({ ...newSponsor, name: e.target.value })
                  }
                  placeholder="Sponsor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor-logo">Logo URL</Label>
                <Input
                  id="sponsor-logo"
                  value={newSponsor.logo_url}
                  onChange={(e) =>
                    setNewSponsor({ ...newSponsor, logo_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor-link">Website Link</Label>
                <Input
                  id="sponsor-link"
                  value={newSponsor.link}
                  onChange={(e) =>
                    setNewSponsor({ ...newSponsor, link: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
            <Button onClick={addSponsor} className="w-full">
              Add Sponsor
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold">Current Sponsors</h3>
            {sponsors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sponsors added yet</p>
            ) : (
              <div className="space-y-2">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{sponsor.name}</p>
                      {sponsor.link && (
                        <a
                          href={sponsor.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {sponsor.link}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={sponsor.is_active}
                        onCheckedChange={() =>
                          toggleSponsorStatus(sponsor.id, sponsor.is_active)
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {sponsor.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
