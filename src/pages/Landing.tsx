import { AppFooter } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Handshake,
  Leaf,
  PackageSearch,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Truck,
  Tractor,
  ClipboardList,
  BadgeCheck,
  ArrowRight,
  Search,
  LineChart,
  Wallet,
} from "lucide-react";
import { Link } from "react-router";

const features = [
  {
    icon: Handshake,
    title: "Direct farmer-to-buyer trade",
    description:
      "No middlemen. Farmers keep more of every naira and buyers pay fresher prices.",
  },
  {
    icon: PackageSearch,
    title: "Easy product discovery",
    description:
      "Search by name, filter by category, and find exactly what your kitchen or business needs.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent product info",
    description:
      "Real photos, clear prices per unit, stock levels and farm locations upfront.",
  },
  {
    icon: ShoppingBasket,
    title: "Simple ordering",
    description:
      "Add to cart, review once, and place your order in seconds — across multiple farms.",
  },
  {
    icon: Truck,
    title: "Order tracking",
    description:
      "Follow every order from pending to delivered with live status updates.",
  },
  {
    icon: LineChart,
    title: "Farmer sales tools",
    description:
      "List products, manage stock, receive orders and track revenue from one dashboard.",
  },
];

const buyerSteps = [
  {
    icon: ClipboardList,
    title: "Create a free account",
    description: "Sign up as a buyer in under a minute.",
  },
  {
    icon: Search,
    title: "Discover products",
    description: "Browse fresh produce from verified Nigerian farms.",
  },
  {
    icon: ShoppingBasket,
    title: "Place your order",
    description: "Pick quantities and check out with transparent pricing.",
  },
  {
    icon: Truck,
    title: "Track to delivery",
    description: "Watch your order move from confirmed to completed.",
  },
];

const farmerSteps = [
  {
    icon: ClipboardList,
    title: "Create a free account",
    description: "Sign up as a farmer and set up your farm profile.",
  },
  {
    icon: Sprout,
    title: "List your products",
    description: "Add photos, prices, stock and pickup locations.",
  },
  {
    icon: BadgeCheck,
    title: "Receive orders",
    description: "Get notified the moment a buyer places an order.",
  },
  {
    icon: Wallet,
    title: "Grow your sales",
    description: "Confirm, process and complete orders from your dashboard.",
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="agrilink-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge
              variant="secondary"
              className="mb-5 gap-1.5 border border-primary/20 px-3 py-1 text-xs font-medium"
            >
              <Leaf className="size-3.5 text-primary" aria-hidden="true" />
              Nigeria&apos;s farm-fresh marketplace
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Connecting <span className="text-primary">Farmers</span> to{" "}
              <span className="text-primary">Buyers</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              AgriLink makes it easy for farmers to reach buyers directly — and
              for buyers to discover fresh agricultural produce from farms
              across Nigeria. Fair prices. Fresh harvests. Zero middlemen.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-7 text-base" asChild>
                <Link to="/auth?mode=signup">
                  Get Started
                  <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-primary/30 px-7 text-base hover:bg-secondary"
                asChild
              >
                <Link to="/marketplace">Browse Products</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Sprout className="size-4 text-primary" aria-hidden="true" />
                Farmers list real harvests
              </span>
              <span className="flex items-center gap-1.5">
                <ShoppingBasket
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                Buyers order in minutes
              </span>
            </div>
          </div>

          {/* Hero panel */}
          <div className="relative hidden lg:block">
            <div className="agrilink-mesh absolute -inset-6 rounded-3xl opacity-95" aria-hidden="true" />
            <Card className="relative border-none shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-semibold text-muted-foreground">
                    Today at the marketplace
                  </p>
                  <Badge className="gap-1 bg-emerald-100 text-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Live
                  </Badge>
                </div>
                <ul className="mt-4 space-y-3">
                  {[
                    { name: "Fresh Tomatoes", place: "Jos, Plateau", icon: "🍅" },
                    { name: "Ofada Rice", place: "Ibadan, Oyo", icon: "🌾" },
                    { name: "Live Broilers", place: "Ibadan, Oyo", icon: "🐔" },
                    { name: "Yellow Garri", place: "Asaba, Delta", icon: "🥣" },
                  ].map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center gap-3 rounded-xl border bg-background/60 p-3"
                    >
                      <span
                        className="flex size-10 items-center justify-center rounded-lg bg-secondary text-lg"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.name}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Tractor className="size-3" aria-hidden="true" />
                          {item.place}
                        </p>
                      </div>
                      <span className="ml-auto text-xs font-medium text-primary">
                        In season
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Real listings from real farmers — browse the live marketplace
                  to see today&apos;s stock.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20" aria-labelledby="features-heading">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="features-heading"
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Everything agricultural trade needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            From the farm gate to the market stall, AgriLink gives both sides
            of the trade the tools to transact with confidence.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-secondary/40 py-16 lg:py-20" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="how-heading"
              className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              How AgriLink works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Four simple steps — whether you sell the harvest or buy it.
            </p>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sprout className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-xl font-bold">For Farmers</h3>
              </div>
              <ol className="mt-6 space-y-5">
                {farmerSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      {index < farmerSteps.length - 1 && (
                        <span
                          className="mt-1 w-px flex-1 bg-border"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <Button variant="outline" className="mt-6" asChild>
                <Link to="/auth?mode=signup">
                  Start selling
                  <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-harvest text-harvest-foreground">
                  <ShoppingBasket className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-xl font-bold">For Buyers</h3>
              </div>
              <ol className="mt-6 space-y-5">
                {buyerSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-harvest/20 font-display text-sm font-bold text-harvest-foreground">
                        {index + 1}
                      </span>
                      {index < buyerSteps.length - 1 && (
                        <span
                          className="mt-1 w-px flex-1 bg-border"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <Button variant="outline" className="mt-6" asChild>
                <Link to="/auth?mode=signup">
                  Start buying
                  <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / value */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20" aria-labelledby="trust-heading">
        <div className="grid gap-10 lg:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "Better margins for farmers",
              body: "When farmers sell directly, transport and middleman costs disappear from the chain — and fair value returns to the farm.",
            },
            {
              icon: Leaf,
              title: "Fresher food for buyers",
              body: "Produce moves from harvest to order without sitting in transit warehouses, so buyers receive fresher goods every time.",
            },
            {
              icon: ShieldCheck,
              title: "Trade with confidence",
              body: "Every listing shows the real farm behind it, with clear stock, pricing and order tracking on both sides of the deal.",
            },
          ].map((item) => (
            <div key={item.title} className="text-center lg:text-left">
              <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-secondary text-primary lg:mx-0">
                <item.icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="agrilink-mesh mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to trade farm-fresh?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Join AgriLink today. Farmers start listing in minutes, buyers start
            ordering right away — and every naira stays in the agricultural
            economy.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
              <Link to="/auth?mode=signup">Create your free account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link to="/marketplace">Browse the marketplace</Link>
            </Button>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
