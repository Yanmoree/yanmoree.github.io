import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, LogOut, Phone, MapPin, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  {profile?.full_name || "Пользователь"}
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
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {profile?.full_name && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">ФИО</p>
                    <p className="font-medium break-words">{profile.full_name}</p>
                  </div>
                </div>
              )}

              {profile?.phone && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Телефон</p>
                    <p className="font-medium break-words">{profile.phone}</p>
                  </div>
                </div>
              )}

              {(user.email || profile?.email) && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Почта</p>
                    <p className="font-medium break-words">{profile?.email || user.email}</p>
                  </div>
                </div>
              )}

              {profile?.city && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Город</p>
                    <p className="font-medium break-words">{profile.city}</p>
                  </div>
                </div>
              )}

              {profile?.address && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Адрес</p>
                    <p className="font-medium break-words">{profile.address}</p>
                  </div>
                </div>
              )}

              {profile?.company && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Компания</p>
                    <p className="font-medium break-words">{profile.company}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
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
