import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireRole } from "@/components/RequireRole";
import { RequireSignedIn } from "@/components/RoleGate";
import { AppHeader, AppFooter } from "@/components/layout/AppHeader";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Marketplace = lazy(() => import("./pages/Marketplace.tsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.tsx"));
const Cart = lazy(() => import("./pages/Cart.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const FarmerDashboard = lazy(() => import("./pages/farmer/FarmerDashboard.tsx"));
const FarmerProducts = lazy(() => import("./pages/farmer/FarmerProducts.tsx"));
const FarmerProductNew = lazy(() => import("./pages/farmer/FarmerProductNew.tsx"));
const FarmerProductEdit = lazy(() => import("./pages/farmer/FarmerProductEdit.tsx"));
const FarmerOrders = lazy(() => import("./pages/farmer/FarmerOrders.tsx"));
const BuyerDashboard = lazy(() => import("./pages/buyer/BuyerDashboard.tsx"));
const BuyerOrders = lazy(() => import("./pages/buyer/BuyerOrders.tsx"));
const BuyerOrderDetail = lazy(() => import("./pages/buyer/BuyerOrderDetail.tsx"));
const Profile = lazy(() => import("./pages/shared/Profile.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading…</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

/** Layout wrapper: public shell with header + footer for shared pages. */
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              {/* Public pages */}
              <Route path="/" element={<Landing />} />
              <Route
                path="/marketplace"
                element={
                  <PublicLayout>
                    <Marketplace />
                  </PublicLayout>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <PublicLayout>
                    <ProductDetail />
                  </PublicLayout>
                }
              />

              {/* Auth + onboarding */}
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/dashboard" />}
              />
              <Route
                path="/onboarding"
                element={
                  <RequireSignedIn>
                    <Onboarding />
                  </RequireSignedIn>
                }
              />

              {/* Cart (buyer only) */}
              <Route
                path="/cart"
                element={
                  <RequireRole role="buyer">
                    <PublicLayout>
                      <Cart />
                    </PublicLayout>
                  </RequireRole>
                }
              />

              {/* Role entry dashboards */}
              <Route
                path="/dashboard"
                element={
                  <RequireSignedIn>
                    <Dashboard />
                  </RequireSignedIn>
                }
              />
              <Route
                path="/farmer"
                element={
                  <RequireRole role="farmer">
                    <AppShell>
                      <FarmerDashboard />
                    </AppShell>
                  </RequireRole>
                }
              />
              <Route
                path="/farmer/products"
                element={
                  <RequireRole role="farmer">
                    <AppShell>
                      <FarmerProducts />
                    </AppShell>
                  </RequireRole>
                }
              />
              <Route
                path="/farmer/products/new"
                element={
                  <RequireRole role="farmer">
                    <AppShell>
                      <FarmerProductNew />
                    </AppShell>
                  </RequireRole>
                }
              />
              <Route
                path="/farmer/products/:id/edit"
                element={
                  <RequireRole role="farmer">
                    <AppShell>
                      <FarmerProductEdit />
                    </AppShell>
                  </RequireRole>
                }
              />
              <Route
                path="/farmer/orders"
                element={
                  <RequireRole role="farmer">
                    <AppShell>
                      <FarmerOrders />
                    </AppShell>
                  </RequireRole>
                }
              />
              <Route
                path="/farmer/profile"
                element={
                  <RequireRole role="farmer">
                    <AppShell>
                      <Profile role="farmer" />
                    </AppShell>
                  </RequireRole>
                }
              />

              {/* Buyer area */}
              <Route
                path="/buyer"
                element={
                  <RequireRole role="buyer">
                    <AppShell>
                      <BuyerDashboard />
                    </AppShell>
                  </RequireRole>
                }
              />
              <Route
                path="/buyer/orders"
                element={
                  <RequireRole role="buyer">
                    <AppShell>
                      <BuyerOrders />
                    </AppShell>
                  </RequireRole>
                }
              />
              <Route
                path="/buyer/orders/:id"
                element={
                  <RequireRole role="buyer">
                    <AppShell>
                      <BuyerOrderDetail />
                    </AppShell>
                  </RequireRole>
                }
              />
              <Route
                path="/buyer/profile"
                element={
                  <RequireRole role="buyer">
                    <AppShell>
                      <Profile role="buyer" />
                    </AppShell>
                  </RequireRole>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);

/** Authenticated shell: app header around protected pages. */
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}
