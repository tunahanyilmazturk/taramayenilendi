"use client";

import { Activity, ArrowRight, BadgeCheck, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import ThemeToggle from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { signIn, useSession } from "@/lib/auth";
import { demoUser } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { session, hydrated } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState<{ tone: "info" | "error" | "success"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && session) router.replace("/dashboard");
  }, [hydrated, session, router]);

  const attempt = (candidateEmail: string, candidatePassword: string) => {
    const result = signIn(candidateEmail, candidatePassword);
    if (result.ok) {
      setSubmitting(true);
      setStatus({ tone: "success", message: `Hoş geldiniz ${result.session.name}, panele yönlendiriliyorsunuz...` });
      router.push("/dashboard");
      return;
    }
    setStatus({ tone: "error", message: result.error });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    attempt(email, password);
  };

  const fillDemo = () => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setStatus({ tone: "info", message: "Demo bilgileri dolduruldu. Giriş yapılıyor..." });
    attempt(demoUser.email, demoUser.password);
  };

  return (
    <main className="bg-background text-foreground relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-brand-soft/70 pointer-events-none absolute -top-32 -left-32 size-96 rounded-full blur-3xl" />
      <div className="bg-brand-soft/60 pointer-events-none absolute -right-20 -bottom-40 size-[28rem] rounded-full blur-3xl" />

      <div className="border-border bg-card relative grid w-full max-w-6xl overflow-hidden rounded-[28px] border shadow-[0_24px_80px_-24px_rgba(16,42,67,0.25)] lg:grid-cols-[1.05fr_0.95fr]">
        <section
          aria-label="HanTech marka bilgisi"
          className="bg-primary relative hidden overflow-hidden bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14"
          style={{
            backgroundImage:
              "linear-gradient(90deg, color-mix(in srgb, var(--primary) 96%, transparent) 0%, color-mix(in srgb, var(--primary) 82%, transparent) 42%, color-mix(in srgb, var(--primary) 45%, transparent) 100%), url('/images/hantech-health-network.png')",
          }}
        >
          <div className="absolute -top-24 -right-24 size-80 rounded-full border-[32px] border-white/10" />
          <div className="absolute -bottom-32 -left-20 size-72 rounded-full border-[36px] border-white/5" />
          <div className="relative">
            <BrandMark variant="light" />
            <div className="mt-24 max-w-md">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white/90">
                <Activity className="size-3.5" /> Mobil sağlık operasyonları
              </div>
              <h1 className="text-5xl leading-[1.05] font-semibold tracking-[-0.055em] xl:text-6xl">
                Sağlık için sahada, kontrol için HanTech.
              </h1>
              <p className="mt-7 max-w-sm text-base leading-7 text-white/75">
                Mobil sağlık taramalarınızı, ekiplerinizi ve kurum operasyonlarınızı tek merkezden yönetin.
              </p>
            </div>
          </div>
          <div className="relative flex items-center gap-3 text-sm text-white/75">
            <ShieldCheck className="text-brand-strong size-5" />
            <span>OSGB operasyonlarınız için güvenli çalışma alanı</span>
          </div>
        </section>

        <section
          aria-label="Kullanıcı girişi"
          className="flex items-center justify-center px-6 py-8 sm:px-12 lg:px-14 xl:px-20"
        >
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between gap-4 lg:justify-end">
              <div className="lg:hidden">
                <BrandMark />
              </div>
              <ThemeToggle />
            </div>
            <div className="mt-8 mb-8">
              <p className="text-brand text-sm font-semibold">Hoş geldiniz</p>
              <h2 className="text-heading mt-2 text-3xl font-semibold tracking-[-0.04em]">Hesabınıza giriş yapın</h2>
              <p className="text-muted mt-3 text-sm leading-6">
                HanTech OSGB Yönetim Sistemi panelinize erişmek için bilgilerinizi girin.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <Field label="Kurumsal e-posta">
                <Input
                  autoComplete="email"
                  className="h-12 rounded-2xl"
                  icon={Mail}
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@kurumunuz.com"
                  required
                  type="email"
                  value={email}
                />
              </Field>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-foreground text-sm font-medium" htmlFor="password">
                    Şifre
                  </label>
                  <button
                    className="text-brand hover:text-brand-strong text-xs font-semibold transition-colors"
                    onClick={() =>
                      setStatus({
                        tone: "info",
                        message: "Şifre sıfırlama, backend bağlantısı ile birlikte aktif olacak.",
                      })
                    }
                    type="button"
                  >
                    Şifremi unuttum
                  </button>
                </div>
                <div className="relative">
                  <Input
                    autoComplete="current-password"
                    className="h-12 rounded-2xl pr-12"
                    icon={LockKeyhole}
                    id="password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Şifrenizi girin"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="text-subtle hover:text-brand absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                  </button>
                </div>
              </div>
              <label className="text-muted flex cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Beni hatırla
              </label>
              <Button className="w-full rounded-2xl" disabled={submitting} size="lg" type="submit">
                Giriş yap <ArrowRight />
              </Button>
            </form>

            <div className="border-border-strong bg-brand-soft/60 mt-5 flex items-center justify-between gap-3 rounded-2xl border p-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="bg-brand-soft text-brand-soft-fg flex size-9 shrink-0 items-center justify-center rounded-xl">
                  <Sparkles className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-brand-soft-fg text-sm font-semibold">Demo hesabı</p>
                  <p className="text-muted mt-0.5 truncate text-xs">{demoUser.email}</p>
                </div>
              </div>
              <Button disabled={submitting} onClick={fillDemo} size="sm" variant="soft">
                <BadgeCheck /> Bağlan
              </Button>
            </div>

            <p
              aria-live="polite"
              className={cn(
                "mt-4 min-h-5 text-center text-xs font-medium",
                status?.tone === "error" ? "text-danger" : "text-brand",
              )}
            >
              {status?.message}
            </p>

            <div className="text-muted mt-6 flex items-center justify-center gap-2 text-center text-xs">
              <ShieldCheck className="text-brand size-4" /> Verileriniz güvenli çalışma prensipleriyle korunur.
            </div>
            <p className="text-subtle mt-8 text-center text-xs">
              © {new Date().getFullYear()} HanTech · OSGB Yönetim Sistemi
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
