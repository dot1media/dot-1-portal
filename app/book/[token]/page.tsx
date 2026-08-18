import { redirect } from "next/navigation";

// Direct booking links are generated as portal.dot1.media/book/<token>.
// The portal is a single-page app, so this route hands the token to it.
export default async function BookToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect("/?b=" + encodeURIComponent(token));
}
