"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { LoginHero, loginCopy } from "@/components/auth/login-hero";
import { FeatureCarousel } from "@/components/auth/feature-carousel";
import { SiteFooter } from "@/components/app-shell/site-footer";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";
import { ProductLogo } from "@/components/ui/product-logo";

/** 入口頁（/ 與 /login）：左側品牌＋精選路線即時判定，右側登入表單；手機版精選路線排在表單下方 */
export function LoginView({ featured }: { featured: ReactNode }) {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading, refreshSession, signIn, signInWithEmail, signUpWithEmail, sendPasswordReset } =
    auth;

  // 已登入則先更新 session cookie（避免 idToken 過期導致 dashboard ↔ login 導向迴圈），再導向 dashboard
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      refreshSession()
        .then(() => router.replace("/dashboard"))
        .catch(() => router.replace("/dashboard")); // 仍導向，後續 API 會處理 401
    }
  }, [user, authLoading, refreshSession, router]);

  const handleGoogleAuth = async () => {
    await signIn();
    toast.success("登入成功", { duration: 1000 });
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

  // 只在確定已登入時才換成轉圈；auth 載入中照常顯示，SSR 才有內容（精選路線、表單）可給爬蟲與首屏
  if (user) {
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
        <LoginHero featured={featured} />
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
          className="relative z-10 mb-8 w-full max-w-md lg:hidden"
        >
          <div className="flex items-center gap-2">
            <ProductLogo size={40} />
            <span className="text-xl font-bold text-foreground">{loginCopy.brand}</span>
          </div>
          <h1 className="mt-4 text-2xl font-black leading-tight text-foreground">{loginCopy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loginCopy.subtitle}</p>
          <FeatureCarousel className="mt-4" />
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

        {/* Mobile 精選路線：桌機版在左側 hero */}
        <motion.section
          aria-labelledby="featured-title-mobile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10 mt-8 w-full max-w-md space-y-3 lg:hidden"
        >
          <h2 id="featured-title-mobile" className="text-base font-bold text-foreground">
            {loginCopy.featuredTitle}
          </h2>
          {featured}
        </motion.section>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative z-10 mt-8 text-center text-xs text-muted-foreground"
        >
          繼續使用即表示您同意我們的{" "}
          <Link href="/terms" className="text-primary hover:underline">
            服務條款
          </Link>
          與
          <Link href="/privacy" className="text-primary hover:underline">
            隱私政策
          </Link>
        </motion.p>
        <SiteFooter className="relative z-10 mt-3" />
      </div>
    </div>
  );
}
