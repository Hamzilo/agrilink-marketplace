import { FullPageLoader } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

/**
 * Wraps signed-in areas: signed-out users go to /auth, users who never chose
 * a role go to onboarding. Does not enforce a specific role.
 */
export function RequireSignedIn({ children }: { children: ReactNode }) {
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

  return children;
}
