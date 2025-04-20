import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      workId: "",
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      workId: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    // In a real application, this would implement registration
    // For this MVP, we only implement login since registration is admin/manager controlled
    console.log("Registration not implemented in MVP", data);
  };

  // If user is already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "Admin":
          setLocation("/admin/dashboard");
          break;
        case "Manager":
          setLocation("/manager/dashboard");
          break;
        case "SalesStaff":
          setLocation("/sales-staff/dashboard");
          break;
        case "TeamLeader":
        case "Agent":
          setLocation("/agent/dashboard");
          break;
        default:
          setLocation("/");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch bg-neutral-100">
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary">Insurance Agent Management</h1>
              <p className="text-neutral-600 mt-2">Sign in to your account</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="workId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work ID</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ADM001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="workId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work ID</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., AGT123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      Register
                    </Button>
                    
                    <div className="text-xs text-center text-neutral-500 mt-2">
                      Note: Registration typically requires admin approval
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <a href="#" className="text-primary hover:text-primary-dark text-sm">Forgot password?</a>
              <div className="mt-4 text-sm text-neutral-500">
                Need help? <a href="#" className="text-primary hover:text-primary-dark">Submit a help request</a>
              </div>
            </div>

            {/* Demo login boxes */}
            <div className="mt-8 border-t border-neutral-200 pt-6">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Demo Accounts</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="border border-neutral-300 rounded p-2 bg-neutral-50">
                  <div className="font-bold">Admin</div>
                  <div>ID: ADM001</div>
                  <div>Email: admin@example.com</div>
                  <div>Pass: admin123</div>
                </div>
                <div className="border border-neutral-300 rounded p-2 bg-neutral-50">
                  <div className="font-bold">Manager</div>
                  <div>ID: MGR001</div>
                  <div>Email: manager@example.com</div>
                  <div>Pass: manager123</div>
                </div>
                <div className="border border-neutral-300 rounded p-2 bg-neutral-50">
                  <div className="font-bold">Sales Staff</div>
                  <div>ID: SLF001</div>
                  <div>Email: sales@example.com</div>
                  <div>Pass: sales123</div>
                </div>
                <div className="border border-neutral-300 rounded p-2 bg-neutral-50">
                  <div className="font-bold">Agent</div>
                  <div>ID: AGT001</div>
                  <div>Email: agent@example.com</div>
                  <div>Pass: agent123</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex md:w-1/2 bg-primary p-8 flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-4">Insurance Agent Management Platform</h2>
          <p className="text-lg mb-6">
            A comprehensive solution for managing insurance agents, tracking attendance, client acquisition, and performance.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-left">
              <h3 className="text-xl font-bold mb-2">For Managers</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Monitor sales staff</li>
                <li>View agent performance</li>
                <li>Access reports</li>
                <li>Analyze attendance data</li>
              </ul>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold mb-2">For Agents</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Check in for attendance</li>
                <li>Submit client information</li>
                <li>Track personal performance</li>
                <li>View team reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
