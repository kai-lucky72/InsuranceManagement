import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns: number;
  rows: number;
}

export function TableSkeleton({ columns, rows }: TableSkeletonProps) {
  // Create an array of the specified length
  const rowsArray = Array.from({ length: rows }, (_, i) => i);
  const columnsArray = Array.from({ length: columns }, (_, i) => i);

  return (
    <div className="animate-pulse">
      <div className="bg-neutral-50 py-3 px-4 flex">
        {columnsArray.map((col) => (
          <div key={`header-${col}`} className="flex-1 mr-4">
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      
      {rowsArray.map((row) => (
        <div 
          key={`row-${row}`} 
          className="flex px-4 py-4 border-b border-neutral-200"
        >
          {columnsArray.map((col) => (
            <div key={`cell-${row}-${col}`} className="flex-1 mr-4">
              <Skeleton className="h-5 w-full" />
              {col === 0 && <Skeleton className="h-3 w-1/2 mt-2" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
