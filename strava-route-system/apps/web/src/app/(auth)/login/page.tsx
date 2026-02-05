"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { StravaTeaser } from "@/components/auth/strava-teaser";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading, signIn, signInWithEmail, signUpWithEmail, sendPasswordReset } =
    auth;

  // 已登入則導向 dashboard
  useEffect(() => {
    if (authLoading) return;
    if (user) router.replace("/dashboard");
  }, [user, authLoading, router]);

  const handleGoogleAuth = async () => {
    await signIn();
    toast.success("登入成功", { duration: 2000 });
  };

  /** Email 登入：有 name 為註冊，否則為登入 */
  const handleEmailAuth = async (
    email: string,
    password: string,
    name?: string
  ) => {
    if (name !== undefined && name.trim() !== "") {
      await signUpWithEmail(email, password, name);
    } else {
      await signInWithEmail(email, password);
    }
    toast.success(name ? "註冊成功" : "登入成功", { duration: 2000 });
  };

  /** 忘記密碼：Firebase 寄出重設信；成功訊息由 AuthForm 的 setSuccess 顯示 */
  const handleForgotPassword = async (email: string) => {
    if (typeof sendPasswordReset !== "function") {
      toast.error("功能尚未載入，請重新整理頁面");
      return;
    }
    await sendPasswordReset(email);
  };

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Side - 功能預告 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:block lg:w-1/2 xl:w-3/5"
      >
        <StravaTeaser />
      </motion.div>

      {/* Right Side - 登入表單 */}
      <div className="relative flex w-full flex-col items-center justify-center p-8 lg:w-1/2 xl:w-2/5">
        {/* Background gradient for mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent lg:hidden" />

        {/* Mobile Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mb-8 flex items-center gap-2 lg:hidden"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <svg
              className="h-5 w-5 text-primary-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-xl font-bold text-foreground">StravaSync</span>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <AuthForm
            onGoogleAuth={handleGoogleAuth}
            onEmailAuth={handleEmailAuth}
            onForgotPassword={handleForgotPassword}
          />
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative z-10 mt-8 text-center text-xs text-muted-foreground"
        >
          繼續使用即表示您同意我們的{" "}
          <a href="#" className="text-primary hover:underline">
            服務條款
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            隱私政策
          </a>
        </motion.p>
      </div>
    </div>
  );
}
