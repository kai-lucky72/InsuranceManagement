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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  Search, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  XSquare, 
  Clock, 
  Info, 
  Users, 
  FileText,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ManagerAttendance() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSalesStaff, setSelectedSalesStaff] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== "Manager") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Fetch sales staff data
  const { data: salesStaff, isLoading: isLoadingSalesStaff } = useQuery<any[]>({
    queryKey: ["/api/manager/sales-staff"],
    enabled: !!user
  });

  // Fetch attendance records
  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery<any[]>({
    queryKey: ["/api/manager/attendance", selectedSalesStaff, format(date, 'yyyy-MM-dd')],
    enabled: !!user
  });

  // Fetch agents for the selected sales staff
  const { data: agents, isLoading: isLoadingAgents } = useQuery<any[]>({
    queryKey: ["/api/manager/sales-staff", selectedSalesStaff, "agents"],
    enabled: !!user && selectedSalesStaff !== "all"
  });

  // Filtered attendance records
  const filteredRecords = attendanceRecords?.filter(record => {
    const agentName = record.agentName?.toLowerCase() || "";
    return agentName.includes(searchQuery.toLowerCase());
  });

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  // Calculate attendance statistics
  const attendanceStats = (() => {
    if (!attendanceRecords) return { total: 0, onTime: 0, late: 0, excused: 0 };
    
    const total = attendanceRecords.length;
    const onTime = attendanceRecords.filter(r => !r.isLate).length;
    const late = attendanceRecords.filter(r => r.isLate && !r.isExcused).length;
    const excused = attendanceRecords.filter(r => r.isExcused).length;
    
    return { total, onTime, late, excused };
  })();

  // Get attendance rate
  const getAttendanceRate = () => {
    if (!agents || !attendanceRecords) return 0;
    const totalAgents = agents.length;
    if (totalAgents === 0) return 0;
    
    return (attendanceRecords.length / totalAgents) * 100;
  };

  const navItems = [
    { href: "/manager/dashboard", label: "Dashboard", icon: "view-dashboard" },
    { href: "/manager/sales-staff", label: "Sales Staff", icon: "account-tie" },
    { href: "/manager/agents", label: "Agents", icon: "account-group" },
    { href: "/manager/attendance", label: "Attendance", icon: "calendar-clock" },
    { href: "/manager/reports", label: "Reports", icon: "file-chart" },
    { href: "/manager/messages", label: "Messages", icon: "message-text" },
  ];

  const isLoading = isLoadingSalesStaff || isLoadingAttendance || isLoadingAgents;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header title="Manager Portal" backgroundColor="bg-indigo-600" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} role="Manager" workId={user?.workId} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Attendance Management</h2>
              <p className="text-neutral-600">Monitor attendance across sales territories</p>
            </div>
            
            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Select value={selectedSalesStaff} onValueChange={setSelectedSalesStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sales Staff</SelectItem>
                  {salesStaff?.map(staff => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              </div>
              
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => {
                      if (date) {
                        setDate(date);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-neutral-500 text-sm">Total Check-ins</p>
                      <h3 className="text-2xl font-bold text-neutral-900">{attendanceStats.total}</h3>
                    </div>
                    <Users className="h-10 w-10 text-indigo-600 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-neutral-500 text-sm">On Time</p>
                      <h3 className="text-2xl font-bold text-green-600">{attendanceStats.onTime}</h3>
                    </div>
                    <CheckSquare className="h-10 w-10 text-green-600 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-neutral-500 text-sm">Late Check-ins</p>
                      <h3 className="text-2xl font-bold text-amber-600">{attendanceStats.late}</h3>
                    </div>
                    <Clock className="h-10 w-10 text-amber-600 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-neutral-500 text-sm">Excused</p>
                      <h3 className="text-2xl font-bold text-indigo-600">{attendanceStats.excused}</h3>
                    </div>
                    <FileText className="h-10 w-10 text-indigo-600 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Attendance Rate Card */}
            {selectedSalesStaff !== "all" && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">Attendance Rate</h3>
                      <p className="text-neutral-500 text-sm">
                        For {salesStaff?.find(s => s.id.toString() === selectedSalesStaff)?.fullName || "selected territory"}
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-indigo-600">
                      {getAttendanceRate().toFixed(1)}%
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ width: `${getAttendanceRate()}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-neutral-500">
                      <span>0 Agents</span>
                      <span>{agents?.length || 0} Agents</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Attendance Records Table */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>
                  {format(date, "PPPP")}
                </CardDescription>
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
                            Agent
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Sales Staff
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Check-in Time
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
                        {filteredRecords && filteredRecords.length > 0 ? (
                          filteredRecords.map((record) => (
                            <tr key={record.id}>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-neutral-900">{record.agentName}</div>
                                    <div className="text-sm text-neutral-500">{record.workId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900">{record.salesStaffName}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-neutral-900">
                                  {format(new Date(record.checkInTime), 'p')}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {record.isLate ? (
                                  record.isExcused ? (
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                      Excused
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                      Late
                                    </span>
                                  )
                                ) : (
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    On Time
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleViewRecord(record)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                              {searchQuery 
                                ? "No records match your search criteria" 
                                : "No attendance records found for this date"}
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
      
      {/* Attendance Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance Record Details</DialogTitle>
            <DialogDescription>
              Detailed information about this attendance record
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Agent:</div>
                <div className="font-semibold">{selectedRecord.agentName}</div>
              </div>
              
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Work ID:</div>
                <div>{selectedRecord.workId}</div>
              </div>
              
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Sales Staff:</div>
                <div>{selectedRecord.salesStaffName}</div>
              </div>
              
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Date:</div>
                <div>{format(new Date(selectedRecord.checkInTime), 'PP')}</div>
              </div>
              
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Time:</div>
                <div>{format(new Date(selectedRecord.checkInTime), 'p')}</div>
              </div>
              
              <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                <div className="text-neutral-500 font-medium">Status:</div>
                <div>
                  {selectedRecord.isLate ? (
                    selectedRecord.isExcused ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        Excused Late Check-in
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                        Late Check-in
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      On Time
                    </span>
                  )}
                </div>
              </div>
              
              {selectedRecord.isExcused && (
                <>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <div className="text-neutral-500 font-medium">Excused By:</div>
                    <div>{selectedRecord.excusedByName}</div>
                  </div>
                  
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                    <div className="text-neutral-500 font-medium">Reason:</div>
                    <div>{selectedRecord.excuseReason}</div>
                  </div>
                </>
              )}
              
              <div className="pt-4">
                <Button className="w-full" onClick={() => setIsDetailsOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}