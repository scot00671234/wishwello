import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navigation/navbar";
import PulseChart from "@/components/dashboard/pulse-chart";
import { Heart, Users, Clock, ChartLine, Shield, Bell, Upload, Star } from "lucide-react";

export default function Landing() {
  const handleStartTrial = () => {
    window.location.href = "/api/login";
  };

  const mockPulseData = [
    { date: "Week 1", score: 8.2 },
    { date: "Week 2", score: 8.5 },
    { date: "Week 3", score: 8.1 },
    { date: "Week 4", score: 7.8 },
    { date: "Week 5", score: 7.5 },
    { date: "Week 6", score: 7.2 },
    { date: "Week 7", score: 6.8 },
    { date: "Week 8", score: 6.5 },
    { date: "Week 9", score: 6.2 },
    { date: "Week 10", score: 6.0 },
    { date: "Week 11", score: 6.1 },
    { date: "Week 12", score: 6.4 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Trusted by 500+ companies worldwide</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Prevent resignations<br/>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">before they happen</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Track employee wellbeing with anonymous feedback. Get instant alerts when your team needs support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg h-auto"
                onClick={handleStartTrial}
              >
                <span>Start 7-Day Free Trial</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto px-8 py-4 text-lg border-gray-300 h-auto"
              >
                View Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">No credit card required • Setup in 5 minutes</p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Your team's wellbeing at a glance</h2>
            <p className="text-xl text-gray-600">Real-time pulse scores, trend analysis, and actionable insights</p>
          </div>
          
          {/* Dashboard Mock */}
          <Card className="shadow-2xl border-gray-200 overflow-hidden">
            {/* Dashboard Header */}
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded"></div>
                <span className="text-white font-medium">Engineering Team Dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>

            <CardContent className="p-8">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Current Pulse</span>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 font-mono">6.4</div>
                    <div className="text-sm text-gray-500">↓ 1.2 from last week</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Response Rate</span>
                      <ChartLine className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 font-mono">89%</div>
                    <div className="text-sm text-gray-500">23/26 responses</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Trend</span>
                      <div className="text-red-500">↓</div>
                    </div>
                    <div className="text-3xl font-bold text-red-500 font-mono">-1.2</div>
                    <div className="text-sm text-gray-500">3 week decline</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Risk Level</span>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-xl font-bold text-yellow-600">CAUTION</div>
                    <div className="text-sm text-gray-500">Needs attention</div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart and Comments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pulse Trend Chart */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pulse Trend (Last 12 Weeks)</h3>
                    <div className="h-64">
                      <PulseChart data={mockPulseData} />
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Comments */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Anonymous Feedback</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 text-sm mb-2">"Workload has been overwhelming lately. Need better project planning."</p>
                        <div className="text-xs text-gray-500">2 days ago • Stress Level: 8/10</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 text-sm mb-2">"Team communication could be improved. Too many meetings."</p>
                        <div className="text-xs text-gray-500">3 days ago • Team Satisfaction: 5/10</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 text-sm mb-2">"Really appreciate the flexible work arrangements!"</p>
                        <div className="text-xs text-gray-500">5 days ago • Work-Life Balance: 9/10</div>
                      </div>
                    </div>
                    <Button variant="link" className="mt-4 p-0 text-blue-600 hover:text-blue-700">
                      View all feedback →
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Alert Banner */}
              <Card className="mt-8 bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1">
                    <div className="font-medium text-yellow-900">Pulse Score Alert</div>
                    <div className="text-sm text-yellow-700">Team pulse dropped by 1.2 points this week. Consider scheduling a team check-in.</div>
                  </div>
                  <Button className="ml-auto bg-yellow-600 hover:bg-yellow-700 text-white">
                    Take Action
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Anonymous feedback made simple</h2>
            <p className="text-xl text-gray-600">Employees submit feedback via email links. No accounts, no tracking.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Features List */}
            <div className="space-y-8">
              <Card className="shadow-lg border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Features</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">100% Anonymous</h4>
                        <p className="text-gray-600 text-sm">No individual tracking. Responses stored as anonymous data blobs.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Automated Scheduling</h4>
                        <p className="text-gray-600 text-sm">Set it and forget it. Automatic emails with smart reminders.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ChartLine className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Smart Alerts</h4>
                        <p className="text-gray-600 text-sm">Get notified when pulse scores drop or trends indicate risk.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">CSV Import</h4>
                        <p className="text-gray-600 text-sm">Bulk upload employee emails. Seamless team onboarding.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Demo */}
            <div>
              <Card className="shadow-lg border-gray-200">
                <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Weekly Team Check-in</span>
                    <span className="text-xs text-gray-500">2 min to complete</span>
                  </div>
                </div>
                
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">How are you feeling this week?</h3>
                    <p className="text-sm text-gray-600">Your responses are completely anonymous</p>
                  </div>

                  {/* Sample Questions */}
                  <div className="space-y-8">
                    {/* Question 1: Scale */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Overall job satisfaction
                      </label>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Very Poor</span>
                        <div className="flex space-x-2">
                          {Array.from({length: 10}, (_, i) => i + 1).map(num => (
                            <button 
                              key={num}
                              className={`w-10 h-10 rounded-lg border-2 transition-colors flex items-center justify-center text-sm font-medium ${
                                num === 7 
                                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                                  : 'border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-gray-700'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">Excellent</span>
                      </div>
                    </div>

                    {/* Question 2: Yes/No */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Do you feel supported by your manager?
                      </label>
                      <div className="flex space-x-4">
                        <Button className="flex-1 bg-green-50 border-2 border-green-500 text-green-700 hover:bg-green-100">
                          ✓ Yes
                        </Button>
                        <Button variant="outline" className="flex-1 border-2 border-gray-200 hover:border-gray-300">
                          ✗ No
                        </Button>
                      </div>
                    </div>

                    {/* Question 3: Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Any additional feedback? (Optional)
                      </label>
                      <textarea 
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none" 
                        rows={4} 
                        placeholder="Share any thoughts or suggestions..."
                        defaultValue="The new project management system is much more efficient. Thanks for implementing our suggestions!"
                      />
                    </div>
                  </div>

                  <Button className="w-full mt-8 bg-black hover:bg-gray-800 text-white py-4">
                    Submit Feedback
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    This feedback is completely anonymous and helps improve our workplace
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start with a 7-day free trial. No credit card required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <Card className="relative">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Starter</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">$29</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mb-8">Perfect for small teams getting started</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">Up to 25 employees</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">Weekly/monthly check-ins</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">Basic analytics</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">Email support</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 hover:bg-gray-50"
                  onClick={handleStartTrial}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative shadow-2xl border-blue-200">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              
              <CardContent className="p-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Professional</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$79</span>
                    <span className="text-blue-100">/month</span>
                  </div>
                  <p className="text-blue-100 mb-8">Best for growing teams and managers</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-400">✓</div>
                    <span>Up to 100 employees</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-400">✓</div>
                    <span>Advanced analytics & trends</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-400">✓</div>
                    <span>Custom question templates</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-400">✓</div>
                    <span>Smart alerts & notifications</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-400">✓</div>
                    <span>Priority support</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-white text-blue-600 hover:bg-gray-50"
                  onClick={handleStartTrial}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">$199</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 mb-8">For large organizations and HR teams</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">Unlimited employees</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">Multi-team management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">API access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">Custom integrations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">✓</div>
                    <span className="text-gray-700">Dedicated success manager</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include our 7-day free trial</p>
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Stripe Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>SOC 2 Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-semibold">Wish Wello</span>
              </div>
              <p className="text-gray-400 mb-6">
                Prevent employee resignations with anonymous wellbeing tracking and smart alerts.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <ChartLine className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Heart className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Pricing</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">API</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Integrations</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">About</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Blog</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Careers</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Status</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Wish Wello. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <span className="text-gray-400 text-sm">Built with Railway</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-400 text-sm">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
