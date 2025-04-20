import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/stats-card";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Users, 
  UserCheck,
  BarChart3,
  CheckSquare,
  AlertCircle,
  ChevronLeft,
  Edit,
  UserX,
  MessageSquare,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ManagerAgentProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const agentId = params.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  
  useEffect(() => {
    if (user?.role !== "Manager") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Fetch agent data
  const { data: agent, isLoading: isLoadingAgent } = useQuery<any>({
    queryKey: ["/api/manager/agents", agentId],
    enabled: !!user && !!agentId,
  });

  // Fetch agent's performance data
  const { data: performance, isLoading: isLoadingPerformance } = useQuery<any>({
    queryKey: ["/api/manager/agents", agentId, "performance"],
    enabled: !!user && !!agentId,
  });

  // Fetch agent's attendance records
  const { data: attendance, isLoading: isLoadingAttendance } = useQuery<any[]>({
    queryKey: ["/api/manager/agents", agentId, "attendance"],
    enabled: !!user && !!agentId,
  });

  // Fetch agent's clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<any[]>({
    queryKey: ["/api/manager/agents", agentId, "clients"],
    enabled: !!user && !!agentId && activeTab === "clients",
  });

  // Fetch agent's reports
  const { data: reports, isLoading: isLoadingReports } = useQuery<any[]>({
    queryKey: ["/api/manager/agents", agentId, "reports"],
    enabled: !!user && !!agentId && activeTab === "reports",
  });

  // Mutation for deactivating agent
  const deactivateAgentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/manager/agents/${agentId}/status`, { 
        isActive: !agent?.isActive 
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: agent?.isActive ? "Agent deactivated successfully" : "Agent activated successfully",
        variant: "success"
      });
      setIsDeactivateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/manager/agents", agentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDeactivateAgent = () => {
    deactivateAgentMutation.mutate();
  };

  // Format attendance status
  const getAttendanceStatus = (record: any) => {
    if (record.isLate) {
      if (record.isExcused) {
        return {
          label: "Excused Late",
          color: "bg-blue-100 text-blue-800"
        };
      } else {
        return {
          label: "Late",
          color: "bg-amber-100 text-amber-800"
        };
      }
    } else {
      return {
        label: "On Time",
        color: "bg-green-100 text-green-800"
      };
    }
  };

  // Get badge for report type
  const getReportBadgeColor = (type: string) => {
    switch (type) {
      case "daily": return "bg-green-100 text-green-800";
      case "weekly": return "bg-blue-100 text-blue-800";
      case "monthly": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const navItems = [
    { href: "/manager/dashboard", label: "Dashboard", icon: "view-dashboard" },
    { href: "/manager/sales-staff", label: "Sales Staff", icon: "account-tie" },
    { href: "/manager/agents", label: "Agents", icon: "account-group" },
    { href: "/manager/attendance", label: "Attendance", icon: "calendar-clock" },
    { href: "/manager/reports", label: "Reports", icon: "file-chart" },
    { href: "/manager/messages", label: "Messages", icon: "message-text" },
  ];

  const isLoading = isLoadingAgent || isLoadingPerformance;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-100">
        <Header title="Manager Portal" backgroundColor="bg-indigo-600" />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar navItems={navItems} role="Manager" workId={user?.workId} />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-1/4 bg-neutral-200 rounded"></div>
                <div className="h-4 w-1/3 bg-neutral-200 rounded"></div>
                <div className="h-64 bg-neutral-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header title="Manager Portal" backgroundColor="bg-indigo-600" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} role="Manager" workId={user?.workId} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                className="mb-2" 
                onClick={() => setLocation("/manager/agents")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Agents
              </Button>
              
              {agent && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-800">{agent.fullName}</h2>
                    <p className="text-neutral-600">
                      {agent.role === "TeamLeader" ? "Team Leader" : "Agent"} • {agent.workId}
                    </p>
                  </div>
                  
                  <div className="flex mt-4 md:mt-0 space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/manager/messages?recipient=${agent.id}`)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/manager/agents/${agent.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    
                    <Button
                      variant={agent.isActive ? "destructive" : "default"}
                      onClick={() => setIsDeactivateDialogOpen(true)}
                    >
                      {agent.isActive ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {agent && (
              <>
                {/* Agent Profile Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center mb-6">
                        <div className="h-24 w-24 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                          <User className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-bold mt-4">{agent.fullName}</h3>
                        <div className={cn(
                          "mt-2 px-3 py-1 rounded-full text-sm font-medium",
                          agent.isActive 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        )}>
                          {agent.isActive ? "Active" : "Inactive"}
                        </div>
                        <p className="text-neutral-500 mt-2">
                          {agent.role === "TeamLeader" ? "Team Leader" : "Agent"}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-neutral-500 mr-3" />
                          <div>
                            <p className="text-sm text-neutral-500">Email</p>
                            <p className="font-medium">{agent.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-neutral-500 mr-3" />
                          <div>
                            <p className="text-sm text-neutral-500">Work ID</p>
                            <p className="font-medium">{agent.workId}</p>
                          </div>
                        </div>
                        
                        {agent.salesStaffName && (
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-neutral-500 mr-3" />
                            <div>
                              <p className="text-sm text-neutral-500">Reports To</p>
                              <p className="font-medium">{agent.salesStaffName}</p>
                              <p className="text-xs text-neutral-500">Sales Staff</p>
                            </div>
                          </div>
                        )}
                        
                        {agent.joinDate && (
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-neutral-500 mr-3" />
                            <div>
                              <p className="text-sm text-neutral-500">Joined</p>
                              <p className="font-medium">{format(new Date(agent.joinDate), 'PP')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Performance Overview</CardTitle>
                      <CardDescription>30-day summary of agent's performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {performance ? (
                          <>
                            <StatsCard
                              title="Clients Added"
                              value={performance.clientsAdded.toString()}
                              icon={<Users className="h-4 w-4" />}
                              color="primary"
                              subtitle="Last 30 days"
                            />
                            
                            <StatsCard
                              title="Attendance Rate"
                              value={`${performance.attendanceRate.toFixed(1)}%`}
                              icon={<CheckSquare className="h-4 w-4" />}
                              color={performance.attendanceRate >= 90 ? "success" : performance.attendanceRate >= 75 ? "warning" : "error"}
                              subtitle="Last 30 days"
                            />
                            
                            <StatsCard
                              title="Reports Submitted"
                              value={performance.reportsSubmitted.toString()}
                              icon={<FileText className="h-4 w-4" />}
                              color="secondary"
                              subtitle="Last 30 days"
                            />
                          </>
                        ) : (
                          <>
                            <div className="h-24 bg-neutral-100 rounded animate-pulse"></div>
                            <div className="h-24 bg-neutral-100 rounded animate-pulse"></div>
                            <div className="h-24 bg-neutral-100 rounded animate-pulse"></div>
                          </>
                        )}
                      </div>
                      
                      {performance && performance.lastCheckIn && (
                        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                            <h4 className="font-medium text-indigo-700">Last Activity</h4>
                          </div>
                          <div className="mt-2">
                            <div className="text-sm">
                              <p className="text-neutral-600">
                                Last check-in: <span className="font-medium">{format(new Date(performance.lastCheckIn), 'PPp')}</span>
                              </p>
                              <p className="text-neutral-600 mt-1">
                                Last client added: <span className="font-medium">{performance.lastClientAdded ? format(new Date(performance.lastClientAdded), 'PPp') : 'No recent clients'}</span>
                              </p>
                              <p className="text-neutral-600 mt-1">
                                Last report: <span className="font-medium">{performance.lastReport ? format(new Date(performance.lastReport), 'PPp') : 'No recent reports'}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Detailed Information Tabs */}
                <Tabs 
                  defaultValue="overview" 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full md:w-fit grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="clients">Clients</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Activity Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {performance ? (
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-lg font-medium mb-2">Attendance Pattern</h4>
                                <div className="h-2.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-600 rounded-full" 
                                    style={{ width: `${performance.attendanceRate}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-neutral-500">
                                  <span>Attendance Rate: {performance.attendanceRate.toFixed(1)}%</span>
                                  <span>{performance.daysOnTime || 0} days on time, {performance.daysLate || 0} days late</span>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-lg font-medium mb-2">Client Acquisition</h4>
                                <p className="text-neutral-600">
                                  {agent.fullName} has added <span className="font-bold">{performance.clientsAdded}</span> clients in the last 30 days.
                                </p>
                                <p className="text-neutral-600 mt-2">
                                  Average of <span className="font-bold">{(performance.clientsAdded / 30).toFixed(1)}</span> clients per day.
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="text-lg font-medium mb-2">Report Submissions</h4>
                                <p className="text-neutral-600">
                                  Submitted <span className="font-bold">{performance.reportsSubmitted}</span> reports in the last 30 days.
                                </p>
                                <div className="grid grid-cols-3 gap-4 mt-3">
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <p className="text-green-800 font-medium text-sm">Daily Reports</p>
                                    <p className="text-green-600 font-bold text-2xl">{performance.dailyReports || 0}</p>
                                  </div>
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-blue-800 font-medium text-sm">Weekly Reports</p>
                                    <p className="text-blue-600 font-bold text-2xl">{performance.weeklyReports || 0}</p>
                                  </div>
                                  <div className="p-3 bg-purple-50 rounded-lg">
                                    <p className="text-purple-800 font-medium text-sm">Monthly Reports</p>
                                    <p className="text-purple-600 font-bold text-2xl">{performance.monthlyReports || 0}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-neutral-500">
                              <BarChart3 className="mx-auto h-12 w-12 opacity-20 mb-2" />
                              <p>No performance data available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="attendance" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Attendance History</CardTitle>
                        <CardDescription>Recent attendance records</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendance ? (
                          <TableSkeleton columns={4} rows={5} />
                        ) : attendance && attendance.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-neutral-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Date
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Check-in Time
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Notes
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {attendance.map((record) => {
                                  const status = getAttendanceStatus(record);
                                  return (
                                    <tr key={record.id}>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-neutral-900">
                                          {format(new Date(record.checkInTime), 'PP')}
                                        </div>
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-neutral-900">
                                          {format(new Date(record.checkInTime), 'p')}
                                        </div>
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                                          {status.label}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-neutral-900">
                                          {record.isExcused && record.excuseReason 
                                            ? record.excuseReason 
                                            : record.isLate && !record.isExcused
                                              ? "Late check-in"
                                              : ""}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-neutral-500">
                            <Calendar className="mx-auto h-12 w-12 opacity-20 mb-2" />
                            <p>No attendance records found</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="clients" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Client Acquisitions</CardTitle>
                        <CardDescription>Clients added by this agent</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingClients ? (
                          <TableSkeleton columns={5} rows={5} />
                        ) : clients && clients.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-neutral-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Client
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Insurance Type
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Added On
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Follow-up
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {clients.map((client) => (
                                  <tr key={client.id}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-neutral-900">{client.fullName}</div>
                                      <div className="text-sm text-neutral-500">{client.phone}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {client.insuranceType}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-neutral-900">
                                        {format(new Date(client.createdAt), 'PP')}
                                      </div>
                                      <div className="text-xs text-neutral-500">
                                        {format(new Date(client.createdAt), 'p')}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      {client.requiresFollowUp ? (
                                        <div>
                                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            Required
                                          </span>
                                          {client.followUpDate && (
                                            <div className="text-xs text-neutral-500 mt-1">
                                              {format(new Date(client.followUpDate), 'PP')}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-sm text-neutral-500">Not required</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Active
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-neutral-500">
                            <Users className="mx-auto h-12 w-12 opacity-20 mb-2" />
                            <p>No clients found</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="reports" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Report Submissions</CardTitle>
                        <CardDescription>Reports submitted by this agent</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingReports ? (
                          <TableSkeleton columns={4} rows={5} />
                        ) : reports && reports.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-neutral-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Report
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Submitted On
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                    Content
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {reports.map((report) => (
                                  <tr key={report.id}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-neutral-900">{report.title}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getReportBadgeColor(report.reportType)}`}>
                                        {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-neutral-900">
                                        {format(new Date(report.createdAt), 'PP')}
                                      </div>
                                      <div className="text-xs text-neutral-500">
                                        {format(new Date(report.createdAt), 'p')}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm text-neutral-600 max-w-md truncate">
                                        {report.content.substring(0, 100)}...
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-neutral-500">
                            <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                            <p>No reports found</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Deactivate Agent Dialog */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {agent?.isActive ? "Deactivate Agent Account" : "Activate Agent Account"}
            </DialogTitle>
            <DialogDescription>
              {agent?.isActive 
                ? "This will prevent the agent from logging in and using the platform. They will no longer be able to add clients or submit reports."
                : "This will re-enable the agent's access to the platform. They will be able to log in, add clients, and submit reports again."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-500 mr-3" />
              <div>
                <p className="text-amber-800 font-medium">
                  {agent?.isActive ? "Are you sure you want to deactivate" : "Are you sure you want to activate"}
                </p>
                <p className="text-amber-600">
                  {agent?.fullName}'s account?
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeactivateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant={agent?.isActive ? "destructive" : "default"}
              onClick={handleDeactivateAgent}
              disabled={deactivateAgentMutation.isPending}
            >
              {deactivateAgentMutation.isPending 
                ? "Processing..." 
                : agent?.isActive 
                  ? "Yes, Deactivate Account" 
                  : "Yes, Activate Account"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}