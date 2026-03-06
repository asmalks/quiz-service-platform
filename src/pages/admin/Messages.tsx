import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Trash2, Check, Loader2 } from "lucide-react";
import { formatToIST } from "@/lib/dateUtils";

interface Message {
  id: string;
  name: string;
  email: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setMessages(messages.filter(m => m.id !== id));
      toast({
        title: "Deleted",
        description: "Message deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">
            Feedback and ideas from your community
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {unreadCount} Unread
          </Badge>
        )}
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card 
              key={msg.id} 
              className={`transition-all ${!msg.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {msg.name}
                      {!msg.is_read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </CardTitle>
                    {msg.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {msg.email}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatToIST(msg.created_at)}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap mb-4">{msg.message}</p>
                <div className="flex gap-2">
                  {!msg.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(msg.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMessage(msg.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
