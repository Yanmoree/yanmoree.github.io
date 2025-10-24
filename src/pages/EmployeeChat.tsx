import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Clock, User } from "lucide-react";
import EmployeeChatWindow from "@/components/EmployeeChatWindow";

interface ChatSession {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
  } | null;
}

const EmployeeChat = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [isEmployee, setIsEmployee] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkEmployeeRole();
    }
  }, [user, authLoading, navigate]);

  const checkEmployeeRole = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasEmployeeRole = data?.some(
      (r) => r.role === "employee" || r.role === "admin"
    );

    if (!hasEmployeeRole) {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для просмотра этой страницы",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsEmployee(true);
    loadSessions();
  };

  const loadSessions = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from("chat_sessions")
        .select("id, user_id, status, created_at")
        .eq("escalated_to_employee", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get profiles and last messages
      const sessionsWithData = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", session.user_id)
            .single();

          const { data: messages } = await supabase
            .from("chat_messages")
            .select("content, created_at")
            .eq("session_id", session.id)
            .order("created_at", { ascending: false })
            .limit(1);

          return {
            ...session,
            profiles: profile || { full_name: null, email: null },
            last_message: messages?.[0] || null,
          };
        })
      );

      setSessions(sessionsWithData as ChatSession[]);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить чаты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isEmployee) return;

    // Subscribe to new escalated sessions
    const channel = supabase
      .channel("chat-sessions-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
        },
        () => {
          loadSessions();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_sessions",
        },
        () => {
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isEmployee]);

  if (authLoading || !isEmployee) return null;

  if (selectedSession) {
    return (
      <EmployeeChatWindow
        sessionId={selectedSession}
        onClose={() => {
          setSelectedSession(null);
          loadSessions();
        }}
      />
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Чаты с клиентами</h1>
          <p className="text-muted-foreground">
            Обращения, требующие помощи сотрудника
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Загрузка...
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет активных обращений</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedSession(session.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {session.profiles?.full_name || "Клиент"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {session.profiles?.email}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        session.status === "active"
                          ? "default"
                          : session.status === "escalated"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {session.status === "active"
                        ? "Активен"
                        : session.status === "escalated"
                        ? "Требует внимания"
                        : "Завершен"}
                    </Badge>
                  </div>
                </CardHeader>
                {session.last_message && (
                  <CardContent>
                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="flex-1 text-muted-foreground line-clamp-2">
                        {session.last_message.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(session.created_at).toLocaleString("ru")}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeChat;
