import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  ArrowLeft,
  Sparkles,
  Zap,
  Crown,
  ArrowRight
} from 'lucide-react';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleSelectPlan = (planId: string) => {
    // TODO: Integrate with payment provider (Stripe, etc.)
    console.log('Selected plan:', planId);
    // For now, just show a message or redirect to contact
  };

  const handleBack = () => {
    if (!user) {
      navigate('/');
    } else if (profile?.role === 'parent') {
      navigate('/parent/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const plans = [
    {
      id: 'trial',
      name: 'Free Trial',
      tagline: 'Try Before You Buy',
      price: 0,
      period: '7 days',
      description: 'Test the platform risk-free',
      icon: Sparkles,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      buttonVariant: 'outline' as const,
      features: [
        'Access to all learning materials',
        'AI tutor help',
        'Progress tracking',
        '10 practice problems per day',
      ],
      limitations: [
        'Limited to 7 days',
        'No parent dashboard',
        'Slower AI responses',
      ]
    },
    {
      id: 'monthly',
      name: 'Monthly',
      tagline: 'Perfect for Regular Practice',
      price: 29,
      period: 'per month',
      description: 'Homework help & exam prep',
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/50',
      buttonVariant: 'default' as const,
      popular: true,
      features: [
        'Full access to all materials',
        'AI tutor conversations',
        'Parent dashboard access',
        'Personalized learning plan',
        'Custom guided learning flow',
        'Mistake tracking & review',
        'Adaptive difficulty',
      ],
      limitations: []
    },
    {
      id: 'expert',
      name: 'Expert',
      tagline: 'For Top Students',
      price: 49,
      period: 'per month',
      description: 'Advanced learners & exam prep',
      icon: Crown,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      buttonVariant: 'outline' as const,
      features: [
        'Everything in Monthly',
        'Fastest AI responses',
        'Advanced AI reasoning',
        'Multiple solution methods',
        'Weekly email reports',
        'Direct support access',
        'Custom study plans',
      ],
      limitations: []
    }
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

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <img src="/logo/logocorepus (1).svg" alt="CorePus Logo" className="h-12 w-12" />
            <img src="/name/solvesasdasd (1).svg" alt="CorePus" className="h-12" />
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="relative z-10 container mx-auto px-6 pt-8 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Choose Your Plan
          </span>
        </h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">
          Unlock your full potential with the right plan for your learning journey
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 container mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-white/5 backdrop-blur-sm border-white/10 p-6 flex flex-col ${
                plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
              } hover:bg-white/10 transition-all`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white">
                  Most Popular
                </Badge>
              )}

              {/* Plan Icon & Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${plan.bgColor}`}>
                  <plan.icon className={`h-6 w-6 ${plan.color}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className={`text-xs ${plan.color}`}>{plan.tagline}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-2xl font-bold text-white">€</span>
                    </>
                  )}
                  <span className="text-white/50 ml-2">{plan.period}</span>
                </div>
                <p className="text-white/60 text-sm mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="flex-1 space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className={`h-5 w-5 ${plan.color} flex-shrink-0 mt-0.5`} />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, idx) => (
                  <div key={idx} className="flex items-start gap-2 opacity-60">
                    <span className="h-5 w-5 flex items-center justify-center text-white/40 flex-shrink-0">•</span>
                    <span className="text-white/50 text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full ${
                  plan.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : plan.id === 'trial'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {plan.price === 0 ? 'Start Free Trial' : 'Get Started'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-white/60">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
          <p className="text-white/40 text-sm mt-2">
            Questions? Contact us at support@corepus.com
          </p>
        </div>
      </section>
    </div>
  );
}
