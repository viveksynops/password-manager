import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        <FileQuestion className="size-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
