import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";

const ClientLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast({
                title: "Error",
                description: "Email and password are required",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase.rpc("verify_client_admin_login", {
                p_email: email,
                p_password: password,
            });

            if (error) throw error;

            if (!data || data.length === 0) {
                toast({
                    title: "Login Failed",
                    description: "Invalid email or password",
                    variant: "destructive",
                });
                return;
            }

            const admin = data[0];

            // Store client admin session in localStorage
            const session = {
                admin_id: admin.admin_id,
                client_id: admin.admin_client_id,
                email: admin.admin_email,
                role: admin.admin_role,
                client_name: admin.client_name,
                client_slug: admin.client_slug,
                logged_in_at: new Date().toISOString(),
            };

            localStorage.setItem("client_admin_session", JSON.stringify(session));

            toast({
                title: "Welcome!",
                description: `Logged in as ${admin.client_name} admin`,
            });

            navigate("/client/dashboard");
        } catch (error: any) {
            console.error("Login error:", error);
            toast({
                title: "Error",
                description: "Login failed. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Client Admin Login
                    </CardTitle>
                    <CardDescription>
                        Sign in to manage your quiz campaigns
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-light"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ClientLogin;
