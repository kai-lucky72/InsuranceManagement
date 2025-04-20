import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "info" | "destructive";
  subtitle?: string;
  isLoading?: boolean;
}

export function StatsCard({ title, value, icon, color, subtitle, isLoading = false }: StatsCardProps) {
  // Map color to background and text colors
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string, text: string }> = {
      primary: { bg: "bg-primary-light bg-opacity-20 text-primary", text: "text-primary" },
      secondary: { bg: "bg-secondary-light bg-opacity-20 text-secondary", text: "text-secondary" },
      accent: { bg: "bg-accent-light bg-opacity-20 text-accent", text: "text-accent" },
      success: { bg: "bg-success bg-opacity-20 text-success", text: "text-success" },
      warning: { bg: "bg-warning bg-opacity-20 text-warning", text: "text-warning" },
      error: { bg: "bg-error bg-opacity-20 text-error", text: "text-error" },
      info: { bg: "bg-info bg-opacity-20 text-info", text: "text-info" },
      destructive: { bg: "bg-destructive bg-opacity-20 text-destructive", text: "text-destructive" },
    };

    return colorMap[color] || colorMap.primary;
  };

  const { bg, text } = getColorClasses(color);

  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${bg}`}>
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-neutral-800">{title}</h3>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <p className="text-2xl font-bold">{value}</p>
                {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
