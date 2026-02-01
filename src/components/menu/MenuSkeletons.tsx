import { Skeleton } from '@/components/ui/skeleton';

export function VendorCardSkeleton() {
  return (
    <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-card border-2 border-border/50">
      <div className="flex items-start gap-4 md:block">
        <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl md:mb-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 md:h-6 w-32 mb-2 md:mb-3" />
          <Skeleton className="h-4 w-48 mb-3 md:mb-4" />
          <div className="flex items-center gap-3 md:gap-4">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex gap-3 md:gap-5 p-3 md:p-5 rounded-xl md:rounded-2xl bg-card border-2 border-border/50">
      <Skeleton className="w-20 h-20 md:w-28 md:h-28 rounded-lg md:rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col">
        <Skeleton className="h-5 md:h-6 w-32 mb-1 md:mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-3 md:mb-4" />
        <div className="flex items-center justify-between gap-2 mt-auto">
          <Skeleton className="h-6 md:h-7 w-16" />
          <Skeleton className="h-8 md:h-10 w-20 rounded-lg md:rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-9 md:h-10 w-20 md:w-24 rounded-full flex-shrink-0" />
      ))}
    </div>
  );
}

export function VendorListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <VendorCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MenuItemListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
      {[1, 2, 3, 4].map((i) => (
        <MenuItemSkeleton key={i} />
      ))}
    </div>
  );
}
