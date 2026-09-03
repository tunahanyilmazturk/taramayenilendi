"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/card";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-lg rounded-[28px] border border-border bg-card p-8 text-center shadow-card sm:p-12">
        <IconBadge className="mx-auto" icon={AlertTriangle} size="xl" tone="danger" />
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-heading">Bir şeyler ters gitti</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar denemek sorunu çözmezse sayfayı yenileyin.
        </p>
        {error.digest && <p className="mt-3 text-[10px] text-subtle">Hata kodu: {error.digest}</p>}
        <Button className="mt-8" onClick={() => retry()}>
          <RotateCcw /> Tekrar dene
        </Button>
      </section>
    </main>
  );
}
