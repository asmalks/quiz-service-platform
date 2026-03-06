import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ClientTheme {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    background_color: string;
    headline: string | null;
    subheadline: string | null;
}

const DEFAULT_THEME: ClientTheme = {
    id: "",
    name: "Quiz",
    slug: "",
    logo_url: null,
    primary_color: "#6366f1",
    secondary_color: "#8b5cf6",
    background_color: "#ffffff",
    headline: null,
    subheadline: null,
};

export function useClientTheme(clientSlug: string | undefined) {
    const [theme, setTheme] = useState<ClientTheme>(DEFAULT_THEME);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!clientSlug) {
            setLoading(false);
            return;
        }

        const fetchTheme = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from("quiz_clients")
                    .select("*")
                    .eq("slug", clientSlug)
                    .eq("is_active", true)
                    .single();

                if (fetchError || !data) {
                    setError("Client not found or inactive");
                    setLoading(false);
                    return;
                }

                setTheme({
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    logo_url: data.logo_url,
                    primary_color: data.primary_color || "#6366f1",
                    secondary_color: data.secondary_color || "#8b5cf6",
                    background_color: data.background_color || "#ffffff",
                    headline: data.headline,
                    subheadline: data.subheadline,
                });
            } catch (err) {
                setError("Failed to load client theme");
            } finally {
                setLoading(false);
            }
        };

        fetchTheme();
    }, [clientSlug]);

    // Apply CSS custom properties to the page
    useEffect(() => {
        if (!clientSlug || error) return;

        const root = document.documentElement;
        root.style.setProperty("--client-primary", theme.primary_color);
        root.style.setProperty("--client-secondary", theme.secondary_color);
        root.style.setProperty("--client-bg", theme.background_color);

        return () => {
            root.style.removeProperty("--client-primary");
            root.style.removeProperty("--client-secondary");
            root.style.removeProperty("--client-bg");
        };
    }, [theme, clientSlug, error]);

    return { theme, loading, error };
}
