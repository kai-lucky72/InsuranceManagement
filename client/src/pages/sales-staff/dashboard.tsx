import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User, AttendanceTimeframe } from "@shared/schema";
import { 
  UsersRound, CalendarCheck, FileChartColumn, ArrowRight, Eye, Clock, Edit, Download, PenSquare
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SalesStaffDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role !== "SalesStaff") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const { data: agents, isLoading: isLoadingAgents } = useQuery<User[]>({
    queryKey: ["/api/sales-staff/agents"],
  });

  const { data: timeframe, isLoading: isLoadingTimeframe } = useQuery<AttendanceTimeframe>({
    queryKey: ["/api/sales-staff/attendance-timeframe"],
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

  // Mock data for the view
  const mockAgents = [
    { id: 1, fullName: "John Davis", workId: "AGT001", email: "john.davis@example.com", type: "TeamLeader", attendance: "Present", clientsAdded: 7, isActive: true },
    { id: 2, fullName: "Maria Garcia", workId: "AGT002", email: "maria.g@example.com", type: "Individual", attendance: "Present", clientsAdded: 5, isActive: true },
    { id: 3, fullName: "Robert Chen", workId: "AGT003", email: "robert.c@example.com", type: "Individual", attendance: "Absent", clientsAdded: 3, isActive: true },
  ];

  const isLoading = isLoadingAgents || isLoadingTimeframe;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header title="Sales Staff Portal" backgroundColor="bg-secondary" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} role="SalesStaff" workId={user?.workId} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Sales Staff Dashboard</h2>
              <p className="text-neutral-600">Manage agents and monitor performance</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Total Agents"
                value={(agents?.length || 0).toString()}
                icon={<UsersRound className="h-6 w-6" />}
                color="secondary"
                isLoading={isLoadingAgents}
              />
              <StatsCard
                title="Today's Attendance"
                value="83%"
                icon={<CalendarCheck className="h-6 w-6" />}
                color="success"
                isLoading={false}
              />
              <StatsCard
                title="Clients Added"
                value="32"
                icon={<FileChartColumn className="h-6 w-6" />}
                color="accent"
                subtitle="This week"
                isLoading={false}
              />
              <StatsCard
                title="Reports"
                value="3"
                icon={<FileChartColumn className="h-6 w-6" />}
                color="primary"
                subtitle="Pending review"
                isLoading={false}
              />
            </div>
            
            {/* Attendance timeframe config */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-neutral-800">Attendance Time Frame</h3>
                <Button onClick={() => setLocation("/sales-staff/attendance")}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Time Frame
                </Button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                    <h4 className="text-sm font-medium text-neutral-800 mb-2">Current Check-in Window</h4>
                    <div className="flex items-center text-lg font-medium text-neutral-900">
                      <Clock className="text-secondary mr-2 h-5 w-5" />
                      <span>{timeframe?.startTime || '8:00 AM'}</span>
                      <ArrowRight className="text-neutral-500 mx-2 h-4 w-4" />
                      <Clock className="text-red-500 mr-2 h-5 w-5" />
                      <span>{timeframe?.endTime || '9:30 AM'}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Agents must check in during this window to add clients</p>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                    <h4 className="text-sm font-medium text-neutral-800 mb-2">Today's Status</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-medium text-neutral-900">10 / 12</div>
                        <div className="text-xs text-neutral-500">Agents checked in</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium text-red-600">2</div>
                        <div className="text-xs text-neutral-500">Need excuse</div>
                      </div>
                      <div>
                        <Button size="sm" variant="secondary" onClick={() => setLocation("/sales-staff/attendance")}>
                          Manage Attendance
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Agent Management Section */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-neutral-800">Recent Agent Activity</h3>
                <Button onClick={() => setLocation("/sales-staff/agents")}>
                  <UsersRound className="mr-2 h-4 w-4" /> Manage Agents
                </Button>
              </div>
              
              {isLoadingAgents ? (
                <TableSkeleton columns={7} rows={3} />
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
                      {mockAgents.map((agent) => (
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
                                <Button size="sm" variant="link" className="text-xs text-primary ml-2">
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
                            <Button size="sm" variant="ghost" className="text-primary hover:text-primary-dark mr-2">
                              <PenSquare className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="p-4 border-t border-neutral-200">
                <Button variant="outline" size="sm" onClick={() => setLocation("/sales-staff/agents")}>
                  View All Agents <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Recent Reports */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-neutral-800">Recent Reports</h3>
                <Button>
                  <Download className="mr-2 h-4 w-4" /> Download Reports
                </Button>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-neutral-200">
                  <li className="py-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-800">Team Leader Weekly Report</h4>
                      <p className="text-xs text-neutral-500">Submitted by John Davis (AGT001)</p>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Reviewed</span>
                      <span className="text-xs text-neutral-500">Today, 2:45 PM</span>
                      <Button size="sm" variant="ghost" className="p-1">
                        <Download className="h-4 w-4 text-secondary" />
                      </Button>
                    </div>
                  </li>
                  <li className="py-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-800">Individual Agent Performance</h4>
                      <p className="text-xs text-neutral-500">Submitted by Maria Garcia (AGT002)</p>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>
                      <span className="text-xs text-neutral-500">Today, 11:30 AM</span>
                      <Button size="sm" variant="ghost" className="p-1">
                        <Download className="h-4 w-4 text-secondary" />
                      </Button>
                    </div>
                  </li>
                  <li className="py-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-800">Monthly Client Acquisition Summary</h4>
                      <p className="text-xs text-neutral-500">Generated by System</p>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Auto-generated</span>
                      <span className="text-xs text-neutral-500">Yesterday</span>
                      <Button size="sm" variant="ghost" className="p-1">
                        <Download className="h-4 w-4 text-secondary" />
                      </Button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
