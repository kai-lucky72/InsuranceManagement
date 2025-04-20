import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  UserPlus, FileChartColumn, CalendarCheck, Eye, ArrowRight, PlusCircle, Cross, Check as CheckCheck, Clock, LineChart, Users
} from "lucide-react";
import { format } from "date-fns";

export default function AgentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useMobile();

  const { data: attendance } = useQuery<any>({
    queryKey: ["/api/agent/attendance"],
    enabled: !!user
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/agent/clients"],
    enabled: !!user
  });

  const { data: performance } = useQuery<any>({
    queryKey: ["/api/agent/performance/daily"],
    enabled: !!user
  });

  useEffect(() => {
    if (user && user.role !== "Agent" && user.role !== "TeamLeader") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Format current time for display
  const [currentTime, setCurrentTime] = useState<string>(
    format(new Date(), 'h:mm a')
  );

  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), 'h:mm a'));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayAttendance = attendance?.find((record: any) => 
    new Date(record.checkInTime).toDateString() === new Date().toDateString()
  );

  const attendanceStatus = todayAttendance ? (
    todayAttendance.isLate ? "Late" : "On Time"
  ) : "Not Checked In";

  const attendanceColor = 
    attendanceStatus === "On Time" ? "success" : 
    attendanceStatus === "Late" ? "warning" : "error";

  const navItems = [
    { href: "/agent/dashboard", label: "Home", icon: "view-dashboard" },
    { href: "/agent/clients", label: "Clients", icon: "account-cash" },
    { href: "/agent/attendance", label: "Attendance", icon: "calendar-check" },
    { href: "/agent/profile", label: "Profile", icon: "account" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {isMobile ? (
        <>
          <Header
            title="Agent Portal"
            backgroundColor="bg-accent"
            showProfileIcon
            showNotification
          />
          <div className="p-4 bg-accent text-white">
            <div className="font-medium">{user?.fullName} ({user?.workId})</div>
            <div className="opacity-80">{user?.role}</div>
          </div>
        </>
      ) : (
        <Header
          title="Agent Portal"
          backgroundColor="bg-accent"
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <Sidebar 
            navItems={navItems} 
            role={user?.role || "Agent"} 
            workId={user?.workId} 
            backgroundColor="bg-white"
            accentColor="text-accent"
          />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Dashboard</h2>
              <p className="text-neutral-600">Welcome back, {user?.fullName}</p>
            </div>

            {/* Attendance Check-in Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white bg-${attendanceColor}`}>
                    {attendanceStatus === "On Time" || attendanceStatus === "Late" ? (
                      <CheckCheck className="h-5 w-5" />
                    ) : (
                      <Cross className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-neutral-800">
                      {attendanceStatus === "On Time" || attendanceStatus === "Late" ? (
                        "You've checked in for today"
                      ) : (
                        "You haven't checked in today"
                      )}
                    </div>
                    {todayAttendance && (
                      <div className="text-xs text-neutral-500">
                        Checked in at {format(new Date(todayAttendance.checkInTime), 'h:mm a')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                  <div className="text-sm text-neutral-700">Check-in window</div>
                  <div className="flex items-center text-neutral-900">
                    <Clock className="text-secondary mr-2 h-5 w-5" />
                    <span>8:00 AM</span>
                    <ArrowRight className="text-neutral-500 mx-2 h-4 w-4" />
                    <Clock className="text-red-500 mr-2 h-5 w-5" />
                    <span>9:30 AM</span>
                  </div>

                  {!todayAttendance && (
                    <div className="mt-3">
                      <Button 
                        className="w-full" 
                        onClick={() => setLocation("/agent/attendance")}
                      >
                        Check In Now
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-accent bg-opacity-10 p-3 rounded-md">
                      <div className="text-accent text-sm font-medium">Clients Added</div>
                      <div className="text-2xl font-bold text-neutral-800">{clients?.length || 0}</div>
                      <div className="text-xs text-neutral-600">This week</div>
                    </div>
                    <div className="bg-green-500 bg-opacity-10 p-3 rounded-md">
                      <div className="text-green-600 text-sm font-medium">Attendance Rate</div>
                      <div className="text-2xl font-bold text-neutral-800">95%</div>
                      <div className="text-xs text-neutral-600">Last 30 days</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Today's Goal Progress</h4>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-accent">Clients Added</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-accent">60%</span>
                        </div>
                      </div>
                      <Progress className="h-2" value={60} />
                      <div className="text-xs text-neutral-600 text-center mt-1">3 of 5 daily target</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="flex flex-col h-auto py-4 bg-accent hover:bg-accent-dark text-white"
                      onClick={() => setLocation("/agent/clients")}
                    >
                      <UserPlus className="h-6 w-6 mb-2" />
                      <span>Add Client</span>
                    </Button>
                    <Button 
                      className="flex flex-col h-auto py-4 bg-primary hover:bg-primary-dark text-white"
                    >
                      <FileChartColumn className="h-6 w-6 mb-2" />
                      <span>Submit Report</span>
                    </Button>
                    {user?.role === "TeamLeader" && (
                      <Button 
                        className="flex flex-col h-auto py-4 bg-secondary hover:bg-secondary-dark text-white"
                      >
                        <Users className="h-6 w-6 mb-2" />
                        <span>Team Members</span>
                      </Button>
                    )}
                    <Button 
                      className="flex flex-col h-auto py-4 bg-neutral-700 hover:bg-neutral-800 text-white"
                    >
                      <LineChart className="h-6 w-6 mb-2" />
                      <span>Performance</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Clients */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Recent Clients</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/agent/clients")}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                <div>
                  <ul className="divide-y divide-neutral-200">
                    {clients && clients.length > 0 ? (
                      clients.slice(0, 3).map((client: any) => (
                        <li key={client.id} className="py-3">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-neutral-800">{client.fullName}</h4>
                              <p className="text-xs text-neutral-500">
                                {client.insuranceType} • Added {format(new Date(client.createdAt), 'PP')}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-6 text-center">
                        <p className="text-neutral-500">No clients added yet</p>
                        <Button 
                          size="sm"
                          className="mt-2"
                          onClick={() => setLocation("/agent/clients")}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Client
                        </Button>
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {isMobile && <MobileNav navItems={navItems} />}
    </div>
  );
}