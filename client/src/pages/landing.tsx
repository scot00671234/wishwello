import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navigation/navbar";
import { Heart, Users, ArrowRight, Play } from "lucide-react";

export default function Landing() {
  const handleStartTrial = () => {
    window.location.href = "/signup";
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 opacity-60"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center space-x-2 bg-black/5 px-3 py-1.5 rounded-full text-sm text-gray-700 mb-8 backdrop-blur">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="font-medium">Trusted by 500+ companies worldwide</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-black mb-8 leading-none tracking-tight">
              Employee
              <br />
              <span className="text-gradient">Wellbeing First</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-xl leading-relaxed">
              Anonymous feedback platform that helps managers detect resignation risks early and build stronger, happier teams through actionable insights.
            </p>
            <div className="flex items-center space-x-4">
              <Button 
                size="lg" 
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium group"
                onClick={handleStartTrial}
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-gray-700 hover:bg-gray-100 px-6 py-3 rounded-full font-medium group"
              >
                <Play className="w-4 h-4 mr-2" />
                <span>View Demo</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-20">
            <div className="text-sm font-medium text-gray-700 mb-4 tracking-wide uppercase">Services</div>
            <h2 className="text-5xl font-bold text-black mb-6 leading-tight">
              Wellbeing solutions designed for retention.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Comprehensive employee feedback tools that help you identify risks, improve satisfaction, and prevent resignations before they happen.
            </p>
          </div>
          
          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">Anonymous Feedback</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Collect honest employee feedback through completely anonymous surveys that protect privacy while providing actionable insights.
                  </p>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Anonymous surveys</span>
                      <span className="font-medium">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pulse tracking</span>
                      <span className="font-medium">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Smart alerts</span>
                      <span className="font-medium">✓</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2">Pulse Tracking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Monitor team wellbeing trends over time with automated pulse scores and smart alerts for early resignation risk detection.
                  </p>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Team dashboards</span>
                      <span className="font-medium">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Real-time insights</span>
                      <span className="font-medium">✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Automated reports</span>
                      <span className="font-medium">✓</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Works Section */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="text-sm font-medium text-gray-700 mb-4 tracking-wide uppercase">Our Works</div>
            <h2 className="text-5xl font-bold text-black mb-6 leading-tight">
              Crafting impactful experiences
              <br />
              across various industries.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project 1 */}
            <Card className="group overflow-hidden border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-white bg-black/20 backdrop-blur-sm rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-1">TechCorp Inc.</h3>
                    <p className="text-sm opacity-90">Reduced turnover by 40% in 6 months</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Project 2 */}
            <Card className="group overflow-hidden border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="text-white bg-black/20 backdrop-blur-sm rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-1">StartupXYZ</h3>
                    <p className="text-sm opacity-90">Prevented 3 key resignations using early alerts</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Ready to prevent your
            <br />
            next resignation?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join 500+ companies using Wish Wello to build stronger, happier teams through anonymous employee feedback and early risk detection.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-medium"
            onClick={handleStartTrial}
          >
            Start 7-Day Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-xl font-bold text-black">Wish Wello</div>
              </div>
              <p className="text-gray-600 max-w-md">
                Employee wellbeing platform helping teams thrive through anonymous feedback and actionable insights.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
              <div>
                <h3 className="font-semibold text-black mb-3">FEATURES</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-600 hover:text-black">Anonymous Surveys</a>
                  <a href="#" className="block text-gray-600 hover:text-black">Pulse Tracking</a>
                  <a href="#" className="block text-gray-600 hover:text-black">Smart Alerts</a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-3">SOLUTIONS</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-600 hover:text-black">Team Management</a>
                  <a href="#" className="block text-gray-600 hover:text-black">Risk Detection</a>
                  <a href="#" className="block text-gray-600 hover:text-black">Retention Analytics</a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-3">RESOURCES</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-600 hover:text-black">Documentation</a>
                  <a href="#" className="block text-gray-600 hover:text-black">Case Studies</a>
                  <a href="#" className="block text-gray-600 hover:text-black">Best Practices</a>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-black mb-3">SUPPORT</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-600 hover:text-black">Help Center</a>
                  <a href="#" className="block text-gray-600 hover:text-black">Contact Us</a>
                  <a href="#" className="block text-gray-600 hover:text-black">Schedule Demo</a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">© 2025 Wish Wello. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/login" className="text-gray-600 hover:text-black text-sm">Login</Link>
              <Link href="/signup" className="text-gray-600 hover:text-black text-sm">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}