import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-lg rounded-[28px] border border-border bg-card p-8 text-center shadow-card sm:p-12">
        <IconBadge className="mx-auto" icon={Compass} size="xl" />
        <p className="mt-6 text-xs font-bold tracking-[0.18em] text-brand uppercase">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-heading">Sayfa bulunamadı</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">
          Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">
            <ArrowLeft /> Panele dön
          </Link>
        </Button>
      </section>
    </main>
  );
}
