import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AuditLogsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-lg border bg-card/60 p-2.5 flex flex-wrap items-center gap-2.5 shadow-xs">
        <Skeleton className="h-9 w-full sm:w-52 rounded-md" />
        <Skeleton className="h-9 w-full sm:w-56 rounded-md" />
        <Skeleton className="h-9 w-full sm:w-48 rounded-md" />
        <Skeleton className="h-9 w-full sm:w-44 rounded-md" />
      </div>

      {/* Audit Logs Table Skeleton */}
      <Card className="border shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/30 grid grid-cols-6 gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
        <CardContent className="p-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border-b last:border-0 grid grid-cols-6 gap-4 items-center">
              <Skeleton className="h-4 w-16" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
              <div className="flex justify-end">
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
