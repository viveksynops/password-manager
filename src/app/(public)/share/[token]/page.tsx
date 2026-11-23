import { cookies } from "next/headers";
import { validateShareLink, getSharedItems } from "@/services/share-access.service";
import { SHARE_SESSION_COOKIE_NAME } from "@/lib/share/session";
import { SharePublicView } from "@/features/share-links/components/SharePublicView";

export const instant = false;

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const validation = await validateShareLink(token);
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SHARE_SESSION_COOKIE_NAME);

  let initialData = null;
  if (validation.valid && sessionCookie?.value) {
    try {
      initialData = await getSharedItems(token, sessionCookie.value);
    } catch {
      initialData = null;
    }
  }

  return <SharePublicView token={token} validation={validation} initialData={initialData} />;
}
