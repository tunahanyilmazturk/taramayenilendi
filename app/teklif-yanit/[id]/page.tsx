import PublicOfferResponse from "@/components/offers/public-offer-response";

export default async function OfferResponseRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicOfferResponse offerId={id} />;
}
