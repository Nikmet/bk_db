import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResultLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-80 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
