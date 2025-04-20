import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart2, Users, Calendar, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PerformanceTable } from "@/components/manager/performance-table";
import { PerformanceMetric } from "@shared/schema";

export default function ManagerPerformance() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  
  const {
    data: performanceMetrics,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<PerformanceMetric[]>({
    queryKey: ["/api/manager/performance-metrics"],
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Performance metrics data has been refreshed.",
    });
  };

  // Filter metrics based on selected period
  const filteredMetrics = performanceMetrics?.filter(
    (metric) => metric.period === selectedPeriod
  ) || [];

  // Calculate aggregate stats
  const totalAgents = filteredMetrics.length;
  const totalClients = filteredMetrics.reduce(
    (sum, metric) => sum + metric.clientsAcquired,
    0
  );
  const avgAttendance = filteredMetrics.length > 0
    ? filteredMetrics.reduce(
        (sum, metric) => sum + metric.attendanceRate,
        0
      ) / filteredMetrics.length
    : 0;
  const avgPerformanceScore = filteredMetrics.length > 0
    ? filteredMetrics.reduce(
        (sum, metric) => sum + metric.performanceScore,
        0
      ) / filteredMetrics.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefetching}
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
        </TabsList>

        {["daily", "weekly", "monthly", "quarterly"].map((period) => (
          <TabsContent key={period} value={period} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Sales Staff"
                value={totalAgents.toString()}
                icon={<Users className="h-5 w-5" />}
                color="primary"
                subtitle="Active staff members"
                isLoading={isRefetching}
              />
              <StatsCard
                title="Total Clients Acquired"
                value={totalClients.toString()}
                icon={<Users className="h-5 w-5" />}
                color="secondary"
                subtitle={`In ${period} period`}
                isLoading={isRefetching}
              />
              <StatsCard
                title="Avg. Attendance Rate"
                value={`${avgAttendance.toFixed(1)}%`}
                icon={<Calendar className="h-5 w-5" />}
                color="accent"
                subtitle="On-time check-ins"
                isLoading={isRefetching}
              />
              <StatsCard
                title="Avg. Performance Score"
                value={avgPerformanceScore.toFixed(1)}
                icon={<BarChart2 className="h-5 w-5" />}
                color="success"
                subtitle="Out of 10"
                isLoading={isRefetching}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Staff Performance</CardTitle>
                <CardDescription>
                  Detailed performance breakdown of all sales staff for the {period} period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceTable
                  metrics={filteredMetrics}
                  isLoading={isRefetching}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredMetrics.length} staff members
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}