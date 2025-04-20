import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { User } from "@shared/schema";
import { 
  UsersRound, Search, Eye, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ManagerAgents() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: salesStaff, isLoading: isLoadingSalesStaff } = useQuery<User[]>({
    queryKey: ["/api/manager/sales-staff"],
  });

  // This would be a real API call in a production app
  const { data: agents, isLoading: isLoadingAgents } = useQuery<User[]>({
    queryKey: ["/api/manager/agents"],
    enabled: false,
  });

  const navItems = [
    { href: "/manager/dashboard", label: "Dashboard", icon: "view-dashboard" },
    { href: "/manager/sales-staff", label: "Sales Staff", icon: "account-multiple" },
    { href: "/manager/agents", label: "Agents", icon: "account-group" },
    { href: "/manager/attendance", label: "Attendance", icon: "calendar-check" },
    { href: "/manager/reports", label: "Reports", icon: "file-chart" },
  ];

  // Mock data for the view
  const mockAgents = [
    { id: 1, fullName: "John Davis", workId: "AGT001", email: "john.davis@example.com", type: "TeamLeader", attendance: "Present", clientsAdded: 7, isActive: true },
    { id: 2, fullName: "Maria Garcia", workId: "AGT002", email: "maria.g@example.com", type: "Individual", attendance: "Present", clientsAdded: 5, isActive: true },
    { id: 3, fullName: "Robert Chen", workId: "AGT003", email: "robert.c@example.com", type: "Individual", attendance: "Absent", clientsAdded: 3, isActive: true },
    { id: 4, fullName: "Sarah Johnson", workId: "AGT004", email: "sarah.j@example.com", type: "TeamLeader", attendance: "Present", clientsAdded: 9, isActive: true },
    { id: 5, fullName: "Michael Brown", workId: "AGT005", email: "michael.b@example.com", type: "Individual", attendance: "Late", clientsAdded: 2, isActive: true },
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

  const isLoading = isLoadingSalesStaff || isLoadingAgents;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header title="Insurance Manager Portal" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} role="Manager" workId={user?.workId} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">Agents</h2>
                <p className="text-neutral-600">View and monitor agent performance</p>
              </div>
            </div>
            
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Agent Overview</CardTitle>
                <CardDescription>View all agents across all sales staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-neutral-200">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Total Agents</div>
                    <div className="text-2xl font-bold">{filteredAgents.length}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-neutral-200">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Team Leaders</div>
                    <div className="text-2xl font-bold">{filteredAgents.filter(a => a.type === "TeamLeader").length}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-neutral-200">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Individual Agents</div>
                    <div className="text-2xl font-bold">{filteredAgents.filter(a => a.type === "Individual").length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between items-center mb-4">
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
                  <AgentTable agents={filteredAgents} isLoading={isLoading} />
                </TabsContent>
                
                <TabsContent value="individual" className="m-0">
                  <AgentTable 
                    agents={filteredAgents.filter(a => a.type === "Individual")}
                    isLoading={isLoading}
                  />
                </TabsContent>
                
                <TabsContent value="teamLeader" className="m-0">
                  <AgentTable 
                    agents={filteredAgents.filter(a => a.type === "TeamLeader")}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface AgentTableProps {
  agents: any[];
  isLoading: boolean;
}

function AgentTable({ agents, isLoading }: AgentTableProps) {
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
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-neutral-500">
                    <div className="flex flex-col items-center py-8">
                      <AlertCircle className="h-12 w-12 text-neutral-300 mb-3" />
                      <p>No agents found</p>
                      {searchQuery && <p className="text-xs mt-1">Try adjusting your search query</p>}
                    </div>
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
