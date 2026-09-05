import OfferDetailPage from "@/components/offers/offer-detail-page";

export default async function OfferDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OfferDetailPage offerId={id} />;
}
