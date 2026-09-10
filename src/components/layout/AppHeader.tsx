import logo from "@/assets/logo.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ShoppingCart,
  Sprout,
  Store,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { formatDateTime } from "@/lib/format";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="size-8 rounded-lg"
      />
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        Agri<span className="text-primary">Link</span>
      </span>
    </span>
  );
}

function NotificationsBell() {
  const notifications = useQuery(api.notifications.listMyNotifications, {});
  const [open, setOpen] = useState(false);
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-harvest text-[10px] font-bold text-harvest-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <span className="text-xs text-muted-foreground">
              {unread} new
            </span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!notifications ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <MessageSquare className="mx-auto size-6 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n._id}
                to={n.link ?? "#"}
                onClick={() => setOpen(false)}
                className={cn(
                  "block border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/50",
                  !n.read && "bg-secondary/60",
                )}
              >
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {n.body}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  {formatDateTime(n._creationTime)}
                </p>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppHeader() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const { totals } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [mobileOpen]);

  const role = user?.role ?? null;
  const dashboardPath =
    role === "farmer" ? "/farmer" : role === "buyer" ? "/buyer" : "/";

  const navLinks = [
    { to: "/marketplace", label: "Marketplace" },
    ...(isAuthenticated && role === "farmer"
      ? [
          { to: "/farmer", label: "Dashboard" },
          { to: "/farmer/products", label: "My Products" },
          { to: "/farmer/orders", label: "Orders" },
        ]
      : []),
    ...(isAuthenticated && role === "buyer"
      ? [
          { to: "/buyer", label: "Dashboard" },
          { to: "/buyer/orders", label: "My Orders" },
        ]
      : []),
  ];

  const handleSignOut = async () => {
    setMobileOpen(false);
    try {
      await signOut();
    } finally {
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" aria-label="AgriLink home">
            <Wordmark />
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  isActive && "bg-secondary text-secondary-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {isAuthenticated && role === "buyer" && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Cart, ${totals.count} items`}
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="size-5" />
              {totals.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totals.count > 9 ? "9+" : totals.count}
                </span>
              )}
            </Button>
          )}

          {isAuthenticated && <NotificationsBell />}

          {!isLoading && isAuthenticated ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 pl-1.5"
                    aria-label="Account menu"
                  >
                    <Avatar className="size-7">
                      {user?.image ? (
                        <AvatarImage src={user.image} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {(user?.name ?? "U")
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-28 truncate text-sm font-medium">
                      {user?.name ?? "Account"}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs">
                    {role === "farmer"
                      ? "Farmer account"
                      : role === "buyer"
                        ? "Buyer account"
                        : "Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                    <LayoutDashboard className="mr-2 size-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        role === "farmer" ? "/farmer/profile" : "/buyer/profile",
                      )
                    }
                  >
                    <User className="mr-2 size-4" /> Profile
                  </DropdownMenuItem>
                  {role === "farmer" && (
                    <DropdownMenuItem onClick={() => navigate("/farmer/products")}>
                      <Package className="mr-2 size-4" /> My Products
                    </DropdownMenuItem>
                  )}
                  {role === "buyer" && (
                    <DropdownMenuItem onClick={() => navigate("/cart")}>
                      <ShoppingCart className="mr-2 size-4" /> Cart
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 size-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            !isLoading && (
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth?mode=login")}
                >
                  Log in
                </Button>
                <Button onClick={() => navigate("/auth?mode=signup")}>
                  Get Started
                </Button>
              </div>
            )
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          ref={menuRef}
          className="border-t bg-background md:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent",
                    isActive && "bg-secondary text-secondary-foreground",
                  )
                }
              >
                <Store className="size-4 text-muted-foreground" aria-hidden="true" />
                {link.label}
              </NavLink>
            ))}
            <Separator className="my-2" />
            {!isLoading && isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  <LayoutDashboard className="size-4 text-muted-foreground" />
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate(
                      role === "farmer" ? "/farmer/profile" : "/buyer/profile",
                    );
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  <User className="size-4 text-muted-foreground" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3 py-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/auth?mode=login");
                  }}
                >
                  Log in
                </Button>
                <Button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/auth?mode=signup");
                  }}
                >
                  Get Started
                </Button>
              </div>
            )}
            {isAuthenticated && role === "farmer" && (
              <p className="px-3 pb-2 pt-1 text-xs text-muted-foreground">
                <Sprout className="mr-1 inline size-3.5" />
                Farmer workspace
              </p>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Wordmark />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Nigeria&apos;s marketplace for farm-fresh produce. We connect
            farmers directly with buyers — fairer prices, fresher food, zero
            middlemen.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-semibold">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/marketplace" className="hover:text-foreground">
                Marketplace
              </Link>
            </li>
            <li>
              <Link to="/auth?mode=signup" className="hover:text-foreground">
                Become a seller
              </Link>
            </li>
            <li>
              <Link to="/auth?mode=signup" className="hover:text-foreground">
                Start buying
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>About</li>
            <li>
              <a href="mailto:support@agrilink.ng" className="hover:text-foreground">
                Contact
              </a>
            </li>
            <li>Terms</li>
            <li>Privacy</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} AgriLink. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
