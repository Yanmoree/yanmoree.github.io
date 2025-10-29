import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, Package, Mail, Home, Shield, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const location = useLocation();
  const { user, isAdmin, isEmployee, signOut } = useAuth();

  const { data: cartCount } = useQuery({
    queryKey: ["cartCount", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            А-Штрих
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Главная</span>
            </Button>
          </Link>
          
          <Link to="/catalog">
            <Button
              variant={isActive("/catalog") ? "default" : "ghost"}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Каталог</span>
            </Button>
          </Link>

          <Link to="/support">
            <Button
              variant={isActive("/support") ? "default" : "ghost"}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Поддержка</span>
            </Button>
          </Link>

          {user && (
            <Link to="/cart">
              <Button
                variant={isActive("/cart") ? "default" : "ghost"}
                className="gap-2 relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
                <span className="hidden sm:inline">Корзина</span>
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin">
              <Button
                variant={isActive("/admin") ? "default" : "ghost"}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Админ</span>
              </Button>
            </Link>
          )}

          {isEmployee && (
            <Link to="/employee-chat">
              <Button
                variant={isActive("/employee-chat") ? "default" : "ghost"}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Чаты</span>
              </Button>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <Button
                  variant={isActive("/profile") ? "default" : "ghost"}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Профиль</span>
                </Button>
              </Link>
              <Button onClick={signOut} variant="outline">
                Выход
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button>Вход</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
