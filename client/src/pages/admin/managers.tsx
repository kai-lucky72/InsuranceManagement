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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { User } from "@shared/schema";
import { 
  UsersRound, PenSquare, UserCheck, UserMinus, Bell, Plus
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const managerSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  isActive: z.boolean().default(true),
});

type ManagerFormData = z.infer<typeof managerSchema>;

export default function AdminManagers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<User | null>(null);

  const { data: managers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/managers"],
  });
  
  const { data: helpRequests } = useQuery<any[]>({
    queryKey: ["/api/admin/help-requests"],
  });

  const createManagerMutation = useMutation({
    mutationFn: async (data: ManagerFormData) => {
      const res = await apiRequest("POST", "/api/admin/managers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/managers'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Manager created successfully",
      });
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating manager",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateManagerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/admin/managers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/managers'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Manager updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating manager",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<ManagerFormData>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      workId: "",
      email: "",
      password: "",
      fullName: "",
      isActive: true,
    },
  });

  const editForm = useForm<Partial<ManagerFormData>>({
    resolver: zodResolver(managerSchema.partial()),
    defaultValues: {
      fullName: "",
      isActive: true,
    },
  });

  const handleCreateSubmit = (data: ManagerFormData) => {
    createManagerMutation.mutate(data);
  };

  const handleEditSubmit = (data: Partial<ManagerFormData>) => {
    if (selectedManager) {
      updateManagerMutation.mutate({ id: selectedManager.id, data });
    }
  };

  const handleToggleActive = (manager: User) => {
    updateManagerMutation.mutate({
      id: manager.id,
      data: { isActive: !manager.isActive },
    });
  };

  const handleEditClick = (manager: User) => {
    setSelectedManager(manager);
    editForm.reset({
      fullName: manager.fullName,
    });
    setIsEditDialogOpen(true);
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/managers", label: "Managers", icon: "account-tie" },
    { href: "/admin/help-requests", label: "Help Requests", icon: "help-circle-outline", badge: helpRequests?.length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header title="Insurance Admin Portal" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} role="Admin" workId={user?.workId} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">Managers</h2>
                <p className="text-neutral-600">Create and manage system managers</p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Manager
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              {isLoading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Work ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Email
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
                      {managers && managers.length > 0 ? (
                        managers.map((manager) => (
                          <tr key={manager.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                                  <UsersRound className="h-5 w-5" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-neutral-900">{manager.fullName}</div>
                                  <div className="text-sm text-neutral-500">Regional Manager</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">{manager.workId}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">{manager.email}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                manager.isActive 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {manager.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                className="text-primary hover:text-primary-dark mr-3"
                                onClick={() => handleEditClick(manager)}
                              >
                                <PenSquare className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleToggleActive(manager)}
                              >
                                {manager.isActive ? (
                                  <UserMinus className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-center text-sm text-neutral-500">
                            No managers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Manager Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Manager</DialogTitle>
            <DialogDescription>
              Add a new manager to the system. They will be able to create and manage sales staff.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="workId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MGR123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
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
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createManagerMutation.isPending}>
                  {createManagerMutation.isPending ? "Creating..." : "Create Manager"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Manager Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Manager</DialogTitle>
            <DialogDescription>
              Update manager information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateManagerMutation.isPending}>
                  {updateManagerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
