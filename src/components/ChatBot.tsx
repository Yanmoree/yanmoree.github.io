import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, User, Bot, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant" | "employee";
  content: string;
  timestamp: Date;
}

const ChatBot = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [waitingForEmployee, setWaitingForEmployee] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!user || !sessionId) return;

    // Subscribe to new messages in this session
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.user_id !== user.id && newMessage.role === 'employee') {
            setMessages(prev => [...prev, {
              role: 'employee',
              content: newMessage.content,
              timestamp: new Date(newMessage.created_at),
            }]);
            setWaitingForEmployee(false);
          }
        }
      )
      .subscribe();

    // Check session status
    const sessionChannel = supabase
      .channel('chat-sessions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const session = payload.new as any;
          if (session.escalated_to_employee) {
            setEscalated(true);
            setWaitingForEmployee(true);
          }
          if (session.status === 'resolved') {
            toast({
              title: "Чат завершен",
              description: "Сотрудник завершил обращение",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(sessionChannel);
    };
  }, [user, sessionId]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      if (escalated) {
        // Send directly to database when escalated
        const { error } = await supabase.from('chat_messages').insert({
          session_id: sessionId,
          user_id: user.id,
          role: 'user',
          content: userMessage.content,
        });

        if (error) throw error;
      } else {
        // Send to bot
        const { data, error } = await supabase.functions.invoke('chat-bot', {
          body: { message: userMessage.content, sessionId },
        });

        if (error) throw error;

        setSessionId(data.sessionId);

        if (data.message) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          }]);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить сообщение",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const escalateToEmployee = async () => {
    if (!sessionId || !user) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          escalated_to_employee: true,
          status: 'escalated',
        })
        .eq('id', sessionId);

      if (error) throw error;

      setEscalated(true);
      setWaitingForEmployee(true);

      toast({
        title: "Запрос отправлен",
        description: "Ожидайте подключения сотрудника",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось связаться с сотрудником",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-semibold">
                {escalated ? "Чат с сотрудником" : "Помощник"}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Здравствуйте! Чем могу помочь?</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role !== "user" && (
                    <div className="flex-shrink-0">
                      {msg.role === "employee" ? (
                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {waitingForEmployee && (
                <div className="text-center text-muted-foreground py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p>Ожидаем подключения сотрудника...</p>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t space-y-2">
            {!escalated && messages.length > 0 && (
              <Button
                variant="outline"
                onClick={escalateToEmployee}
                className="w-full"
                size="sm"
              >
                Связаться с сотрудником
              </Button>
            )}

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder={
                  escalated
                    ? "Сообщение сотруднику..."
                    : "Напишите ваш вопрос..."
                }
                disabled={loading || waitingForEmployee}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim() || waitingForEmployee}
                size="icon"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default ChatBot;
