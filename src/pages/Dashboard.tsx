import { FullPageLoader } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";

/**
 * Legacy /dashboard entry point: routes each role to its proper dashboard.
 */
export default function Dashboard() {
  const { isLoading, user } = useAuth();

  if (isLoading) return <FullPageLoader />;

  if (!user?.role) {
    return <Navigate to="/onboarding" replace />;
  }
  if (user.role === "farmer") {
    return <Navigate to="/farmer" replace />;
  }
  if (user.role === "buyer") {
    return <Navigate to="/buyer" replace />;
  }
  return <Navigate to="/marketplace" replace />;
}
