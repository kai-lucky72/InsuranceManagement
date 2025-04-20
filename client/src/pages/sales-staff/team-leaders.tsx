import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  UserPlus, 
  Monitor, 
  Eye, 
  Edit, 
  UserCheck, 
  UserX, 
  CheckCircle,
  XCircle,
  Users,
  CalendarCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const teamLeaderSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  workId: z.string().min(3, "Work ID must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type TeamLeaderFormData = z.infer<typeof teamLeaderSchema>;

export default function SalesStaffTeamLeaders() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<any | null>(null);
  const [isViewTeamLeaderOpen, setIsViewTeamLeaderOpen] = useState(false);
  const [isEditTeamLeaderOpen, setIsEditTeamLeaderOpen] = useState(false);
  
  const form = useForm<TeamLeaderFormData>({
    resolver: zodResolver(teamLeaderSchema),
    defaultValues: {
      fullName: "",
      email: "",
      workId: "",
      password: ""
    }
  });

  useEffect(() => {
    if (user?.role !== "SalesStaff") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Fetch team leaders data
  const { data: teamLeaders, isLoading: isLoadingTeamLeaders } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/team-leaders"],
    enabled: !!user
  });

  // Mutation for creating team leader
  const createTeamLeaderMutation = useMutation({
    mutationFn: async (data: TeamLeaderFormData) => {
      const res = await apiRequest("POST", "/api/sales-staff/team-leaders", {
        ...data,
        role: "TeamLeader",
        isActive: true
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Team leader created successfully",
        variant: "success"
      });
      setIsFormOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/team-leaders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create team leader",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for deactivating team leader
  const toggleTeamLeaderStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/sales-staff/team-leaders/${id}/status`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Team leader status updated",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/team-leaders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update team leader status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter team leaders based on search query
  const filteredTeamLeaders = teamLeaders?.filter(tl => 
    tl.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tl.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tl.workId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTeamLeader = (data: TeamLeaderFormData) => {
    createTeamLeaderMutation.mutate(data);
  };

  const handleViewTeamLeader = (teamLeader: any) => {
    setSelectedTeamLeader(teamLeader);
    setIsViewTeamLeaderOpen(true);
  };

  const handleToggleStatus = (teamLeader: any) => {
    toggleTeamLeaderStatusMutation.mutate({
      id: teamLeader.id,
      isActive: !teamLeader.isActive
    });
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
              <h2 className="text-2xl font-bold text-neutral-800">Team Leader Management</h2>
              <p className="text-neutral-600">Manage team leaders assigned to your sales territory</p>
            </div>

            {/* Actions and Search */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative w-full md:w-64">
                <Input
                  placeholder="Search team leaders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              </div>
              
              <Button 
                onClick={() => {
                  form.reset();
                  setIsFormOpen(true);
                }}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Team Leader
              </Button>
            </div>
            
            {/* Team Leaders List */}
            <Card>
              <CardHeader>
                <CardTitle>Team Leaders</CardTitle>
                <CardDescription>
                  Manage the team leaders who supervise groups of agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTeamLeaders ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Team Leader
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Work ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Group
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {filteredTeamLeaders && filteredTeamLeaders.length > 0 ? (
                          filteredTeamLeaders.map((teamLeader) => (
                            <tr key={teamLeader.id}>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-neutral-900">{teamLeader.fullName}</div>
                                    <div className="text-sm text-neutral-500">{teamLeader.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900">{teamLeader.workId}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {teamLeader.isActive ? (
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setLocation(`/sales-staff/team-leaders/${teamLeader.id}/group`)}
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  View Group
                                </Button>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleViewTeamLeader(teamLeader)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleToggleStatus(teamLeader)}
                                  >
                                    {teamLeader.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                              {searchQuery ? "No team leaders match your search" : "No team leaders found"}
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
      
      {/* Add Team Leader Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Team Leader</DialogTitle>
            <DialogDescription>
              Create a new team leader who will manage a group of agents
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddTeamLeader)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
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
                      <Input placeholder="Enter email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter work ID" {...field} />
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
                      <Input placeholder="Enter password" type="password" {...field} />
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
                  disabled={createTeamLeaderMutation.isPending}
                >
                  {createTeamLeaderMutation.isPending ? "Creating..." : "Create Team Leader"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* View Team Leader Dialog */}
      <Dialog open={isViewTeamLeaderOpen} onOpenChange={setIsViewTeamLeaderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Team Leader Details</DialogTitle>
            <DialogDescription>
              Detailed information about this team leader
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeamLeader && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="h-20 w-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto">
                  <User className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold mt-2">{selectedTeamLeader.fullName}</h3>
                <p className="text-sm text-neutral-500">Team Leader</p>
              </div>
              
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Work ID:</div>
                <div>{selectedTeamLeader.workId}</div>
              </div>
              
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Email:</div>
                <div>{selectedTeamLeader.email}</div>
              </div>
              
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Status:</div>
                <div>
                  {selectedTeamLeader.isActive ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              
              <div className="pt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewTeamLeaderOpen(false)}
                >
                  Close
                </Button>
                
                <div className="flex space-x-2">
                  <Button 
                    variant={selectedTeamLeader.isActive ? "destructive" : "success"}
                    onClick={() => {
                      handleToggleStatus(selectedTeamLeader);
                      setIsViewTeamLeaderOpen(false);
                    }}
                  >
                    {selectedTeamLeader.isActive ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => setLocation(`/sales-staff/team-leaders/${selectedTeamLeader.id}/group`)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Group
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}