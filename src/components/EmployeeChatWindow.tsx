import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2, User, Bot, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant" | "employee";
  content: string;
  created_at: string;
}

interface EmployeeChatWindowProps {
  sessionId: string;
  onClose: () => void;
}

const EmployeeChatWindow = ({ sessionId, onClose }: EmployeeChatWindowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    loadMessages();
    loadClientInfo();
  }, [sessionId]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-messages-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionId]);

  const loadClientInfo = async () => {
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (session?.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user_id)
        .single();
      
      setClientName(profile?.full_name || "Клиент");
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить сообщения",
        variant: "destructive",
      });
      return;
    }

    setMessages((data || []) as Message[]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("chat_messages").insert({
        session_id: sessionId,
        user_id: user.id,
        role: "employee",
        content: input.trim(),
      });

      if (error) throw error;

      setInput("");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const endChat = async () => {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ status: "resolved" })
        .eq("id", sessionId);

      if (error) throw error;

      toast({
        title: "Чат завершен",
        description: "Обращение успешно закрыто",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось завершить чат",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-120px)] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle>Чат с {clientName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Обращение клиента
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={endChat}>
                Завершить чат
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "employee" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role !== "employee" && (
                      <div className="flex-shrink-0">
                        {msg.role === "user" ? (
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          msg.role === "employee"
                            ? "bg-accent text-accent-foreground"
                            : msg.role === "user"
                            ? "bg-muted"
                            : "bg-primary/10"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-xs text-muted-foreground px-2">
                        {new Date(msg.created_at).toLocaleTimeString("ru", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {msg.role === "employee" && (
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                          <UserCog className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-6 border-t">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Напишите ответ..."
                  disabled={loading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  size="icon"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeChatWindow;
