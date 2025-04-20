import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AgentAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isMobile = useMobile();
  
  // Format current time for display
  const [currentTime, setCurrentTime] = useState<string>(
    format(new Date(), 'h:mm a')
  );

  useEffect(() => {
    if (user && user.role !== "Agent" && user.role !== "TeamLeader") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const { data: timeframe, isLoading: isLoadingTimeframe } = useQuery<any>({
    queryKey: ["/api/agent/attendance-window"],
    enabled: !!user
  });

  const { data: attendanceHistory, isLoading: isLoadingHistory } = useQuery<any[]>({
    queryKey: ["/api/agent/attendance"],
    enabled: !!user
  });

  const { data: todayAttendance } = useQuery<any>({
    queryKey: ["/api/agent/attendance", { date: new Date().toISOString().split('T')[0] }],
    enabled: !!user
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agent/attendance", {
        checkInTime: new Date().toISOString(),
        isLate: false // This will be determined by the server based on timeframe
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/attendance'] });
      toast({
        title: "Check in successful",
        description: "You have successfully checked in for today",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to check in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), 'h:mm a'));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const isWithinTimeframe = () => {
    if (!timeframe) return false;
    
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [startHour, startMinute] = timeframe.startTime.split(':').map(Number);
    const [endHour, endMinute] = timeframe.endTime.split(':').map(Number);
    
    const currentTimeValue = currentHours * 60 + currentMinutes;
    const startTimeValue = startHour * 60 + startMinute;
    const endTimeValue = endHour * 60 + endMinute;
    
    return currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
  };

  const navItems = [
    { href: "/agent/dashboard", label: "Home", icon: "view-dashboard" },
    { href: "/agent/clients", label: "Clients", icon: "account-cash" },
    { href: "/agent/attendance", label: "Attendance", icon: "calendar-check" },
    { href: "/agent/profile", label: "Profile", icon: "account" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {isMobile ? (
        <Header 
          title="Attendance Check-in" 
          backgroundColor="bg-accent"
          leftIcon={<ArrowLeft className="h-5 w-5" />}
          onLeftIconClick={() => setLocation("/agent/dashboard")}
        />
      ) : (
        <Header title="Agent Portal" backgroundColor="bg-accent" />
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
            {!isMobile && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-neutral-800">Attendance Check-in</h2>
                <p className="text-neutral-600">Track and manage your attendance</p>
              </div>
            )}
            
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <Clock className="text-6xl text-accent" />
                </div>
                <h2 className="text-xl font-bold text-neutral-800 mb-1">Check-in Window</h2>
                <p className="text-neutral-600">
                  {timeframe ? (
                    `${timeframe.startTime} to ${timeframe.endTime}`
                  ) : (
                    "Loading time frame..."
                  )}
                </p>
                
                <div className="my-6 py-4 px-6 bg-neutral-50 rounded-lg inline-block">
                  <div className="text-3xl font-bold text-neutral-900">{currentTime}</div>
                  <div className="text-sm text-neutral-500">Current Time</div>
                </div>
                
                <div className="mt-6">
                  {todayAttendance ? (
                    <Button 
                      disabled
                      className="w-full py-3 px-4 flex items-center justify-center bg-neutral-400"
                    >
                      <CheckCircle className="mr-2 text-xl" />
                      <span>Already Checked In</span>
                    </Button>
                  ) : (
                    <Button 
                      className="w-full py-3 px-4 flex items-center justify-center bg-success hover:bg-green-700"
                      onClick={handleCheckIn}
                      disabled={checkInMutation.isPending || (!isWithinTimeframe() && !isMobile)}
                    >
                      {checkInMutation.isPending ? (
                        <span>Checking in...</span>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 text-xl" />
                          <span>Check In Now</span>
                        </>
                      )}
                    </Button>
                  )}
                  
                  {!isWithinTimeframe() && !todayAttendance && (
                    <p className="text-red-500 text-sm mt-2">
                      <AlertCircle className="inline-block h-4 w-4 mr-1" />
                      You are outside the check-in window
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <TableSkeleton columns={3} rows={4} />
                ) : (
                  <ul className="divide-y divide-neutral-200">
                    {attendanceHistory && attendanceHistory.length > 0 ? (
                      attendanceHistory.map((record) => (
                        <li key={record.id} className="py-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-neutral-800">
                                {format(new Date(record.checkInTime), 'EEEE')}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {format(new Date(record.checkInTime), 'yyyy-MM-dd')}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 h-4 w-4 rounded-full ${
                                record.isExcused 
                                  ? 'bg-blue-500'
                                  : record.isLate
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              } mr-2`}></div>
                              <div className="text-sm text-neutral-900">
                                {record.isExcused 
                                  ? 'Excused'
                                  : record.isLate
                                    ? `Late (${format(new Date(record.checkInTime), 'h:mm a')})`
                                    : `On Time (${format(new Date(record.checkInTime), 'h:mm a')})`
                                }
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-6 text-center text-neutral-500">
                        No attendance records found
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {isMobile && <MobileNav navItems={navItems} />}
    </div>
  );
}
