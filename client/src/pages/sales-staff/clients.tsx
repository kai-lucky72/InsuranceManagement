import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  UserPlus, 
  Eye, 
  Calendar, 
  PhoneCall, 
  Mail, 
  ArrowUpDown, 
  FileText,
  Filter,
  Clock,
  CalendarDays
} from "lucide-react";
import { format } from "date-fns";

export default function SalesStaffClients() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [insuranceTypeFilter, setInsuranceTypeFilter] = useState<string>("all");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== "SalesStaff") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Fetch agents under this sales staff
  const { data: agents, isLoading: isLoadingAgents } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/agents"],
    enabled: !!user
  });

  // Fetch all clients under this sales staff
  const { data: allClients, isLoading: isLoadingClients } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/clients"],
    enabled: !!user
  });

  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  // Filter clients based on selected filters
  const filteredClients = allClients?.filter(client => {
    // Filter by agent
    const agentMatches = selectedAgent === "all" || client.agentId.toString() === selectedAgent;
    
    // Filter by search query (name, email, phone)
    const searchMatches = 
      !searchQuery || 
      client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      client.phone.includes(searchQuery);
    
    // Filter by insurance type
    const insuranceMatches = insuranceTypeFilter === "all" || client.insuranceType === insuranceTypeFilter;
    
    // Filter by timeframe
    let timeframeMatches = true;
    if (timeframeFilter !== "all") {
      const clientDate = new Date(client.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (timeframeFilter === "today") {
        const dayStart = new Date(today);
        timeframeMatches = clientDate >= dayStart;
      } else if (timeframeFilter === "week") {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        timeframeMatches = clientDate >= weekStart;
      } else if (timeframeFilter === "month") {
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        timeframeMatches = clientDate >= monthStart;
      }
    }
    
    return agentMatches && searchMatches && insuranceMatches && timeframeMatches;
  });

  // Get unique insurance types from clients
  const insuranceTypes = allClients 
    ? Array.from(new Set(allClients.map(client => client.insuranceType)))
    : [];

  // Get agents map for displaying names
  const agentsMap = agents?.reduce((acc, agent) => {
    acc[agent.id] = agent.fullName;
    return acc;
  }, {}) || {};

  const isLoading = isLoadingAgents || isLoadingClients;

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
              <h2 className="text-2xl font-bold text-neutral-800">Client Management</h2>
              <p className="text-neutral-600">View and manage clients added by your agents</p>
            </div>
            
            {/* Filters and Search */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              </div>
              
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents?.map(agent => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={insuranceTypeFilter} onValueChange={setInsuranceTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by insurance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Insurance Types</SelectItem>
                  {insuranceTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Client List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Client Database</CardTitle>
                    <CardDescription>
                      {filteredClients?.length || 0} clients found
                    </CardDescription>
                  </div>
                  <Button onClick={() => setLocation("/sales-staff/reports")}>
                    <FileText className="mr-2 h-4 w-4" /> Generate Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton columns={6} rows={5} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Agent
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
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {filteredClients && filteredClients.length > 0 ? (
                          filteredClients.map((client) => (
                            <tr key={client.id}>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                                    <UserPlus className="h-5 w-5" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-neutral-900">{client.fullName}</div>
                                    <div className="text-sm text-neutral-500">{client.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900">{agentsMap[client.agentId] || "Unknown Agent"}</div>
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
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="mr-1"
                                  onClick={() => handleViewClient(client)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                              {searchQuery || selectedAgent !== "all" || insuranceTypeFilter !== "all" || timeframeFilter !== "all"
                                ? "No clients match your search criteria"
                                : "No clients have been added by your agents yet"}
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
      
      {/* View Client Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
            <DialogDescription>Complete information about this client</DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <div className="grid gap-4 py-4">
              <div className="text-center mb-4">
                <div className="h-20 w-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto">
                  <UserPlus className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold mt-2">{selectedClient.fullName}</h3>
                <p className="text-sm text-neutral-500">Added by {agentsMap[selectedClient.agentId] || "Unknown Agent"}</p>
              </div>
              
              <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <div className="flex items-center text-neutral-500">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  <span>Phone</span>
                </div>
                <div>{selectedClient.phone}</div>
              </div>
              
              {selectedClient.email && (
                <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                  <div className="flex items-center text-neutral-500">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>Email</span>
                  </div>
                  <div>{selectedClient.email}</div>
                </div>
              )}
              
              <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <div className="flex items-center text-neutral-500">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Type</span>
                </div>
                <div>
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {selectedClient.insuranceType}
                  </span>
                </div>
              </div>
              
              {selectedClient.policyDetails && (
                <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                  <div className="flex items-center text-neutral-500">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Details</span>
                  </div>
                  <div className="text-sm">{selectedClient.policyDetails}</div>
                </div>
              )}
              
              <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <div className="flex items-center text-neutral-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Added</span>
                </div>
                <div className="text-sm">{format(new Date(selectedClient.createdAt), 'PPpp')}</div>
              </div>
              
              <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <div className="flex items-center text-neutral-500">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Follow-up</span>
                </div>
                <div>
                  {selectedClient.requiresFollowUp ? (
                    <div className="flex items-center">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">
                        Required
                      </span>
                      {selectedClient.followUpDate && (
                        <span className="text-sm">
                          on {format(new Date(selectedClient.followUpDate), 'PP')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm">Not required</span>
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <Button className="w-full" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}