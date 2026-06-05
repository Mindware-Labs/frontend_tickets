import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function DashboardSkeleton() {
    return (
        <div className="space-y-12 pb-10">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-96 rounded-lg" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-48 rounded-2xl" />
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                </div>
            </div>

            {/* Pulse Zone Skeleton */}
            <div className="space-y-4">
                <div className="space-y-1 px-1">
                    <Skeleton className="h-7 w-40 rounded-lg" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-none shadow-md rounded-3xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-4 flex-1">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-10 w-24" />
                                        <Skeleton className="h-5 w-32 rounded-full" />
                                    </div>
                                    <Skeleton className="h-12 w-12 rounded-2xl" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Middle Zone Skeleton */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="space-y-1">
                                <Skeleton className="h-6 w-44 rounded-lg" />
                                <Skeleton className="h-4 w-56 rounded-md" />
                            </div>
                            <Skeleton className="h-8 w-28 rounded-lg" />
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Skeleton className="h-[300px] rounded-3xl" />
                            <Skeleton className="h-[300px] rounded-3xl" />
                            <Skeleton className="h-[350px] md:col-span-2 rounded-3xl" />
                        </div>
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32 px-1" />
                        <Skeleton className="h-[400px] rounded-3xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-32 rounded-3xl" />
                        <Skeleton className="h-32 rounded-3xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}
