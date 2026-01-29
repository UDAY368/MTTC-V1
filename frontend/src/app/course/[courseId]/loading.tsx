import { Header } from '@/components/landing/Header';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseAboutLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-3/4 max-w-md" />
            <Skeleton className="h-5 w-full max-w-2xl" />
            <Skeleton className="h-5 w-5/6 max-w-xl" />
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/40 px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="mt-8 space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
