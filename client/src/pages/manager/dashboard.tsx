import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { 
  UsersRound, CalendarCheck, FileChartColumn, ArrowRight, Eye, Download
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role !== "Manager") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const { data: salesStaff, isLoading: isLoadingSalesStaff } = useQuery<User[]>({
    queryKey: ["/api/manager/sales-staff"],
  });

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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Manager Dashboard</h2>
              <p className="text-neutral-600">Manage sales staff and monitor agent performance</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Sales Staff"
                value={salesStaff?.length.toString() || "0"}
                icon={<UsersRound className="h-6 w-6" />}
                color="primary"
                isLoading={isLoadingSalesStaff}
              />
              <StatsCard
                title="Total Agents"
                value="74"
                icon={<UsersRound className="h-6 w-6" />}
                color="secondary"
                isLoading={false}
              />
              <StatsCard
                title="Attendance Rate"
                value="92%"
                icon={<CalendarCheck className="h-6 w-6" />}
                color="success"
                isLoading={false}
              />
              <StatsCard
                title="Clients Added"
                value="138"
                icon={<FileChartColumn className="h-6 w-6" />}
                color="accent"
                subtitle="This month"
                isLoading={false}
              />
            </div>
            
            {/* Performance Overview */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-neutral-200">
                <h3 className="text-lg font-medium text-neutral-800">Sales Staff Performance</h3>
              </div>
              
              {isLoadingSalesStaff ? (
                <TableSkeleton columns={7} rows={3} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Staff
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Work ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Team Size
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Attendance Rate
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
                      {salesStaff && salesStaff.length > 0 ? (
                        salesStaff.map((staff) => (
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
                              <div className="text-sm text-neutral-900">12 agents</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">95%</div>
                              <Progress value={95} className="h-2 mt-1" />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">32 clients</div>
                              <div className="text-xs text-green-600">+14% from last month</div>
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
                              <Button size="sm" variant="ghost" className="text-primary hover:text-primary-dark">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 text-center text-sm text-neutral-500">
                            No sales staff found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="p-4 border-t border-neutral-200">
                <Button variant="outline" size="sm" onClick={() => setLocation("/manager/sales-staff")}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Attendance and Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Attendance Snapshot */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-neutral-800">Today's Attendance</h3>
                  <div className="text-sm text-neutral-600">
                    <span className="font-medium">68</span> / 74 agents checked in
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <Progress value={92} className="flex-1 h-4" />
                    <span className="ml-4 font-medium text-neutral-800">92%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-md border border-green-100">
                      <div className="text-green-600 text-sm font-medium">On Time</div>
                      <div className="text-2xl font-bold text-neutral-800">63</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                      <div className="text-yellow-600 text-sm font-medium">Late</div>
                      <div className="text-2xl font-bold text-neutral-800">5</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-md border border-red-100">
                      <div className="text-red-600 text-sm font-medium">Absent</div>
                      <div className="text-2xl font-bold text-neutral-800">6</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                      <div className="text-blue-600 text-sm font-medium">Excused</div>
                      <div className="text-2xl font-bold text-neutral-800">3</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View detailed attendance</Button>
                </div>
              </div>
              
              {/* Recent Reports */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-800">Recent Reports</h3>
                </div>
                <div className="p-4">
                  <ul className="divide-y divide-neutral-200">
                    <li className="py-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-800">North Region Monthly Performance</h4>
                        <p className="text-xs text-neutral-500">Submitted by Jennifer Adams</p>
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="text-xs text-neutral-500">Yesterday</span>
                        <Button size="sm" variant="ghost" className="p-1">
                          <Download className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </li>
                    <li className="py-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-800">East Region Weekly Summary</h4>
                        <p className="text-xs text-neutral-500">Submitted by Alex Rodriguez</p>
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="text-xs text-neutral-500">2 days ago</span>
                        <Button size="sm" variant="ghost" className="p-1">
                          <Download className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </li>
                    <li className="py-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-800">Team Leader Efficiency Analysis</h4>
                        <p className="text-xs text-neutral-500">Submitted by Lisa Kim</p>
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="text-xs text-neutral-500">5 days ago</span>
                        <Button size="sm" variant="ghost" className="p-1">
                          <Download className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </li>
                    <li className="py-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-800">Client Acquisition Metrics</h4>
                        <p className="text-xs text-neutral-500">Generated by System</p>
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="text-xs text-neutral-500">1 week ago</span>
                        <Button size="sm" variant="ghost" className="p-1">
                          <Download className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </li>
                  </ul>
                  <Button variant="outline" size="sm" className="mt-4">View all reports</Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
