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
  UsersRound, PenSquare, UserCheck, UserMinus, Plus, Search
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const salesStaffSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  isActive: z.boolean().default(true),
});

type SalesStaffFormData = z.infer<typeof salesStaffSchema>;

export default function ManagerSalesStaff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: salesStaff, isLoading } = useQuery<User[]>({
    queryKey: ["/api/manager/sales-staff"],
  });

  const createSalesStaffMutation = useMutation({
    mutationFn: async (data: SalesStaffFormData) => {
      const res = await apiRequest("POST", "/api/manager/sales-staff", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager/sales-staff'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Sales staff created successfully",
      });
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating sales staff",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSalesStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/manager/sales-staff/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manager/sales-staff'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Sales staff updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating sales staff",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<SalesStaffFormData>({
    resolver: zodResolver(salesStaffSchema),
    defaultValues: {
      workId: "",
      email: "",
      password: "",
      fullName: "",
      isActive: true,
    },
  });

  const editForm = useForm<Partial<SalesStaffFormData>>({
    resolver: zodResolver(salesStaffSchema.partial()),
    defaultValues: {
      fullName: "",
      isActive: true,
    },
  });

  const handleCreateSubmit = (data: SalesStaffFormData) => {
    createSalesStaffMutation.mutate(data);
  };

  const handleEditSubmit = (data: Partial<SalesStaffFormData>) => {
    if (selectedStaff) {
      updateSalesStaffMutation.mutate({ id: selectedStaff.id, data });
    }
  };

  const handleToggleActive = (staff: User) => {
    updateSalesStaffMutation.mutate({
      id: staff.id,
      data: { isActive: !staff.isActive },
    });
  };

  const handleEditClick = (staff: User) => {
    setSelectedStaff(staff);
    editForm.reset({
      fullName: staff.fullName,
    });
    setIsEditDialogOpen(true);
  };

  const filteredSalesStaff = salesStaff?.filter(staff => 
    staff.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.workId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { href: "/manager/dashboard", label: "Dashboard", icon: "view-dashboard" },
    { href: "/manager/sales-staff", label: "Sales Staff", icon: "account-multiple" },
    { href: "/manager/agents", label: "Agents", icon: "account-group" },
    { href: "/manager/attendance", label: "Attendance", icon: "calendar-check" },
    { href: "/manager/reports", label: "Reports", icon: "file-chart" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header title="Insurance Manager Portal" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} role="Manager" workId={user?.workId} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">Sales Staff</h2>
                <p className="text-neutral-600">Create and manage sales staff</p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Sales Staff
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder="Search sales staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              </div>
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
                          Team Size
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
                      {filteredSalesStaff && filteredSalesStaff.length > 0 ? (
                        filteredSalesStaff.map((staff) => (
                          <tr key={staff.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-secondary text-white rounded-full flex items-center justify-center">
                                  <UsersRound className="h-5 w-5" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-neutral-900">{staff.fullName}</div>
                                  <div className="text-sm text-neutral-500">North Region</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">{staff.workId}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">{staff.email}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">12 agents</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                staff.isActive 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {staff.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                className="text-primary hover:text-primary-dark mr-3"
                                onClick={() => handleEditClick(staff)}
                              >
                                <PenSquare className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleToggleActive(staff)}
                              >
                                {staff.isActive ? (
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
                          <td colSpan={6} className="px-4 py-4 text-center text-sm text-neutral-500">
                            {searchQuery ? "No matching sales staff found" : "No sales staff found"}
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

      {/* Create Sales Staff Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sales Staff</DialogTitle>
            <DialogDescription>
              Add a new sales staff to the system. They will be able to create and manage agents.
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
                      <Input placeholder="e.g., SLF123" {...field} />
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
                <Button type="submit" disabled={createSalesStaffMutation.isPending}>
                  {createSalesStaffMutation.isPending ? "Creating..." : "Create Sales Staff"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Sales Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sales Staff</DialogTitle>
            <DialogDescription>
              Update sales staff information.
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
                <Button type="submit" disabled={updateSalesStaffMutation.isPending}>
                  {updateSalesStaffMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
