import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, TrendingDown, TrendingUp } from "lucide-react";
import { PerformanceMetric } from "@shared/schema";

interface PerformanceTableProps {
  metrics: PerformanceMetric[];
  isLoading: boolean;
}

export function PerformanceTable({ metrics, isLoading }: PerformanceTableProps) {
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "bg-green-500";
    if (rate >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    return "text-red-500";
  };

  const getPerformanceTrend = (trend: number) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+{trend.toFixed(1)}%</span>
        </div>
      );
    }
    if (trend < 0) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span>{trend.toFixed(1)}%</span>
        </div>
      );
    }
    return <span>0%</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <BarChart2 className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No performance data available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Performance metrics for this period will appear here.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sales Staff</TableHead>
          <TableHead>Clients Acquired</TableHead>
          <TableHead>Attendance Rate</TableHead>
          <TableHead>Performance Score</TableHead>
          <TableHead>Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((metric) => (
          <TableRow key={metric.id}>
            <TableCell className="font-medium">{metric.userName || `Staff ID: ${metric.userId}`}</TableCell>
            <TableCell>{metric.clientsAcquired}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className={`h-2.5 rounded-full ${getAttendanceColor(metric.attendanceRate)}`}
                    style={{ width: `${Math.min(100, metric.attendanceRate)}%` }}
                  ></div>
                </div>
                <span>{metric.attendanceRate.toFixed(1)}%</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={getPerformanceColor(metric.performanceScore)}>
                {metric.performanceScore.toFixed(1)}
              </Badge>
            </TableCell>
            <TableCell>{getPerformanceTrend(metric.trend)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}