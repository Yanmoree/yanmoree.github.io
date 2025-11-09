import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ArrowLeft, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const addToCart = async () => {
    if (!user) {
      toast.error("Войдите в систему для добавления в корзину");
      navigate("/auth");
      return;
    }

    if (!product) return;

    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: product.id, quantity: 1 });
      }

      toast.success("Товар добавлен в корзину");
    } catch (error) {
      toast.error("Ошибка при добавлении в корзину");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <Card className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-10 text-center">
        <p className="text-muted-foreground">Товар не найден</p>
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-6 animate-fade-in-up">
      <Button
        variant="ghost"
        onClick={() => navigate("/catalog")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к каталогу
      </Button>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Изображение */}
          <div className="relative bg-gradient-to-br from-muted to-muted/50 min-h-[400px]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                Осталось {product.stock} шт.
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                Нет в наличии
              </Badge>
            )}
          </div>

          {/* Информация */}
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.category && (
                <Badge variant="secondary">{product.category}</Badge>
              )}
            </div>

            <Separator />

            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Краткое описание</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {product.detailed_description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Подробное описание</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.detailed_description}
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  {product.price.toLocaleString()} ₽
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>В наличии: {product.stock} шт.</span>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={addToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock === 0 ? "Нет в наличии" : "Добавить в корзину"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductDetail;
