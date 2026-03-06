import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
    Loader2, Save, ArrowLeft, Trash2, UserPlus, KeyRound, Eye, ClipboardList, Copy
} from "lucide-react";
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

interface ClientAdmin {
    id: string;
    email: string;
    is_active: boolean | null;
    created_at: string;
}

interface ClientQuiz {
    id: string;
    title: string;
    status: string;
    start_time: string;
    end_time: string;
}

const ClientDetail = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [client, setClient] = useState<QuizClient | null>(null);
    const [admins, setAdmins] = useState<ClientAdmin[]>([]);
    const [quizzes, setQuizzes] = useState<ClientQuiz[]>([]);

    // New admin form
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [newAdminPassword, setNewAdminPassword] = useState("");
    const [creatingAdmin, setCreatingAdmin] = useState(false);
    const [adminDialogOpen, setAdminDialogOpen] = useState(false);

    // Reset password
    const [resetAdminId, setResetAdminId] = useState<string | null>(null);
    const [resetPassword, setResetPassword] = useState("");
    const [resetDialogOpen, setResetDialogOpen] = useState(false);

    useEffect(() => {
        if (clientId) {
            fetchClientData();
        }
    }, [clientId]);

    const fetchClientData = async () => {
        try {
            // Fetch client
            const { data: clientData, error: clientError } = await supabase
                .from("quiz_clients")
                .select("*")
                .eq("id", clientId)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            // Fetch client admins
            const { data: adminData } = await supabase
                .from("client_admins")
                .select("id, email, is_active, created_at")
                .eq("client_id", clientId)
                .order("created_at", { ascending: false });

            setAdmins(adminData || []);

            // Fetch client quizzes
            const { data: quizData } = await supabase
                .from("quizzes")
                .select("id, title, status, start_time, end_time")
                .eq("client_id", clientId)
                .order("created_at", { ascending: false });

            setQuizzes(quizData || []);
        } catch (error) {
            console.error("Error fetching client:", error);
            toast({
                title: "Error",
                description: "Failed to load client data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const saveClient = async () => {
        if (!client) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from("quiz_clients")
                .update({
                    name: client.name,
                    slug: client.slug,
                    logo_url: client.logo_url,
                    primary_color: client.primary_color,
                    secondary_color: client.secondary_color,
                    background_color: client.background_color,
                    headline: client.headline,
                    subheadline: client.subheadline,
                    badge_text: client.badge_text,
                })
                .eq("id", client.id);

            if (error) throw error;
            toast({ title: "Success", description: "Client updated successfully" });
        } catch (error: any) {
            console.error("Error saving client:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save client",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const createAdmin = async () => {
        if (!newAdminEmail || !newAdminPassword || !clientId) {
            toast({
                title: "Error",
                description: "Email and password are required",
                variant: "destructive",
            });
            return;
        }

        try {
            setCreatingAdmin(true);
            const { data, error } = await supabase.rpc("create_client_admin", {
                p_client_id: clientId,
                p_email: newAdminEmail,
                p_password: newAdminPassword,
            });

            if (error) throw error;

            setAdmins([
                {
                    id: data,
                    email: newAdminEmail,
                    is_active: true,
                    created_at: new Date().toISOString(),
                },
                ...admins,
            ]);
            setNewAdminEmail("");
            setNewAdminPassword("");
            setAdminDialogOpen(false);
            toast({
                title: "Success",
                description: "Client admin created successfully",
            });
        } catch (error: any) {
            console.error("Error creating admin:", error);
            toast({
                title: "Error",
                description: error.message?.includes("duplicate")
                    ? "An admin with this email already exists"
                    : error.message || "Failed to create admin",
                variant: "destructive",
            });
        } finally {
            setCreatingAdmin(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetAdminId || !resetPassword) return;

        try {
            const { error } = await supabase.rpc("reset_client_admin_password", {
                p_admin_id: resetAdminId,
                p_new_password: resetPassword,
            });

            if (error) throw error;

            setResetPassword("");
            setResetDialogOpen(false);
            setResetAdminId(null);
            toast({
                title: "Success",
                description: "Password reset successfully",
            });
        } catch (error) {
            console.error("Error resetting password:", error);
            toast({
                title: "Error",
                description: "Failed to reset password",
                variant: "destructive",
            });
        }
    };

    const copyLoginLink = (email: string) => {
        const loginUrl = `${window.location.origin}/client/login`;
        const textToCopy = `Admin Login URL: ${loginUrl}\nEmail: ${email}`;
        navigator.clipboard.writeText(textToCopy);
        toast({
            title: "Copied!",
            description: "Login link and email copied to clipboard",
        });
    };

    const deleteQuiz = async (quizId: string) => {
        try {
            const { error } = await supabase
                .from("quizzes")
                .delete()
                .eq("id", quizId);

            if (error) throw error;
            setQuizzes(quizzes.filter((q) => q.id !== quizId));
            toast({ title: "Success", description: "Quiz deleted" });
        } catch (error) {
            console.error("Error deleting quiz:", error);
            toast({
                title: "Error",
                description: "Failed to delete quiz",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">Client not found.</p>
                <Link to="/admin/clients">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Clients
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Link to="/admin/clients">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
                        <p className="text-muted-foreground">/{client.slug}</p>
                    </div>
                </div>
                <Button
                    onClick={saveClient}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-light"
                >
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                </Button>
            </div>

            {/* Branding Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>
                        Customize how quizzes appear for this client
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Organization Name</Label>
                            <Input
                                value={client.name}
                                onChange={(e) => setClient({ ...client, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL Slug</Label>
                            <Input
                                value={client.slug}
                                onChange={(e) => setClient({ ...client, slug: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                            value={client.logo_url || ""}
                            onChange={(e) =>
                                setClient({ ...client, logo_url: e.target.value || null })
                            }
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Top Badge Text</Label>
                        <Input
                            value={client.badge_text || ""}
                            onChange={(e) =>
                                setClient({ ...client, badge_text: e.target.value || null })
                            }
                            placeholder="e.g. PSC BRO Quiz"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input
                                value={client.headline || ""}
                                onChange={(e) =>
                                    setClient({ ...client, headline: e.target.value || null })
                                }
                                placeholder="Welcome to our quiz!"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subheadline</Label>
                            <Input
                                value={client.subheadline || ""}
                                onChange={(e) =>
                                    setClient({ ...client, subheadline: e.target.value || null })
                                }
                                placeholder="Test your knowledge..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={client.primary_color || "#6366f1"}
                                    onChange={(e) =>
                                        setClient({ ...client, primary_color: e.target.value })
                                    }
                                    className="h-9 w-12 rounded cursor-pointer border"
                                />
                                <Input
                                    value={client.primary_color || ""}
                                    onChange={(e) =>
                                        setClient({ ...client, primary_color: e.target.value })
                                    }
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={client.secondary_color || "#8b5cf6"}
                                    onChange={(e) =>
                                        setClient({ ...client, secondary_color: e.target.value })
                                    }
                                    className="h-9 w-12 rounded cursor-pointer border"
                                />
                                <Input
                                    value={client.secondary_color || ""}
                                    onChange={(e) =>
                                        setClient({ ...client, secondary_color: e.target.value })
                                    }
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Background Color</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={client.background_color || "#ffffff"}
                                    onChange={(e) =>
                                        setClient({ ...client, background_color: e.target.value })
                                    }
                                    className="h-9 w-12 rounded cursor-pointer border"
                                />
                                <Input
                                    value={client.background_color || ""}
                                    onChange={(e) =>
                                        setClient({ ...client, background_color: e.target.value })
                                    }
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Branding Preview */}
                    <div className="rounded-lg border p-4 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">PREVIEW</p>
                        <div
                            className="rounded-lg p-6 text-center"
                            style={{
                                backgroundColor: client.background_color || "#ffffff",
                                border: `2px solid ${client.primary_color || "#6366f1"}`,
                            }}
                        >
                            {client.logo_url && (
                                <img
                                    src={client.logo_url}
                                    alt="Logo"
                                    className="h-12 mx-auto mb-3 object-contain"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                            )}
                            <div className="mb-2">
                                <Badge style={{ backgroundColor: client.primary_color || "#6366f1", color: "#fff" }} className="px-3 py-1 shadow-sm text-xs font-semibold">
                                    {client.badge_text || client.name}
                                </Badge>
                            </div>
                            <h3
                                style={{ color: client.primary_color || "#6366f1" }}
                                className="text-xl font-bold"
                            >
                                {client.headline || client.name}
                            </h3>
                            <p
                                style={{ color: client.secondary_color || "#8b5cf6" }}
                                className="text-sm mt-1"
                            >
                                {client.subheadline || "Subheadline text"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Client Admins */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Client Admins</CardTitle>
                            <CardDescription>
                                Manage admin accounts for this client
                            </CardDescription>
                        </div>
                        <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Admin
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Client Admin</DialogTitle>
                                    <DialogDescription>
                                        This account can only manage quizzes for {client.name}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={newAdminEmail}
                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                            placeholder="admin@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password</Label>
                                        <Input
                                            type="password"
                                            value={newAdminPassword}
                                            onChange={(e) => setNewAdminPassword(e.target.value)}
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>
                                    <Button
                                        onClick={createAdmin}
                                        disabled={creatingAdmin}
                                        className="w-full"
                                    >
                                        {creatingAdmin ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <UserPlus className="mr-2 h-4 w-4" />
                                        )}
                                        Create Admin
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No admins created yet
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {admins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{admin.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Created: {new Date(admin.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={admin.is_active ? "default" : "secondary"}>
                                            {admin.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyLoginLink(admin.email)}
                                            title="Copy Login Details"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setResetAdminId(admin.id);
                                                setResetDialogOpen(true);
                                            }}
                                            title="Reset Password"
                                        >
                                            <KeyRound className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reset Password Dialog */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Admin Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>
                        <Button onClick={handleResetPassword} className="w-full">
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset Password
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Client Quizzes */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Client Quizzes</CardTitle>
                            <CardDescription>
                                Quizzes belonging to this client campaign
                            </CardDescription>
                        </div>
                        <Link to={`/admin/quizzes/create?clientId=${clientId}`}>
                            <Button size="sm">
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Create Quiz
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {quizzes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No quizzes created for this client yet
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {quizzes.map((quiz) => (
                                <div
                                    key={quiz.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{quiz.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(quiz.start_time).toLocaleString()} —{" "}
                                            {new Date(quiz.end_time).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                quiz.status === "published"
                                                    ? "default"
                                                    : quiz.status === "draft"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {quiz.status}
                                        </Badge>
                                        <Link to={`/admin/quizzes/edit/${quiz.id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteQuiz(quiz.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ClientDetail;
