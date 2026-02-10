import { ReviewBoard } from "@/components/ReviewBoard";
import { fetchReviews } from "@/lib/db";
import { ReviewsPageClient } from "@/components/ReviewsPageClient";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await fetchReviews(true);

  return <ReviewsPageClient initialReviews={reviews} />;
}
