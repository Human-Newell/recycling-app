import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { CardSkeleton, StatCardSkeleton } from "@/components/mobile/LoadingSkeletons";
import { Button } from "@/components/ui/button";
import { Leaf, LogIn, Recycle, Award, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import HomeDashboard from "@/components/home/HomeDashboard";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function HomePage() {
  const { user, loading, login, register, loginWithProvider, refreshUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const signUpForm = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) });

  const handleRefresh = async () => {
    if (user) {
      await refreshUser();
      toast.success("Up to date");
    }
  };

  const handleProviderLogin = async (provider: "google" | "twitter" | "facebook") => {
    const result = await loginWithProvider(provider);
    if (!result.success && result.error) {
      toast.error(result.error);
    }
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success("Welcome back!");
      setShowAuthModal(false);
      loginForm.reset();
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const handleSignUpSubmit = async (data: SignUpFormData) => {
    const result = await register(data.email, data.password, data.name);
    if (result.success) {
      toast.success("Account created!");
      setShowAuthModal(false);
      signUpForm.reset();
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+60px)] space-y-6">
        <div className="h-8 w-40 rounded-lg bg-muted/20 animate-pulse" />
        <StatCardSkeleton />
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="text-center space-y-6 max-w-md w-full py-6"
        >
          {/* App icon, exactly like an iOS home screen tile */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
            className="w-[96px] h-[96px] rounded-[24px] bg-brand flex items-center justify-center mx-auto shadow-float"
          >
            <Recycle className="w-[52px] h-[52px] text-white" strokeWidth={2} />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-[34px] font-bold tracking-[-0.022em] text-foreground">EcoScan</h1>
            <p className="text-[17px] text-muted-foreground leading-snug">
              Scan. Recycle.
              <br />
              Watch your impact add up.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => setShowAuthModal(true)}
            className="w-full btn-brand"
          >
            <LogIn className="w-5 h-5" />
            Get Started
          </Button>

          <div className="flex items-center justify-center gap-8 pt-1">
            {[
              { icon: Leaf, label: "Effortless" },
              { icon: Award, label: "15+ badges" },
              { icon: TrendingUp, label: "Real impact" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <item.icon className="w-5 h-5 text-brand-strong" strokeWidth={2.2} />
                <span className="text-[12px] font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <DialogContent className="sm:max-w-md rounded-[20px]">
            <DialogHeader>
              <DialogTitle>{isSignUp ? "Create Account" : "Welcome Back"}</DialogTitle>
              <DialogDescription>
                {isSignUp
                  ? "Sign up to start tracking your recycling impact"
                  : "Sign in to continue your recycling journey"}
              </DialogDescription>
            </DialogHeader>
            {isSignUp ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-3 mt-4">
                <div>
                  <Input type="text" placeholder="Your Name" className="h-12" {...signUpForm.register("name")} />
                  {signUpForm.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">{signUpForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Input type="email" placeholder="Email" className="h-12" {...signUpForm.register("email")} />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Input type="password" placeholder="Password (min 8 characters)" className="h-12" {...signUpForm.register("password")} />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={signUpForm.formState.isSubmitting}>
                  {signUpForm.formState.isSubmitting ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 font-medium"
                  onClick={() => handleProviderLogin("google")}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-[0.5px] border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-popover text-muted-foreground">or continue with email</span>
                  </div>
                </div>

                <div>
                  <Input type="email" placeholder="Email" className="h-12" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Input type="password" placeholder="Password (min 6 characters)" className="h-12" {...loginForm.register("password")} />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[15px] text-brand-strong active:opacity-50 transition-opacity"
              >
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return <HomeDashboard user={user} onRefresh={handleRefresh} />;
}
