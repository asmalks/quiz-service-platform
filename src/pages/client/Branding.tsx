import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Palette } from "lucide-react";
import { ClientAdminSession } from "@/components/client/ClientAdminLayout";

const ClientBranding = () => {
    const session = useOutletContext<ClientAdminSession>();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [branding, setBranding] = useState({
        logo_url: "",
        primary_color: "#6366f1",
        secondary_color: "#8b5cf6",
        background_color: "#ffffff",
        headline: "",
        subheadline: "",
    });

    useEffect(() => {
        fetchBranding();
    }, [session]);

    const fetchBranding = async () => {
        try {
            const { data, error } = await supabase
                .from("quiz_clients")
                .select("logo_url, primary_color, secondary_color, background_color, headline, subheadline")
                .eq("id", session.client_id)
                .single();

            if (error) throw error;
            if (data) {
                setBranding({
                    logo_url: data.logo_url || "",
                    primary_color: data.primary_color || "#6366f1",
                    secondary_color: data.secondary_color || "#8b5cf6",
                    background_color: data.background_color || "#ffffff",
                    headline: data.headline || "",
                    subheadline: data.subheadline || "",
                });
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveBranding = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from("quiz_clients")
                .update({
                    logo_url: branding.logo_url || null,
                    primary_color: branding.primary_color,
                    secondary_color: branding.secondary_color,
                    background_color: branding.background_color,
                    headline: branding.headline || null,
                    subheadline: branding.subheadline || null,
                })
                .eq("id", session.client_id);

            if (error) throw error;
            toast({ title: "Success", description: "Branding updated successfully" });
        } catch (error) {
            console.error("Error:", error);
            toast({ title: "Error", description: "Failed to save branding", variant: "destructive" });
        } finally {
            setSaving(false);
        }
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
                    <h1 className="text-3xl font-bold text-foreground">Branding</h1>
                    <p className="text-muted-foreground">Customize your quiz appearance</p>
                </div>
                <Button onClick={saveBranding} disabled={saving} className="bg-primary hover:bg-primary-light">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Brand Settings
                    </CardTitle>
                    <CardDescription>These settings apply to all your quiz pages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                            value={branding.logo_url}
                            onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                            placeholder="https://example.com/logo.png"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input
                                value={branding.headline}
                                onChange={(e) => setBranding({ ...branding, headline: e.target.value })}
                                placeholder="Welcome to our quiz!"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subheadline</Label>
                            <Input
                                value={branding.subheadline}
                                onChange={(e) => setBranding({ ...branding, subheadline: e.target.value })}
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
                                    value={branding.primary_color}
                                    onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                                    className="h-9 w-12 rounded cursor-pointer border"
                                />
                                <Input value={branding.primary_color} onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })} className="flex-1" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={branding.secondary_color}
                                    onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                                    className="h-9 w-12 rounded cursor-pointer border"
                                />
                                <Input value={branding.secondary_color} onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })} className="flex-1" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Background Color</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={branding.background_color}
                                    onChange={(e) => setBranding({ ...branding, background_color: e.target.value })}
                                    className="h-9 w-12 rounded cursor-pointer border"
                                />
                                <Input value={branding.background_color} onChange={(e) => setBranding({ ...branding, background_color: e.target.value })} className="flex-1" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className="rounded-lg p-8 text-center"
                        style={{
                            backgroundColor: branding.background_color,
                            border: `2px solid ${branding.primary_color}`,
                        }}
                    >
                        {branding.logo_url && (
                            <img
                                src={branding.logo_url}
                                alt="Logo"
                                className="h-16 mx-auto mb-4 object-contain"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        )}
                        <h2 style={{ color: branding.primary_color }} className="text-2xl font-bold">
                            {branding.headline || session.client_name}
                        </h2>
                        <p style={{ color: branding.secondary_color }} className="mt-2">
                            {branding.subheadline || "Your quiz subheadline"}
                        </p>
                        <button
                            className="mt-6 px-8 py-3 rounded-lg text-white font-medium"
                            style={{ backgroundColor: branding.primary_color }}
                        >
                            Start Quiz
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ClientBranding;
