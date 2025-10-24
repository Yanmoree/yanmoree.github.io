import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="container py-10">
        <Card className="max-w-2xl mx-auto animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Профиль
          </h1>
          <p className="text-muted-foreground">Управление вашим аккаунтом</p>
        </div>

        <Card className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {user.user_metadata?.full_name || "Пользователь"}
                    {isAdmin && (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Админ
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Информация о вашем аккаунте</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Полное имя</p>
                  <p className="font-medium">
                    {user.user_metadata?.full_name || "Не указано"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Роль</p>
                  <p className="font-medium">{isAdmin ? "Администратор" : "Пользователь"}</p>
                </div>
              </div>
            </div>

            <Button onClick={() => navigate("/profile/edit")} className="w-full">
              Редактировать профиль
            </Button>

            <div className="pt-4 border-t">
            </div>

            <div className="pt-4 border-t">
              <Button variant="destructive" onClick={signOut} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти из аккаунта
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
