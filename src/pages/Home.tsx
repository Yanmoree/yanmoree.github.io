import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Package, Headphones, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Home = () => {
  const features = [
    {
      icon: Package,
      title: "Широкий ассортимент",
      description: "Более 1000 наименований кассового оборудования в наличии",
    },
    {
      icon: CheckCircle,
      title: "Сертифицированное оборудование",
      description: "Вся продукция имеет необходимые сертификаты и соответствует 54-ФЗ",
    },
    {
      icon: Headphones,
      title: "Техническая поддержка",
      description: "Квалифицированная помощь на всех этапах работы",
    },
    {
      icon: TrendingUp,
      title: "Выгодные цены",
      description: "Прямые поставки от производителей без посредников",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-secondary py-20 md:py-32">
        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  А-Штрих
                </span>
                <br />
                <span className="text-foreground">
                  Профессиональное кассовое оборудование
                </span>
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl max-w-xl">
                Надежные решения для вашего бизнеса. Поставляем фискальные регистраторы, 
                сканеры штрих-кодов, POS-терминалы и другое оборудование.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/catalog">
                  <Button size="lg" className="w-full sm:w-auto group">
                    Перейти в каталог
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/support">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Связаться с нами
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl"></div>
              <img
                src={heroImage}
                alt="Кассовое оборудование"
                className="relative rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Почему выбирают нас
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Мы предлагаем комплексные решения для автоматизации торговли
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container">
          <div className="text-center space-y-6 text-primary-foreground animate-fade-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Готовы начать работу?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Свяжитесь с нами для консультации и подбора оборудования под ваши задачи
            </p>
            <Link to="/support">
              <Button size="lg" variant="secondary" className="mt-4">
                Получить консультацию
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
