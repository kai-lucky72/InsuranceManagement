import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { HelpRequest } from "@shared/schema";
import { UsersRound, Bell, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminHelpRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: helpRequests, isLoading } = useQuery<HelpRequest[]>({
    queryKey: ["/api/admin/help-requests"],
  });

  const updateHelpRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/help-requests/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/help-requests'] });
      setIsDialogOpen(false);
      toast({
        title: "Help request updated",
        description: "The help request has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating help request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestClick = (request: HelpRequest) => {
    setSelectedRequest(request);
    setStatusUpdate(request.status);
    setNotes("");
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedRequest) {
      updateHelpRequestMutation.mutate({ id: selectedRequest.id, status: statusUpdate });
    }
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
                <h2 className="text-2xl font-bold text-neutral-800">Help Requests</h2>
                <p className="text-neutral-600">Manage and respond to user help requests</p>
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
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Issue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Submitted
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
                      {helpRequests && helpRequests.length > 0 ? (
                        helpRequests.map((request) => (
                          <tr key={request.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-secondary text-white rounded-full flex items-center justify-center">
                                  <UsersRound className="h-4 w-4" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-neutral-900">User #{request.userId}</div>
                                  <div className="text-xs text-neutral-500">{request.userId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">{request.requestType}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-neutral-900 truncate max-w-xs">{request.issue}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">
                                {format(new Date(request.createdAt), 'MMM d, yyyy')}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                request.status === 'Pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : request.status === 'In Review'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <Button size="sm" variant="outline" onClick={() => handleRequestClick(request)}>
                                Resolve
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-sm text-neutral-500">
                            No help requests found
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

      {/* Help Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Help Request Details</DialogTitle>
            <DialogDescription>
              View and update the status of this help request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="text-neutral-500 text-sm">Request Type</Label>
                <div className="font-medium">{selectedRequest.requestType}</div>
              </div>
              <div>
                <Label className="text-neutral-500 text-sm">Issue</Label>
                <div className="font-medium">{selectedRequest.issue}</div>
              </div>
              <div>
                <Label className="text-neutral-500 text-sm">Submitted</Label>
                <div className="font-medium">{format(new Date(selectedRequest.createdAt), 'PPP')}</div>
              </div>
              <div>
                <Label className="text-neutral-500 text-sm">Current Status</Label>
                <div className="font-medium">{selectedRequest.status}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Review">In Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Internal)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this request" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updateHelpRequestMutation.isPending}>
              {updateHelpRequestMutation.isPending ? (
                "Updating..."
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
