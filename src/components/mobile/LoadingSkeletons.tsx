import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-[16px] p-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-[16px] p-4 flex-1 min-w-[140px]">
      <div className="space-y-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="bg-card rounded-[12px] p-4">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
    </div>
  );
}

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading…" }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-[3px] border-brand-soft border-t-brand rounded-full animate-spin" />
      <p className="text-[15px] text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
