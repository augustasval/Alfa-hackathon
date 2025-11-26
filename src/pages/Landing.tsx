import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Get personalized explanations and hints from our intelligent tutor that adapts to your learning style.'
    },
    {
      icon: Target,
      title: 'Structured Learning Plans',
      description: 'Follow a customized study schedule designed to help you master topics before your test date.'
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      description: 'Monitor your improvement with detailed analytics and see which areas need more practice.'
    },
    {
      icon: Users,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full -top-96 -left-96 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full -bottom-48 -right-48 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          animationDelay: '2s'
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
          animationDelay: '4s'
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo/logocorepus (1).svg" alt="CorePus Logo" className="h-14 w-14" />
            <img src="/name/solvesasdasd (1).svg" alt="CorePus" className="h-12" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/pricing')}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
            >
              Pricing
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/login?tab=register')}
              className="bg-purple-600 hover:bg-purple-700 text-white transition-all hover:scale-105 active:scale-95"
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
          <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">AI-Powered Math Tutoring</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Master Math with
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Personalized AI Learning
            </span>
          </h1>

          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Your intelligent math companion that adapts to your learning style.
            Get step-by-step explanations, practice problems, and track your progress
            all in one place.
          </p>

          <Button
            size="lg"
            onClick={() => navigate('/login?tab=register')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 text-base h-auto transition-all hover:scale-105 active:scale-95"
          >
            Start Learning Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Our platform combines AI technology with proven learning methods to help you master mathematics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-white/5 backdrop-blur-sm border-white/10 p-6 hover:bg-white/10 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Students Love Learning With Us
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Join thousands of students who have improved their math skills using our AI-powered platform.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <span className="text-white/80">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10 p-6 cursor-pointer transition-all hover:scale-105 hover:bg-white/10 hover:border-purple-500/30 group">
              <BookOpen className="h-8 w-8 text-purple-400/70 mb-3 group-hover:text-purple-400 transition-colors" />
              <div className="text-3xl font-bold text-white mb-1">100+</div>
              <div className="text-white/50 text-sm">Practice Problems</div>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6 cursor-pointer transition-all hover:scale-105 hover:bg-white/10 hover:border-blue-500/30 group">
              <Brain className="h-8 w-8 text-blue-400/70 mb-3 group-hover:text-blue-400 transition-colors" />
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-white/50 text-sm">AI Tutor Available</div>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6 cursor-pointer transition-all hover:scale-105 hover:bg-white/10 hover:border-pink-500/30 group">
              <BarChart3 className="h-8 w-8 text-pink-400/70 mb-3 group-hover:text-pink-400 transition-colors" />
              <div className="text-3xl font-bold text-white mb-1">Real-time</div>
              <div className="text-white/50 text-sm">Progress Tracking</div>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6 cursor-pointer transition-all hover:scale-105 hover:bg-white/10 hover:border-green-500/30 group">
              <Target className="h-8 w-8 text-green-400/70 mb-3 group-hover:text-green-400 transition-colors" />
              <div className="text-3xl font-bold text-white mb-1">Custom</div>
              <div className="text-white/50 text-sm">Learning Plans</div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <Card className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-white/10 p-12 text-center backdrop-blur-sm">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Master Math?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Join today and start your personalized learning journey.
            Our AI tutor is ready to help you succeed.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/login?tab=register')}
            className="bg-white text-purple-900 hover:bg-white/90 px-8 py-6 text-lg h-auto font-semibold"
          >
            Get Started Now - It's Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo/logocorepus (1).svg" alt="CorePus Logo" className="h-8 w-8" />
              <img src="/name/solvesasdasd (1).svg" alt="CorePus" className="h-6" />
            </div>
            <p className="text-white/40 text-sm">
              © 2024 CorePus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
