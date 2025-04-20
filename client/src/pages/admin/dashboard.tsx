import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User, HelpRequest } from "@shared/schema";
import { 
  UsersRound, Bell, ArrowRight, PenSquare, UserMinus, UserCheck, Download, Eye
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role !== "Admin") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const { data: managers, isLoading: isLoadingManagers } = useQuery<User[]>({
    queryKey: ["/api/admin/managers"],
  });

  const { data: helpRequests, isLoading: isLoadingHelpRequests } = useQuery<HelpRequest[]>({
    queryKey: ["/api/admin/help-requests"],
  });

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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Admin Dashboard</h2>
              <p className="text-neutral-600">Manage managers and system users</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Managers"
                value={managers?.length.toString() || "0"}
                icon={<UsersRound className="h-6 w-6" />}
                color="primary"
                isLoading={isLoadingManagers}
              />
              <StatsCard
                title="Sales Staff"
                value="0" // This would be dynamic in a real app
                icon={<UsersRound className="h-6 w-6" />}
                color="secondary"
                isLoading={false}
              />
              <StatsCard
                title="Agents"
                value="0" // This would be dynamic in a real app
                icon={<UsersRound className="h-6 w-6" />}
                color="accent"
                isLoading={false}
              />
              <StatsCard
                title="Help Requests"
                value={helpRequests?.length.toString() || "0"}
                icon={<Bell className="h-6 w-6" />}
                color="destructive"
                isLoading={isLoadingHelpRequests}
              />
            </div>
            
            {/* Manager Management Section */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-neutral-800">Managers</h3>
                <Button onClick={() => setLocation("/admin/managers")}>
                  <UsersRound className="mr-2 h-4 w-4" /> View All Managers
                </Button>
              </div>
              
              {isLoadingManagers ? (
                <TableSkeleton columns={6} rows={3} />
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
                        managers.slice(0, 3).map((manager) => (
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
                              <button className="text-primary hover:text-primary-dark mr-3">
                                <PenSquare className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-700">
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
              
              <div className="p-4 border-t border-neutral-200">
                <Button variant="outline" size="sm" onClick={() => setLocation("/admin/managers")}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Help Requests Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-800">Recent Help Requests</h3>
              </div>
              
              {isLoadingHelpRequests ? (
                <TableSkeleton columns={6} rows={3} />
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
                        helpRequests.slice(0, 3).map((request) => (
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
                              <div className="text-sm text-neutral-900">{request.issue}</div>
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
                              <Button size="sm" variant="primary">
                                <Eye className="h-4 w-4 mr-1" /> View
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
              
              <div className="p-4 border-t border-neutral-200">
                <Button variant="outline" size="sm" onClick={() => setLocation("/admin/help-requests")}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
