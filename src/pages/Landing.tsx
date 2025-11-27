import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain,
  Target,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  BarChart3
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'parent') {
        navigate('/parent/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Learning',
      description: 'Get personalized explanations and hints from our intelligent tutor that adapts to your learning style.'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Structured Learning Plans',
      description: 'Follow a customized study schedule designed to help you master topics before your test date.'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Track Your Progress',
      description: 'Monitor your improvement with detailed analytics and see which areas need more practice.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Parent Dashboard',
      description: 'Parents can track their child\'s progress and receive updates on their learning journey.'
    }
  ];

  const benefits = [
    'Step-by-step problem solutions',
    'Interactive practice exercises',
    'Video explanations for every topic',
    'Mistake tracking and review',
    'Personalized study recommendations',
    'Progress reports for parents'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo/logo.svg" alt="Jolvita Logo" className="h-12 w-12" />
            <img src="/name/brand-name.svg" alt="Jolvita" className="h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/pricing')}
              className="text-foreground hover:bg-accent"
            >
              Pricing
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/login?tab=register')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary text-sm font-medium">AI-Powered Math Tutoring</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
            Master Math with Personalized AI Learning
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Your intelligent math companion that adapts to your learning style.
            Get step-by-step explanations, practice problems, and track your progress
            all in one place.
          </p>

          <Button
            size="lg"
            onClick={() => navigate('/login?tab=register')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-base h-auto"
          >
            Start Learning Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our platform combines AI technology with proven learning methods to help you master mathematics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card border-border hover:shadow-lg transition-all group"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-primary">
                  {feature.icon}
                </div>
                <CardTitle className="text-foreground text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Why Students Love Learning With Us
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of students who have improved their math skills using our AI-powered platform.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border p-6 hover:shadow-lg transition-all group">
              <BookOpen className="h-8 w-8 text-primary/70 mb-3 group-hover:text-primary transition-colors" />
              <div className="text-3xl font-bold text-foreground mb-1">100+</div>
              <div className="text-muted-foreground text-sm">Practice Problems</div>
            </Card>
            <Card className="bg-card border-border p-6 hover:shadow-lg transition-all group">
              <Brain className="h-8 w-8 text-primary/70 mb-3 group-hover:text-primary transition-colors" />
              <div className="text-3xl font-bold text-foreground mb-1">24/7</div>
              <div className="text-muted-foreground text-sm">AI Tutor Available</div>
            </Card>
            <Card className="bg-card border-border p-6 hover:shadow-lg transition-all group">
              <BarChart3 className="h-8 w-8 text-primary/70 mb-3 group-hover:text-primary transition-colors" />
              <div className="text-3xl font-bold text-foreground mb-1">Real-time</div>
              <div className="text-muted-foreground text-sm">Progress Tracking</div>
            </Card>
            <Card className="bg-card border-border p-6 hover:shadow-lg transition-all group">
              <Target className="h-8 w-8 text-primary/70 mb-3 group-hover:text-primary transition-colors" />
              <div className="text-3xl font-bold text-foreground mb-1">Custom</div>
              <div className="text-muted-foreground text-sm">Learning Plans</div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <Card className="bg-primary/5 border-primary/20 p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Master Math?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join today and start your personalized learning journey.
            Our AI tutor is ready to help you succeed.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/login?tab=register')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg h-auto font-semibold"
          >
            Get Started Now - It's Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo/logo.svg" alt="Jolvita Logo" className="h-8 w-8" />
              <img src="/name/brand-name.svg" alt="Jolvita" className="h-6" />
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Jolvita. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
