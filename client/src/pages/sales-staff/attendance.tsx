import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { AttendanceTimeframe, AttendanceRecord } from "@shared/schema";
import { 
  Clock, Calendar, CheckCircle, AlertCircle, X, Info, Edit, Save, CheckCheck, Users
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function SalesStaffAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditTimeframeDialogOpen, setIsEditTimeframeDialogOpen] = useState(false);
  const [isExcuseDialogOpen, setIsExcuseDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:30");
  const [excuseReason, setExcuseReason] = useState("");
  const [activeTab, setActiveTab] = useState("today");

  const { data: timeframe, isLoading: isLoadingTimeframe } = useQuery<AttendanceTimeframe>({
    queryKey: ["/api/sales-staff/attendance-timeframe"],
  });

  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/sales-staff/attendance"],
  });

  const updateTimeframeMutation = useMutation({
    mutationFn: async (data: { startTime: string; endTime: string }) => {
      const res = await apiRequest("POST", "/api/sales-staff/attendance-timeframe", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-staff/attendance-timeframe'] });
      setIsEditTimeframeDialogOpen(false);
      toast({
        title: "Success",
        description: "Attendance timeframe updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating timeframe",
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
      queryClient.invalidateQueries({ queryKey: ['/api/sales-staff/attendance'] });
      setIsExcuseDialogOpen(false);
      toast({
        title: "Success",
        description: "Attendance record excused successfully",
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

  const handleEditTimeframe = () => {
    if (timeframe) {
      setStartTime(timeframe.startTime);
      setEndTime(timeframe.endTime);
    }
    setIsEditTimeframeDialogOpen(true);
  };

  const handleSaveTimeframe = () => {
    updateTimeframeMutation.mutate({ startTime, endTime });
  };

  const handleExcuseClick = (record: any) => {
    setSelectedRecord(record);
    setExcuseReason("");
    setIsExcuseDialogOpen(true);
  };

  const handleExcuseSubmit = () => {
    if (selectedRecord && excuseReason) {
      excuseAttendanceMutation.mutate({ id: selectedRecord.id, reason: excuseReason });
    }
  };

  const isLoading = isLoadingTimeframe || isLoadingAttendance;

  // Mock data for the view
  const mockAttendance = {
    total: 12,
    present: 10,
    late: 2,
    absent: 2,
    excused: 1
  };

  const attendancePercentage = (mockAttendance.present / mockAttendance.total) * 100;

  const mockRecords = [
    { id: 1, agentId: 1, agentName: "John Davis", workId: "AGT001", checkInTime: "2023-08-11T08:15:00", isLate: false, isExcused: false },
    { id: 2, agentId: 2, agentName: "Maria Garcia", workId: "AGT002", checkInTime: "2023-08-11T08:45:00", isLate: false, isExcused: false },
    { id: 3, agentId: 3, agentName: "Robert Chen", workId: "AGT003", checkInTime: null, isLate: true, isExcused: false },
    { id: 4, agentId: 4, agentName: "Lisa Kim", workId: "AGT004", checkInTime: null, isLate: true, isExcused: true, excuseReason: "Doctor's appointment" },
  ];

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
                <h2 className="text-2xl font-bold text-neutral-800">Attendance Management</h2>
                <p className="text-neutral-600">Configure attendance timeframes and manage agent attendance</p>
              </div>
              <Button onClick={handleEditTimeframe}>
                <Edit className="mr-2 h-4 w-4" /> Edit Time Frame
              </Button>
            </div>
            
            {/* Attendance Time Frame */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Attendance Time Frame</CardTitle>
                <CardDescription>Current check-in window for agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-lg font-medium text-neutral-900">
                  <Clock className="text-secondary mr-2 h-5 w-5" />
                  <span>{timeframe?.startTime || startTime}</span>
                  <span className="mx-2 text-neutral-500">to</span>
                  <Clock className="text-red-500 mr-2 h-5 w-5" />
                  <span>{timeframe?.endTime || endTime}</span>
                </div>
                <p className="text-sm text-neutral-500 mt-2">Agents must check in during this window to add clients. Those who miss the window need an explicit excuse from you.</p>
              </CardContent>
            </Card>
            
            {/* Attendance Overview */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Today's Attendance Overview</CardTitle>
                <CardDescription>Summary of agent attendance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <div className="w-full bg-neutral-200 rounded-full h-4">
                    <div 
                      className="bg-green-500 rounded-full h-4"
                      style={{ width: `${attendancePercentage}%` }}
                    ></div>
                  </div>
                  <span className="ml-4 font-medium text-neutral-800">{attendancePercentage}%</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-3 rounded-md border border-green-100">
                    <div className="text-green-600 text-sm font-medium">On Time</div>
                    <div className="text-2xl font-bold text-neutral-800">{mockAttendance.present - mockAttendance.late}</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                    <div className="text-yellow-600 text-sm font-medium">Late</div>
                    <div className="text-2xl font-bold text-neutral-800">{mockAttendance.late}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-md border border-red-100">
                    <div className="text-red-600 text-sm font-medium">Absent</div>
                    <div className="text-2xl font-bold text-neutral-800">{mockAttendance.absent}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="text-blue-600 text-sm font-medium">Excused</div>
                    <div className="text-2xl font-bold text-neutral-800">{mockAttendance.excused}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Attendance Records */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Attendance Records</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">This Week</TabsTrigger>
                    <TabsTrigger value="month">This Month</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Check-in Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Notes
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {mockRecords.map((record) => (
                          <tr key={record.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-accent text-white rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-neutral-900">{record.agentName}</div>
                                  <div className="text-sm text-neutral-500">{record.workId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {record.checkInTime ? (
                                <div className="text-sm text-neutral-900">
                                  {format(new Date(record.checkInTime), 'h:mm a')}
                                </div>
                              ) : (
                                <div className="text-sm text-red-500">Not checked in</div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {record.isExcused ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Excused
                                </span>
                              ) : record.checkInTime ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Present
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Absent
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-neutral-900">
                                {record.excuseReason || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              {!record.checkInTime && !record.isExcused && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleExcuseClick(record)}
                                >
                                  Excuse
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Timeframe Dialog */}
      <Dialog open={isEditTimeframeDialogOpen} onOpenChange={setIsEditTimeframeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attendance Time Frame</DialogTitle>
            <DialogDescription>
              Set the time window during which agents must check in for attendance.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTimeframeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTimeframe} 
              disabled={updateTimeframeMutation.isPending}
            >
              {updateTimeframeMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excuse Dialog */}
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
                <Label htmlFor="excuse-reason">Reason</Label>
                <textarea
                  id="excuse-reason"
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-24"
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
                  <CheckCheck className="mr-2 h-4 w-4" /> Submit Excuse
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
