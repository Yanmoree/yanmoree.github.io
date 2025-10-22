import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const supportSchema = z.object({
  name: z.string().min(2, "Имя должно быть минимум 2 символа").max(100),
  email: z.string().email("Некорректный email").max(255),
  subject: z.string().min(3, "Тема должна быть минимум 3 символа").max(200),
  message: z.string().min(10, "Сообщение должно быть минимум 10 символов").max(1000),
});

const Support = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      supportSchema.parse(formData);

      const { error } = await supabase.from("support_messages").insert({
        user_id: user?.id,
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      if (error) throw error;

      toast.success("Сообщение отправлено! Мы свяжемся с вами в ближайшее время.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error("Ошибка при отправке сообщения");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Поддержка
          </h1>
          <p className="text-muted-foreground text-lg">
            Свяжитесь с нами любым удобным способом
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardContent className="pt-6 space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Phone className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-semibold">Телефон</h3>
              <p className="text-muted-foreground">+7 (495) 123-45-67</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <CardContent className="pt-6 space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-muted-foreground">info@a-shtrih.ru</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <CardContent className="pt-6 space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-semibold">Адрес</h3>
              <p className="text-muted-foreground">Москва, ул. Примерная, д. 1</p>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle>Напишите нам</CardTitle>
            <CardDescription>
              Заполните форму и мы свяжемся с вами в ближайшее время
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя *</Label>
                  <Input
                    id="name"
                    placeholder="Ваше имя"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Тема *</Label>
                <Input
                  id="subject"
                  placeholder="Тема обращения"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Сообщение *</Label>
                <Textarea
                  id="message"
                  placeholder="Опишите ваш вопрос или проблему"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
              </div>
              <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Отправка..." : "Отправить сообщение"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
