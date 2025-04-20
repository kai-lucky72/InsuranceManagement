import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, Search, Filter, Eye, Edit, AlertCircle, ChevronDown, User, Users, Trash, CheckCircle, XCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema for adding a new agent
const agentFormSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  type: z.enum(["Individual", "TeamLeader"], {
    required_error: "Agent type is required",
  }),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

export default function SalesStaffAgents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [excuseReason, setExcuseReason] = useState("");
  
  useEffect(() => {
    if (user?.role !== "SalesStaff") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      workId: "",
      email: "",
      password: "",
      fullName: "",
      type: "Individual",
    },
  });

  const { data: agents, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/agents"],
    enabled: !!user
  });

  // Today's date for attendance filtering
  const today = new Date().toISOString().split('T')[0];

  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/attendance", { date: today }],
    enabled: !!user
  });

  // Create new agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const res = await apiRequest("POST", "/api/sales-staff/agents", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-staff/agents'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Agent created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Excuse an agent's attendance mutation
  const excuseAttendanceMutation = useMutation({
    mutationFn: async ({ recordId, reason }: { recordId: number; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/sales-staff/attendance/${recordId}/excuse`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-staff/attendance'] });
      setIsExcuseDialogOpen(false);
      setExcuseReason("");
      toast({
        title: "Success",
        description: "Agent excused successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error excusing agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AgentFormData) => {
    createAgentMutation.mutate(data);
  };

  const handleExcuseClick = (record: any) => {
    setSelectedAgent(record);
    setExcuseReason("");
    setIsExcuseDialogOpen(true);
  };

  const handleExcuseSubmit = () => {
    if (selectedAgent && excuseReason) {
      excuseAttendanceMutation.mutate({
        recordId: selectedAgent.id,
        reason: excuseReason
      });
    }
  };

  const handleViewAgent = (agent: any) => {
    setSelectedAgent(agent);
    setIsViewDialogOpen(true);
  };

  // Filter agents based on search query and type filter
  const filteredAgents = agents?.filter(agent => {
    const matchesSearch = 
      agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.workId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = 
      selectedType === "All" || 
      (selectedType === "TeamLeader" && agent.role === "TeamLeader") ||
      (selectedType === "Individual" && agent.role === "Agent");
    
    return matchesSearch && matchesType;
  });

  // Helper function to get agent's attendance status for today
  const getAgentAttendance = (agentId: number) => {
    if (!attendanceRecords) return null;
    return attendanceRecords.find(record => record.agentId === agentId);
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">Agent Management</h2>
                <p className="text-neutral-600">Add, view, and manage your agents</p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Agent
              </Button>
            </div>
            
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <div className="relative flex-grow">
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Agents</SelectItem>
                  <SelectItem value="Individual">Individual Agents</SelectItem>
                  <SelectItem value="TeamLeader">Team Leaders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Agents</CardTitle>
                <CardDescription>
                  {filteredAgents?.length} agents found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton columns={7} rows={5} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Work ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Today's Attendance
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {filteredAgents && filteredAgents.length > 0 ? (
                          filteredAgents.map((agent) => {
                            const attendance = getAgentAttendance(agent.id);
                            
                            return (
                              <tr key={agent.id}>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-accent text-white rounded-full flex items-center justify-center">
                                      {agent.role === "TeamLeader" ? (
                                        <Users className="h-5 w-5" />
                                      ) : (
                                        <User className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-neutral-900">{agent.fullName}</div>
                                      <div className="text-sm text-neutral-500">{agent.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm text-neutral-900">{agent.workId}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    agent.role === 'TeamLeader' 
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {agent.role === 'TeamLeader' ? 'Team Leader' : 'Individual Agent'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  {attendance ? (
                                    <div className="flex items-center">
                                      <div className={`flex-shrink-0 h-3 w-3 rounded-full ${
                                        attendance.isExcused 
                                          ? 'bg-blue-500'
                                          : attendance.isLate
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                      } mr-2`}></div>
                                      <div className="text-sm text-neutral-900">
                                        {attendance.isExcused 
                                          ? 'Excused'
                                          : attendance.isLate
                                            ? 'Late'
                                            : 'Present'
                                        }
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                                      <div className="text-sm text-neutral-900">Absent</div>
                                      <Button 
                                        size="sm" 
                                        variant="link" 
                                        className="text-xs text-primary ml-2"
                                        onClick={() => handleExcuseClick(agent)}
                                      >
                                        Excuse
                                      </Button>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    agent.isActive 
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {agent.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        Actions <ChevronDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewAgent(agent)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Agent
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {agent.isActive ? (
                                        <DropdownMenuItem className="text-red-600">
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Deactivate
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem className="text-green-600">
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Activate
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                              {searchQuery || selectedType !== "All" 
                                ? "No agents match your search criteria" 
                                : "No agents found. Add your first agent to get started."
                              }
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
      
      {/* Add Agent Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
            <DialogDescription>
              Create a new agent or team leader account.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="agent@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="•••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Individual">Individual Agent</SelectItem>
                        <SelectItem value="TeamLeader">Team Leader</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Team leaders can manage individual agents assigned to them.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAgentMutation.isPending}>
                  {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Agent Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="py-4 space-y-4">
              <div className="flex items-center mb-4">
                <div className="h-16 w-16 bg-accent text-white rounded-full flex items-center justify-center">
                  {selectedAgent.role === "TeamLeader" ? (
                    <Users className="h-8 w-8" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-xl font-bold text-neutral-900">{selectedAgent.fullName}</div>
                  <div className="text-sm text-neutral-500">{selectedAgent.role === "TeamLeader" ? "Team Leader" : "Individual Agent"}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-neutral-500">Work ID</Label>
                  <div className="text-sm font-medium text-neutral-900">{selectedAgent.workId}</div>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Email</Label>
                  <div className="text-sm font-medium text-neutral-900">{selectedAgent.email}</div>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Status</Label>
                  <div className="text-sm font-medium text-neutral-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedAgent.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {selectedAgent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Created</Label>
                  <div className="text-sm font-medium text-neutral-900">
                    {format(new Date(selectedAgent.createdAt), 'PPP')}
                  </div>
                </div>
              </div>
              
              <Tabs defaultValue="performance">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </TabsList>
                <TabsContent value="performance">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center py-4">
                        <div className="text-3xl font-bold text-secondary">0</div>
                        <div className="text-sm text-neutral-500">Clients added this week</div>
                      </div>
                      <div className="text-xs text-neutral-500 text-center">
                        Performance data will be available once the agent adds clients
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="clients">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center py-4">
                        <div className="text-3xl font-bold text-secondary">0</div>
                        <div className="text-sm text-neutral-500">Total clients</div>
                      </div>
                      <div className="text-xs text-neutral-500 text-center">
                        No clients have been added by this agent yet
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="attendance">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center py-4">
                        <div className="text-3xl font-bold text-secondary">-</div>
                        <div className="text-sm text-neutral-500">Attendance rate</div>
                      </div>
                      <div className="text-xs text-neutral-500 text-center">
                        No attendance records available for this agent
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Excuse Agent Dialog */}
      <Dialog open={isExcuseDialogOpen} onOpenChange={setIsExcuseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excuse Agent Absence</DialogTitle>
            <DialogDescription>
              Provide a reason for excusing this agent's absence.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedAgent && (
              <div className="mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-medium">{selectedAgent.fullName}</span>
                  <span className="ml-2 text-neutral-500">({selectedAgent.workId})</span>
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  This agent has not checked in for attendance today. Providing an excuse will allow them to add clients.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="reason">Excuse Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Doctor's appointment, family emergency, etc."
                value={excuseReason}
                onChange={(e) => setExcuseReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExcuseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExcuseSubmit}
              disabled={!excuseReason || excuseAttendanceMutation.isPending}
            >
              {excuseAttendanceMutation.isPending ? "Excusing..." : "Excuse Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}