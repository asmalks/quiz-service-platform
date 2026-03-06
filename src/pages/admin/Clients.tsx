import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Globe, Eye, Pencil, Copy, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface QuizClient {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    background_color: string | null;
    headline: string | null;
    subheadline: string | null;
    badge_text: string | null;
    is_active: boolean | null;
    created_at: string;
}

const Clients = () => {
    const [clients, setClients] = useState<QuizClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const { toast } = useToast();

    const [newClient, setNewClient] = useState({
        name: "",
        slug: "",
        logo_url: "",
        primary_color: "#6366f1",
        secondary_color: "#8b5cf6",
        background_color: "#ffffff",
        headline: "",
        subheadline: "",
        badge_text: "",
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from("quiz_clients")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error("Error fetching clients:", error);
            toast({
                title: "Error",
                description: "Failed to load clients",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const handleNameChange = (name: string) => {
        setNewClient({
            ...newClient,
            name,
            slug: generateSlug(name),
        });
    };

    const createClient = async () => {
        if (!newClient.name || !newClient.slug) {
            toast({
                title: "Error",
                description: "Client name and slug are required",
                variant: "destructive",
            });
            return;
        }

        try {
            setCreating(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from("quiz_clients")
                .insert([{
                    name: newClient.name,
                    slug: newClient.slug,
                    logo_url: newClient.logo_url || null,
                    primary_color: newClient.primary_color,
                    secondary_color: newClient.secondary_color,
                    background_color: newClient.background_color,
                    headline: newClient.headline || null,
                    subheadline: newClient.subheadline || null,
                    badge_text: newClient.badge_text || null,
                    created_by: session.user.id,
                }])
                .select()
                .single();

            if (error) throw error;

            setClients([data, ...clients]);
            setNewClient({
                name: "",
                slug: "",
                logo_url: "",
                primary_color: "#6366f1",
                secondary_color: "#8b5cf6",
                background_color: "#ffffff",
                headline: "",
                subheadline: "",
                badge_text: "",
            });
            setDialogOpen(false);
            toast({
                title: "Success",
                description: "Client campaign created successfully",
            });
        } catch (error: any) {
            console.error("Error creating client:", error);
            toast({
                title: "Error",
                description: error.message?.includes("duplicate")
                    ? "A client with this slug already exists"
                    : "Failed to create client",
                variant: "destructive",
            });
        } finally {
            setCreating(false);
        }
    };

    const toggleClientStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("quiz_clients")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            if (error) throw error;

            setClients(
                clients.map((c) =>
                    c.id === id ? { ...c, is_active: !currentStatus } : c
                )
            );
            toast({
                title: "Success",
                description: `Client ${!currentStatus ? "enabled" : "disabled"} successfully`,
            });
        } catch (error) {
            console.error("Error toggling client:", error);
            toast({
                title: "Error",
                description: "Failed to update client status",
                variant: "destructive",
            });
        }
    };

    const copyQuizUrl = (slug: string) => {
        const url = `${window.location.origin}/quiz/${slug}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Copied!",
            description: "Quiz URL copied to clipboard",
        });
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Client Campaigns</h1>
                    <p className="text-muted-foreground">
                        Manage external organizations using the quiz platform
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary-light">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Client Campaign</DialogTitle>
                            <DialogDescription>
                                Set up a new organization to run quizzes with their own branding.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client-name">Organization Name *</Label>
                                    <Input
                                        id="client-name"
                                        value={newClient.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        placeholder="e.g. XYZ Coaching"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="client-slug">URL Slug *</Label>
                                    <Input
                                        id="client-slug"
                                        value={newClient.slug}
                                        onChange={(e) =>
                                            setNewClient({ ...newClient, slug: e.target.value })
                                        }
                                        placeholder="e.g. xyz-coaching"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        URL: /quiz/{newClient.slug || "slug"}/...
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client-logo">Logo URL</Label>
                                <Input
                                    id="client-logo"
                                    value={newClient.logo_url}
                                    onChange={(e) =>
                                        setNewClient({ ...newClient, logo_url: e.target.value })
                                    }
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client-headline">Headline</Label>
                                <Input
                                    id="client-headline"
                                    value={newClient.headline}
                                    onChange={(e) =>
                                        setNewClient({ ...newClient, headline: e.target.value })
                                    }
                                    placeholder="Welcome to our quiz competition!"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client-subheadline">Subheadline</Label>
                                <Input
                                    id="client-subheadline"
                                    value={newClient.subheadline}
                                    onChange={(e) =>
                                        setNewClient({ ...newClient, subheadline: e.target.value })
                                    }
                                    placeholder="Test your knowledge and compete..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="client-badge-text">Top Badge Text</Label>
                                <Input
                                    id="client-badge-text"
                                    value={newClient.badge_text}
                                    onChange={(e) =>
                                        setNewClient({ ...newClient, badge_text: e.target.value })
                                    }
                                    placeholder="e.g. PSC BRO Quiz"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primary-color">Primary Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={newClient.primary_color}
                                            onChange={(e) =>
                                                setNewClient({ ...newClient, primary_color: e.target.value })
                                            }
                                            className="h-9 w-12 rounded cursor-pointer border"
                                        />
                                        <Input
                                            id="primary-color"
                                            value={newClient.primary_color}
                                            onChange={(e) =>
                                                setNewClient({ ...newClient, primary_color: e.target.value })
                                            }
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secondary-color">Secondary Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={newClient.secondary_color}
                                            onChange={(e) =>
                                                setNewClient({ ...newClient, secondary_color: e.target.value })
                                            }
                                            className="h-9 w-12 rounded cursor-pointer border"
                                        />
                                        <Input
                                            id="secondary-color"
                                            value={newClient.secondary_color}
                                            onChange={(e) =>
                                                setNewClient({ ...newClient, secondary_color: e.target.value })
                                            }
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bg-color">Background Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={newClient.background_color}
                                            onChange={(e) =>
                                                setNewClient({ ...newClient, background_color: e.target.value })
                                            }
                                            className="h-9 w-12 rounded cursor-pointer border"
                                        />
                                        <Input
                                            id="bg-color"
                                            value={newClient.background_color}
                                            onChange={(e) =>
                                                setNewClient({ ...newClient, background_color: e.target.value })
                                            }
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="rounded-lg border p-4 space-y-2">
                                <p className="text-xs text-muted-foreground font-medium">PREVIEW</p>
                                <div
                                    className="rounded-lg p-6 text-center"
                                    style={{
                                        backgroundColor: newClient.background_color,
                                        border: `2px solid ${newClient.primary_color}`,
                                    }}
                                >
                                    {newClient.logo_url && (
                                        <img
                                            src={newClient.logo_url}
                                            alt="Logo preview"
                                            className="h-12 mx-auto mb-3 object-contain"
                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                        />
                                    )}
                                    <div className="mb-2">
                                        <Badge style={{ backgroundColor: newClient.primary_color, color: "#fff" }} className="px-3 py-1 shadow-sm text-xs font-semibold">
                                            {newClient.badge_text || newClient.name || "Badge Text"}
                                        </Badge>
                                    </div>
                                    <h3
                                        style={{ color: newClient.primary_color }}
                                        className="text-xl font-bold"
                                    >
                                        {newClient.headline || newClient.name || "Headline"}
                                    </h3>
                                    <p
                                        style={{ color: newClient.secondary_color }}
                                        className="text-sm mt-1"
                                    >
                                        {newClient.subheadline || "Subheadline text goes here"}
                                    </p>
                                    <button
                                        className="mt-4 px-6 py-2 rounded-lg text-white text-sm font-medium"
                                        style={{ backgroundColor: newClient.primary_color }}
                                    >
                                        Start Quiz
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={createClient}
                                disabled={creating}
                                className="w-full bg-primary hover:bg-primary-light"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Client Campaign
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Client List */}
            {clients.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Clients Yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create your first client campaign to get started
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((client) => (
                        <Card
                            key={client.id}
                            className={`hover:shadow-lg transition-all duration-300 border-2 ${client.is_active
                                ? "hover:border-primary"
                                : "opacity-60 border-dashed"
                                }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {client.logo_url ? (
                                            <img
                                                src={client.logo_url}
                                                alt={client.name}
                                                className="h-10 w-10 rounded-lg object-contain border"
                                            />
                                        ) : (
                                            <div
                                                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                style={{
                                                    backgroundColor: client.primary_color || "#6366f1",
                                                }}
                                            >
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <CardTitle className="text-base">{client.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground">
                                                /{client.slug}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={client.is_active ? "default" : "secondary"}
                                        className="text-xs"
                                    >
                                        {client.is_active ? "Active" : "Disabled"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Color preview */}
                                <div className="flex gap-1">
                                    <div
                                        className="h-6 flex-1 rounded-l"
                                        style={{ backgroundColor: client.primary_color || "#6366f1" }}
                                    />
                                    <div
                                        className="h-6 flex-1"
                                        style={{ backgroundColor: client.secondary_color || "#8b5cf6" }}
                                    />
                                    <div
                                        className="h-6 flex-1 rounded-r border"
                                        style={{ backgroundColor: client.background_color || "#ffffff" }}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Link to={`/admin/clients/${client.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Pencil className="mr-1 h-3 w-3" />
                                            Manage
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyQuizUrl(client.slug)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <div className="flex items-center">
                                        <Switch
                                            checked={client.is_active ?? true}
                                            onCheckedChange={() =>
                                                toggleClientStatus(client.id, client.is_active ?? true)
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Clients;
