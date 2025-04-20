import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { User } from "@shared/schema";
import { 
  UsersRound, PenSquare, UserCheck, UserMinus, Plus, Search, Eye, CheckCircle
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AgentForm } from "@/components/forms/agent-form";

export default function SalesStaffAgents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [excuseReason, setExcuseReason] = useState("");

  const { data: agents, isLoading } = useQuery<User[]>({
    queryKey: ["/api/sales-staff/agents"],
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/sales-staff/agents", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-staff/agents'] });
      setIsCreateDialogOpen(false);
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

  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/sales-staff/agents/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-staff/agents'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Agent updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating agent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const excuseAttendanceMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/sales-staff/attendance/${id}/excuse`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-staff/agents'] });
      setIsExcuseDialogOpen(false);
      toast({
        title: "Success",
        description: "Agent attendance excused",
      });
      setExcuseReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error excusing attendance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (data: any) => {
    createAgentMutation.mutate(data);
  };

  const handleEditSubmit = (data: any) => {
    if (selectedAgent) {
      updateAgentMutation.mutate({ id: selectedAgent.id, data });
    }
  };

  const handleExcuseSubmit = () => {
    if (selectedAgent && excuseReason) {
      excuseAttendanceMutation.mutate({ id: selectedAgent.id, reason: excuseReason });
    }
  };

  const handleToggleActive = (agent: User) => {
    updateAgentMutation.mutate({
      id: agent.id,
      data: { isActive: !agent.isActive },
    });
  };

  const handleEditClick = (agent: any) => {
    setSelectedAgent(agent);
    setIsEditDialogOpen(true);
  };

  const handleExcuseClick = (agent: any) => {
    setSelectedAgent(agent);
    setIsExcuseDialogOpen(true);
  };

  // Mock data for the view
  const mockAgents = [
    { id: 1, fullName: "John Davis", workId: "AGT001", email: "john.davis@example.com", type: "TeamLeader", attendance: "Present", clientsAdded: 7, isActive: true },
    { id: 2, fullName: "Maria Garcia", workId: "AGT002", email: "maria.g@example.com", type: "Individual", attendance: "Present", clientsAdded: 5, isActive: true },
    { id: 3, fullName: "Robert Chen", workId: "AGT003", email: "robert.c@example.com", type: "Individual", attendance: "Absent", clientsAdded: 3, isActive: true },
  ];

  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = 
      agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.workId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "individual") return matchesSearch && agent.type === "Individual";
    if (activeTab === "teamLeader") return matchesSearch && agent.type === "TeamLeader";
    
    return matchesSearch;
  });

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
                <h2 className="text-2xl font-bold text-neutral-800">Agents</h2>
                <p className="text-neutral-600">Create and manage agents</p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add New Agent
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Agents</TabsTrigger>
                <TabsTrigger value="individual">Individual Agents</TabsTrigger>
                <TabsTrigger value="teamLeader">Team Leaders</TabsTrigger>
              </TabsList>
              
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full sm:w-64">
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                </div>
              </div>
              
              <TabsContent value="all" className="m-0">
                <AgentTable 
                  agents={filteredAgents} 
                  isLoading={isLoading}
                  onEdit={handleEditClick}
                  onExcuse={handleExcuseClick}
                  onToggleActive={handleToggleActive}
                />
              </TabsContent>
              
              <TabsContent value="individual" className="m-0">
                <AgentTable 
                  agents={filteredAgents.filter(a => a.type === "Individual")} 
                  isLoading={isLoading}
                  onEdit={handleEditClick}
                  onExcuse={handleExcuseClick}
                  onToggleActive={handleToggleActive}
                />
              </TabsContent>
              
              <TabsContent value="teamLeader" className="m-0">
                <AgentTable 
                  agents={filteredAgents.filter(a => a.type === "TeamLeader")} 
                  isLoading={isLoading}
                  onEdit={handleEditClick}
                  onExcuse={handleExcuseClick}
                  onToggleActive={handleToggleActive}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Add a new agent to your team. Choose between Individual Agent or Team Leader.
            </DialogDescription>
          </DialogHeader>
          <AgentForm onSubmit={handleCreateSubmit} isSubmitting={createAgentMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update agent information.
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <AgentForm 
              agent={selectedAgent} 
              onSubmit={handleEditSubmit} 
              isSubmitting={updateAgentMutation.isPending} 
              isEditMode
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Excuse Attendance Dialog */}
      <Dialog open={isExcuseDialogOpen} onOpenChange={setIsExcuseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excuse Absence</DialogTitle>
            <DialogDescription>
              Provide a reason for excusing this agent's absence.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="excuse-reason" className="block text-sm font-medium text-neutral-700">Reason</label>
                <textarea
                  id="excuse-reason"
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-20"
                  placeholder="Enter reason for excusing absence"
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExcuseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExcuseSubmit} 
              disabled={excuseAttendanceMutation.isPending || !excuseReason}
            >
              {excuseAttendanceMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Submit Excuse
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AgentTableProps {
  agents: any[];
  isLoading: boolean;
  onEdit: (agent: any) => void;
  onExcuse: (agent: any) => void;
  onToggleActive: (agent: any) => void;
}

function AgentTable({ agents, isLoading, onEdit, onExcuse, onToggleActive }: AgentTableProps) {
  return (
    <div className="bg-white rounded-lg shadow">
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
                  Attendance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Clients Added
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
              {agents && agents.length > 0 ? (
                agents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-accent text-white rounded-full flex items-center justify-center">
                          <UsersRound className="h-5 w-5" />
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
                        agent.type === 'TeamLeader' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {agent.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-4 w-4 rounded-full ${
                          agent.attendance === 'Present' 
                            ? 'bg-green-500'
                            : agent.attendance === 'Late'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}></div>
                        <div className="ml-2 text-sm text-neutral-900">{agent.attendance}</div>
                        {agent.attendance === 'Absent' && (
                          <Button 
                            size="sm" 
                            variant="link" 
                            className="text-xs text-primary ml-2"
                            onClick={() => onExcuse(agent)}
                          >
                            Excuse
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{agent.clientsAdded} this week</div>
                      <div className="text-xs text-green-600">+1 today</div>
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
                      <Button size="sm" variant="ghost" className="text-secondary hover:text-secondary-dark mr-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary-dark mr-2"
                        onClick={() => onEdit(agent)}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-neutral-500 hover:text-neutral-700"
                        onClick={() => onToggleActive(agent)}
                      >
                        {agent.isActive ? (
                          <UserMinus className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-neutral-500">
                    No agents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
