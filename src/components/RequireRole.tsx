import { EmptyState, FullPageLoader } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader label="Checking your session…" />;

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
}

/**
 * Guards a route for one role only. Signed-out users are sent to auth; users
 * signed in with the wrong role see a friendly explanation instead of the
 * page. The underlying data queries enforce the same rules server-side.
 */
export function RequireRole({
  role,
  children,
}: {
  role: "farmer" | "buyer";
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader label="Checking your session…" />;

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  if (!user?.role) {
    return (
      <Navigate
        to={`/onboarding?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (user.role !== role) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <EmptyState
          icon={ShieldAlert}
          title={
            role === "farmer"
              ? "This area is for farmers only"
              : "This area is for buyers only"
          }
          description={
            user?.role === "farmer"
              ? "You are signed in as a farmer. Buyer pages are not available to farmer accounts."
              : user?.role === "buyer"
                ? "You are signed in as a buyer. Farmer pages are not available to buyer accounts."
                : "Finish setting up your account to continue."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to={user?.role === "farmer" ? "/farmer" : "/buyer"}>
                  Go to your dashboard
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/marketplace">Browse marketplace</Link>
              </Button>
            </div>
          }
        />
      </main>
    );
  }

  return children;
}
