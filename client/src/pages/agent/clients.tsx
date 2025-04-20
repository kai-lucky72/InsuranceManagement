import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ClientForm } from "@/components/forms/client-form";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Search, PlusCircle, Eye, Edit, Trash, UserPlus, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export default function AgentClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isMobile = useMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  useEffect(() => {
    if (user && user.role !== "Agent" && user.role !== "TeamLeader") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const { data: attendance } = useQuery<any>({
    queryKey: ["/api/agent/attendance", { date: new Date().toISOString().split('T')[0] }],
    enabled: !!user
  });

  const { data: clients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/agent/clients"],
    enabled: !!user
  });

  const canAddClients = attendance?.length > 0 || attendance?.isExcused;

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/agent/clients", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/clients'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/agent/clients/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/clients'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/agent/clients/${id}`, undefined);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/clients'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddClient = (data: any) => {
    createClientMutation.mutate({
      ...data,
      interactionTime: new Date().toISOString(),
    });
  };

  const handleUpdateClient = (data: any) => {
    if (selectedClient) {
      updateClientMutation.mutate({
        id: selectedClient.id,
        data
      });
    }
  };

  const handleDeleteClient = () => {
    if (selectedClient) {
      deleteClientMutation.mutate(selectedClient.id);
    }
  };

  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (client: any) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const filteredClients = clients?.filter(client => 
    client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.insuranceType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          title="Clients" 
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
            <div className="flex justify-between items-center mb-6">
              {!isMobile && (
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">Clients</h2>
                  <p className="text-neutral-600">Manage your client information</p>
                </div>
              )}
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                disabled={!canAddClients}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </div>
            
            {!canAddClients && (
              <Card className="mb-6 border-red-300 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <p>You need to check in for attendance before adding clients. Please visit the <a href="/agent/attendance" className="underline">attendance page</a> to check in.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="mb-4">
              <div className="relative">
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              </div>
            </div>
            
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Client List</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton columns={4} rows={5} />
                ) : (
                  <>
                    {filteredClients && filteredClients.length > 0 ? (
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
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {filteredClients.map((client) => (
                              <tr key={client.id}>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-neutral-900">{client.fullName}</div>
                                    <div className="text-xs text-neutral-500">{client.phone}</div>
                                  </div>
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
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="mr-1"
                                    onClick={() => handleEditClient(client)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-500"
                                    onClick={() => handleDeleteClick(client)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <div className="bg-neutral-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                          <UserPlus className="h-10 w-10 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-1">No clients found</h3>
                        <p className="text-neutral-500 mb-4">
                          {searchQuery 
                            ? "Try adjusting your search terms"
                            : "Start adding clients to see them here"
                          }
                        </p>
                        {!searchQuery && (
                          <Button 
                            onClick={() => setIsAddDialogOpen(true)}
                            disabled={!canAddClients}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Client
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {isMobile && <MobileNav navItems={navItems} />}
      
      {/* Add Client Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className={isMobile ? "w-full max-w-full h-full" : "max-w-xl"}>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the details of your new client.
            </DialogDescription>
          </DialogHeader>
          <ClientForm onSubmit={handleAddClient} isSubmitting={createClientMutation.isPending} />
        </DialogContent>
      </Dialog>
      
      {/* View Client Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Full Name:</div>
                <div className="col-span-3">{selectedClient.fullName}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Email:</div>
                <div className="col-span-3">{selectedClient.email || "-"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Phone:</div>
                <div className="col-span-3">{selectedClient.phone}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Insurance Type:</div>
                <div className="col-span-3">{selectedClient.insuranceType}</div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <div className="font-medium text-right">Policy Details:</div>
                <div className="col-span-3">{selectedClient.policyDetails || "-"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Added On:</div>
                <div className="col-span-3">{format(new Date(selectedClient.createdAt), 'PPpp')}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium text-right">Follow-up Required:</div>
                <div className="col-span-3">{selectedClient.requiresFollowUp ? "Yes" : "No"}</div>
              </div>
              {selectedClient.requiresFollowUp && selectedClient.followUpDate && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="font-medium text-right">Follow-up Date:</div>
                  <div className="col-span-3">{format(new Date(selectedClient.followUpDate), 'PP')}</div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button 
              variant="default" 
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEditClient(selectedClient);
              }}
            >
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={isMobile ? "w-full max-w-full h-full" : "max-w-xl"}>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client information.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <ClientForm 
              client={selectedClient} 
              onSubmit={handleUpdateClient} 
              isSubmitting={updateClientMutation.isPending}
              isEditMode
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              record and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClient}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteClientMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
