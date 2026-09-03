import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/card";
import { Page } from "@/components/ui/page-header";

export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Page className="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-xl rounded-[28px] border border-border bg-card p-8 text-center shadow-card sm:p-12">
        <IconBadge className="mx-auto" icon={Construction} size="xl" />
        <p className="mt-6 text-xs font-bold tracking-[0.18em] text-brand uppercase">HanTech OSGB</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-heading">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Badge>Bu modül hazırlanıyor</Badge>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">
              <ArrowLeft /> Genel bakışa dön
            </Link>
          </Button>
        </div>
      </section>
    </Page>
  );
}
