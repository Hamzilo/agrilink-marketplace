import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/AppHeader";
import { Sprout } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Link to="/" aria-label="AgriLink home">
            <Wordmark />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="text-center">
          <div className="agrilink-hero mx-auto flex size-24 items-center justify-center rounded-3xl border bg-card">
            <Sprout className="size-12 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-6 font-display text-7xl font-extrabold tracking-tight text-primary">
            404
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold">
            This page didn&apos;t sprout
          </h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have
            been moved. Let&apos;s get you back to fresh produce.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/marketplace">Browse marketplace</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
