import { Header } from '@/components/landing/Header';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseLearnLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 md:gap-10 lg:gap-12">
          <div className="min-w-0 flex-1 space-y-4 sm:space-y-5 md:space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
          <div className="hidden sm:block">
            <Skeleton className="h-64 w-56 rounded-xl" />
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </main>
    </div>
  );
}
