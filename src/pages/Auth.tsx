import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/hooks/use-auth";
import { Leaf, ShieldCheck, Sprout, Loader2, ArrowRight } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = (formData.get("email") as string)?.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }
      const signInData = new FormData();
      signInData.set("email", email);
      await signIn("email-otp", signInData);
      setStep({ email });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send the code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect, { replace: true });
    } catch {
      setError("The code is incorrect or has expired. Please try again.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Marketing panel (desktop) */}
      <aside className="agrilink-mesh relative hidden w-[45%] flex-col justify-between p-10 lg:flex">
        <Link to="/" className="relative flex items-center gap-2">
          <img src={logo} alt="" aria-hidden="true" className="size-9 rounded-lg" />
          <span className="font-display text-xl font-bold text-white">
            AgriLink
          </span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Connecting Farmers to Buyers.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            One account. Two ways to trade farm-fresh produce across Nigeria.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Sprout, text: "Farmers list harvests and receive orders" },
              { icon: Leaf, text: "Buyers discover fresh produce near them" },
              { icon: ShieldCheck, text: "Secure sign-in — no password to leak" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-white/90">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} AgriLink
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <img src={logo} alt="AgriLink" className="size-10 rounded-xl" />
            <span className="font-display text-2xl font-bold">
              Agri<span className="text-primary">Link</span>
            </span>
          </Link>

          <Card className="shadow-xl">
            {step === "signIn" ? (
              <>
                <CardHeader className="text-center">
                  <CardTitle className="font-display text-2xl">
                    Welcome to AgriLink
                  </CardTitle>
                  <CardDescription>
                    Enter your email to sign in or create an account — we&apos;ll
                    send you a 6-digit code. No password needed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEmailSubmit} noValidate>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Email address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      disabled={isLoading}
                      required
                      className="h-11"
                    />
                    {error && (
                      <p className="mt-2 text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="mt-4 h-11 w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Sending code…
                        </>
                      ) : (
                        <>
                          Continue with email
                          <ArrowRight className="ml-1 size-4" />
                        </>
                      )}
                    </Button>
                  </form>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    By continuing you agree to AgriLink&apos;s Terms and
                    Privacy Policy. New here? You&apos;ll pick{" "}
                    <span className="font-medium text-foreground">farmer</span>{" "}
                    or{" "}
                    <span className="font-medium text-foreground">buyer</span>{" "}
                    right after this.
                  </p>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="text-center">
                  <CardTitle className="font-display text-2xl">
                    Check your email
                  </CardTitle>
                  <CardDescription>
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-foreground">
                      {step.email}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOtpSubmit}>
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="mt-3 text-center text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="mt-4 h-11 w-full"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Verifying…
                        </>
                      ) : (
                        "Verify code"
                      )}
                    </Button>
                    <div className="mt-3 flex justify-between text-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStep("signIn");
                          setOtp("");
                          setError(null);
                        }}
                        disabled={isLoading}
                      >
                        Use a different email
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setError(null);
                          try {
                            const resendData = new FormData();
                            resendData.set("email", step.email);
                            await signIn("email-otp", resendData);
                          } catch {
                            setError("Could not resend. Please try again.");
                          }
                        }}
                        disabled={isLoading}
                      >
                        Resend code
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            )}
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
