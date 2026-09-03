"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  function fillDemoAccount() {
    const demoEmail = "demo@hantech.com";
    const demoPassword = "HanTechDemo2026!";
    setTimeout(() => {
      setNativeInputValue(
        emailInputRef.current ?? (document.getElementById("email") as HTMLInputElement | null),
        demoEmail,
      );
      setNativeInputValue(
        passwordInputRef.current ?? (document.getElementById("password") as HTMLInputElement | null),
        demoPassword,
      );
    }, 0);
    setStatusMessage("Demo hesabı ile panele yönlendiriliyorsunuz...");
    setTimeout(() => router.push("/dashboard"), 350);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedEmail = String(new FormData(event.currentTarget).get("email") ?? "");
    if (submittedEmail === "demo@hantech.com") {
      router.push("/dashboard");
      return;
    }
    setStatusMessage("Giriş servisi backend bağlantısı tamamlandığında aktif olacak.");
  }

  return (
    <main className="login-screen relative flex h-dvh min-h-0 overflow-hidden bg-white text-[#102a2a] dark:bg-[#071b1a] dark:text-[#e1f2ed]">
      <div className="absolute -top-32 -left-32 size-96 rounded-full bg-[#d8f8e9]/70 blur-3xl dark:bg-[#165440]/30" />
      <div className="absolute -right-20 -bottom-40 size-[28rem] rounded-full bg-[#e4f8ed]/80 blur-3xl dark:bg-[#0e4036]/35" />

      <div className="relative mx-auto flex h-dvh min-h-0 w-full max-w-7xl items-center justify-center px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="grid max-h-full w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#e2f0e9] bg-white shadow-[0_24px_80px_rgba(26,86,77,0.12)] lg:grid-cols-[1.05fr_0.95fr] dark:border-[#1d4a42] dark:bg-[#0e2927] dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <section
            className="relative hidden overflow-hidden bg-[#103c3a] bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(16,60,58,0.96) 0%, rgba(16,60,58,0.82) 42%, rgba(16,60,58,0.45) 100%), url('/images/hantech-health-network.png')",
            }}
            aria-label="HanTech marka bilgisi"
          >
            <div className="absolute -top-24 -right-24 size-80 rounded-full border-[32px] border-[#299b7c]/20" />
            <div className="absolute -bottom-32 -left-20 size-72 rounded-full border-[36px] border-[#9ce8cb]/10" />
            <div className="relative">
              <BrandMark light />
              <div className="mt-24 max-w-md">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#79d9b4]/30 bg-[#299b7c]/15 px-3.5 py-2 text-xs font-medium text-[#b8e9d7]">
                  <Activity className="size-3.5" /> Mobil sağlık operasyonları
                </div>
                <h1 className="text-5xl leading-[1.05] font-semibold tracking-[-0.055em] xl:text-6xl">
                  Sağlık için sahada, kontrol için HanTech.
                </h1>
                <p className="mt-7 max-w-sm text-base leading-7 text-[#b7d2cd]">
                  Mobil sağlık taramalarınızı, ekiplerinizi ve kurum operasyonlarınızı tek merkezden yönetin.
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-3 text-sm text-[#b7d2cd]">
              <ShieldCheck className="size-5 text-[#9ce8cb]" />
              <span>OSGB operasyonlarınız için güvenli çalışma alanı</span>
            </div>
          </section>

          <section
            className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14 xl:px-20 dark:bg-[#0e2927]"
            aria-label="Kullanıcı girişi"
          >
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between gap-4 lg:justify-end">
                <div className="lg:hidden">
                  <BrandMark />
                </div>
                <ThemeToggle />
              </div>
              <div className="mt-10 mb-9 lg:mt-8">
                <p className="text-sm font-semibold text-[#299b7c]">Hoş geldiniz</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#103c3a] dark:text-[#ecfaf5]">
                  Hesabınıza giriş yapın
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#718783] dark:text-[#9ebbb3]">
                  HanTech OSGB Yönetim Sistemi panelinize erişmek için bilgilerinizi girin.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="mb-2 block text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]"
                    htmlFor="email"
                  >
                    Kurumsal e-posta
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#8ca8a2]" />
                    <input
                      ref={emailInputRef}
                      className="h-12 w-full rounded-2xl border border-[#dbe9e4] bg-[#f9fcfb] pr-4 pl-11 text-sm text-[#173e3b] transition outline-none placeholder:text-[#a3b4b0] focus:border-[#55b99c] focus:ring-4 focus:ring-[#dff6ec] dark:border-[#28554c] dark:bg-[#102f2d] dark:text-[#e8f7f1] dark:placeholder:text-[#75968c] dark:focus:border-[#55b99c] dark:focus:ring-[#1d5a4b]"
                      id="email"
                      name="email"
                      placeholder="ornek@kurumunuz.com"
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      className="block text-sm font-semibold text-[#31534f] dark:text-[#c4dfd5]"
                      htmlFor="password"
                    >
                      Şifre
                    </label>
                    <a
                      className="text-xs font-semibold text-[#299b7c] transition-colors hover:text-[#176d59]"
                      href="#sifremi-unuttum"
                    >
                      Şifremi unuttum
                    </a>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#8ca8a2]" />
                    <input
                      ref={passwordInputRef}
                      className="h-12 w-full rounded-2xl border border-[#dbe9e4] bg-[#f9fcfb] px-11 text-sm text-[#173e3b] transition outline-none placeholder:text-[#a3b4b0] focus:border-[#55b99c] focus:ring-4 focus:ring-[#dff6ec] dark:border-[#28554c] dark:bg-[#102f2d] dark:text-[#e8f7f1] dark:placeholder:text-[#75968c] dark:focus:border-[#55b99c] dark:focus:ring-[#1d5a4b]"
                      id="password"
                      name="password"
                      placeholder="Şifrenizi girin"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-[#8ca8a2] transition-colors hover:text-[#299b7c]"
                      onClick={() => setShowPassword((visible) => !visible)}
                      type="button"
                    >
                      {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#718783] dark:text-[#9ebbb3]">
                  <input
                    checked={rememberMe}
                    className="size-4 accent-[#299b7c]"
                    onChange={(event) => setRememberMe(event.target.checked)}
                    type="checkbox"
                  />{" "}
                  Beni hatırla
                </label>
                <button
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#103c3a] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(16,60,58,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#174e4b]"
                  type="submit"
                >
                  Giriş yap <ArrowRight className="size-4" />
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#bfe9d6] bg-[#f0fbf5] p-3.5 dark:border-[#27614d] dark:bg-[#12382f]">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#d9f5e7] text-[#278b70] dark:bg-[#1a5541] dark:text-[#9ce8cb]">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1d6152] dark:text-[#c7f2df]">Demo hesabı</p>
                    <p className="mt-0.5 truncate text-xs text-[#6d8981] dark:text-[#a0c3b6]">
                      Bilgileri doldurup panele bağlanın
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Demo hesaba bağlan"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#d9f5e7] px-3 py-2 text-xs font-bold text-[#208267] transition-colors hover:bg-[#c5eed9] dark:bg-[#1a5541] dark:text-[#a7f3d0] dark:hover:bg-[#21634e]"
                  onClick={fillDemoAccount}
                  type="button"
                >
                  <BadgeCheck className="size-3.5" /> Bağlan
                </button>
              </div>
              <div
                aria-live="polite"
                className={`mt-4 min-h-5 text-center text-xs font-medium ${statusMessage ? "text-[#278b70]" : "text-transparent"}`}
              >
                {statusMessage || "Durum mesajı"}
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#8aa09c] dark:text-[#9ebbb3]">
                <ShieldCheck className="size-4 text-[#299b7c]" /> Verileriniz güvenli çalışma prensipleriyle korunur.
              </div>
              <p className="mt-10 text-center text-xs text-[#a0afac] dark:text-[#6f9088]">
                © 2026 HanTech · OSGB Yönetim Sistemi
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-11 items-center justify-center rounded-2xl text-lg font-bold shadow-[0_8px_24px_rgba(16,60,58,0.18)] ${light ? "bg-white text-[#103c3a]" : "bg-[#103c3a] text-[#a7f3d0]"}`}
      >
        H
      </span>
      <span className="leading-tight">
        <span className={`block text-[15px] font-bold tracking-tight ${light ? "text-white" : "text-[#103c3a]"}`}>
          HanTech
        </span>
        <span
          className={`block text-[11px] font-medium tracking-[0.12em] ${light ? "text-[#b7d2cd]" : "text-[#67817e]"}`}
        >
          OSGB YÖNETİM SİSTEMİ
        </span>
      </span>
    </div>
  );
}

function setNativeInputValue(input: HTMLInputElement | null, value: string) {
  if (!input) return;
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.defaultValue = value;
  input.setAttribute("value", value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is resolved in the browser; mount state prevents an icon mismatch during hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      aria-label={isDark ? "Aydınlık moda geç" : "Karanlık moda geç"}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-[#dbe9e4] bg-white text-[#52776d] transition-colors hover:border-[#8ed3b7] hover:text-[#208267] dark:border-[#2b5a50] dark:bg-[#12332f] dark:text-[#a7d7c7] dark:hover:border-[#5bc49f] dark:hover:text-[#bdf4df]"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
