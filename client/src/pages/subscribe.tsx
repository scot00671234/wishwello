import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from "@/lib/queryClient";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/navigation/navbar';
import { ArrowLeft, CreditCard, Shield, Star } from 'lucide-react';
import { Link } from 'wouter';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// Skip Stripe initialization if key is not available
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "You are now subscribed to Wish Wello!",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Payment Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full bg-black hover:bg-gray-800" 
            size="lg"
            disabled={!stripe}
          >
            Start 7-Day Free Trial
          </Button>
          <p className="text-xs text-gray-500 text-center">
            You won't be charged until your trial ends. Cancel anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    if (isAuthenticated && stripePublicKey) {
      // Create subscription as soon as the page loads
      apiRequest("POST", "/api/get-or-create-subscription")
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret)
        })
        .catch((error) => {
          if (isUnauthorizedError(error)) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 500);
            return;
          }
          toast({
            title: "Error",
            description: "Failed to initialize subscription. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [isAuthenticated, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stripePublicKey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Payment Service Unavailable</CardTitle>  
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Subscription billing is currently being set up. Please check back later.
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>  
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscribe to Wish Wello</h1>
              <p className="text-gray-600">Start your 7-day free trial today</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <div className="space-y-6">
            <Card className="gradient-brand text-white">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full text-sm mb-4">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Professional Plan</h2>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$79</span>
                    <span className="text-blue-100">/month</span>
                  </div>
                  <p className="text-blue-100 mb-8">
                    Everything you need to track and improve team wellbeing
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <span>Up to 100 employees</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <span>Advanced analytics & trends</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <span>Custom question templates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <span>Smart alerts & notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <span>Priority support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <span>Anonymous feedback collection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 text-green-500">✓</div>
                  <span>Automated scheduling</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Stripe Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>SOC 2 Compliant</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm />
            </Elements>
          </div>
        </div>

        {/* Trial Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-blue-900 mb-2">7-Day Free Trial</h3>
            <p className="text-blue-700 text-sm">
              You won't be charged anything today. Your trial starts immediately and you can cancel anytime before it ends. 
              After your trial, you'll be charged $79/month unless you cancel.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
