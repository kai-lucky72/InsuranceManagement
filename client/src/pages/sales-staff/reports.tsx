import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  PlusCircle, 
  Eye, 
  Calendar, 
  Users, 
  Clipboard,
  File,
  Filter,
  Download,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

const reportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  reportType: z.enum(["daily", "weekly", "monthly"]),
  content: z.string().min(20, "Report content must be at least 20 characters")
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function SalesStaffReports() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isViewReportOpen, setIsViewReportOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      reportType: "daily",
      content: ""
    }
  });

  useEffect(() => {
    if (user?.role !== "SalesStaff") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Fetch reports data
  const { data: reports, isLoading: isLoadingReports } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/reports"],
    enabled: !!user
  });

  // Fetch team leaders reports
  const { data: teamLeaderReports, isLoading: isLoadingTeamLeaderReports } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/team-leader-reports"],
    enabled: !!user
  });

  // Fetch agents data for filtering
  const { data: agents, isLoading: isLoadingAgents } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/agents"],
    enabled: !!user
  });
  
  // Mutation for creating report
  const createReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const res = await apiRequest("POST", "/api/sales-staff/reports", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report created successfully",
        variant: "success"
      });
      setIsFormOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/reports"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create report",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter reports based on active tab and filters
  const filteredReports = (() => {
    let filtered = [];
    
    if (activeTab === "all") {
      filtered = [...(reports || []), ...(teamLeaderReports || [])];
    } else if (activeTab === "my") {
      filtered = reports || [];
    } else if (activeTab === "team-leaders") {
      filtered = teamLeaderReports || [];
    }
    
    // Filter by report type
    if (filterType !== "all") {
      filtered = filtered.filter(report => report.reportType === filterType);
    }
    
    // Filter by agent (if in team leaders tab)
    if (activeTab === "team-leaders" && filterAgent !== "all") {
      filtered = filtered.filter(report => report.submittedById.toString() === filterAgent);
    }
    
    // Sort by created date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  const handleCreateReport = (data: ReportFormData) => {
    createReportMutation.mutate(data);
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsViewReportOpen(true);
  };

  // Get username map for displaying submitter names
  const getSubmitterName = (submittedById: number) => {
    const agent = agents?.find(a => a.id === submittedById);
    return agent ? agent.fullName : `User #${submittedById}`;
  };

  const getReportBadgeColor = (type: string) => {
    switch (type) {
      case "daily": return "bg-green-100 text-green-800";
      case "weekly": return "bg-blue-100 text-blue-800";
      case "monthly": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const navItems = [
    { href: "/sales-staff/dashboard", label: "Dashboard", icon: "view-dashboard" },
    { href: "/sales-staff/agents", label: "Agents", icon: "account-group" },
    { href: "/sales-staff/team-leaders", label: "Team Leaders", icon: "account-multiple" },
    { href: "/sales-staff/attendance", label: "Attendance", icon: "calendar-clock" },
    { href: "/sales-staff/clients", label: "Clients", icon: "account-cash" },
    { href: "/sales-staff/reports", label: "Reports", icon: "file-chart" },
    { href: "/sales-staff/messages", label: "Messages", icon: "message-text" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header title="Sales Staff Portal" backgroundColor="bg-secondary" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} role="SalesStaff" workId={user?.workId} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Reports Management</h2>
              <p className="text-neutral-600">Create and manage reports for your sales territory</p>
            </div>

            {/* Tabs and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <Tabs 
                defaultValue="all" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full md:w-fit grid-cols-3">
                  <TabsTrigger value="all">All Reports</TabsTrigger>
                  <TabsTrigger value="my">My Reports</TabsTrigger>
                  <TabsTrigger value="team-leaders">Team Leader Reports</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button 
                onClick={() => {
                  form.reset();
                  setIsFormOpen(true);
                }}
                className="bg-primary text-white hover:bg-primary/90 w-full md:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Report
              </Button>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Report Types</SelectItem>
                    <SelectItem value="daily">Daily Reports</SelectItem>
                    <SelectItem value="weekly">Weekly Reports</SelectItem>
                    <SelectItem value="monthly">Monthly Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {activeTab === "team-leaders" && (
                <div>
                  <Select value={filterAgent} onValueChange={setFilterAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Team Leaders</SelectItem>
                      {agents?.filter(agent => agent.role === "TeamLeader").map(agent => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Reports List */}
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  {activeTab === "all" 
                    ? "All reports in your territory" 
                    : activeTab === "my" 
                      ? "Reports you have created" 
                      : "Reports from team leaders"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(isLoadingReports || isLoadingTeamLeaderReports) ? (
                  <TableSkeleton columns={4} rows={5} />
                ) : (
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
                            Submitted By
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {filteredReports && filteredReports.length > 0 ? (
                          filteredReports.map((report) => (
                            <tr key={report.id}>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-neutral-900">{report.title}</div>
                                    <div className="text-sm text-neutral-500 truncate max-w-xs">
                                      {report.content.substring(0, 50)}...
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getReportBadgeColor(report.reportType)}`}>
                                  {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900">
                                  {getSubmitterName(report.submittedById)}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {report.isAggregated ? "Aggregated Report" : "Direct Report"}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900">
                                  {format(new Date(report.createdAt), 'PP')}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {format(new Date(report.createdAt), 'p')}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleViewReport(report)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                              {activeTab === "team-leaders" 
                                ? "No team leader reports found"
                                : activeTab === "my"
                                  ? "You haven't created any reports yet"
                                  : "No reports found"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Create Report Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Submit a new report for your sales territory
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateReport)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter report title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily Report</SelectItem>
                        <SelectItem value="weekly">Weekly Report</SelectItem>
                        <SelectItem value="monthly">Monthly Report</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter report details..." 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createReportMutation.isPending}
                >
                  {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Report Dialog */}
      <Dialog open={isViewReportOpen} onOpenChange={setIsViewReportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Detailed view of the selected report
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedReport.title}</h2>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getReportBadgeColor(selectedReport.reportType)}`}>
                      {selectedReport.reportType.charAt(0).toUpperCase() + selectedReport.reportType.slice(1)} Report
                    </span>
                    
                    {selectedReport.isAggregated && (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        Aggregated
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-neutral-500">Submitted on</div>
                  <div className="font-medium">{format(new Date(selectedReport.createdAt), 'PPP')}</div>
                  <div className="text-sm">{format(new Date(selectedReport.createdAt), 'p')}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 text-neutral-500 mr-2" />
                <div>
                  <span className="text-sm text-neutral-500">Submitted by: </span>
                  <span className="font-medium">{getSubmitterName(selectedReport.submittedById)}</span>
                </div>
              </div>
              
              <div className="border-t border-b py-4">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{selectedReport.content}</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewReportOpen(false)}
                  className="mr-2"
                >
                  Close
                </Button>
                
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}