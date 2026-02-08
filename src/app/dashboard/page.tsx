import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Header from "@/components/Header";
import BookmarkList from "@/components/BookmarkList";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen">
      <Header
        username={session.username}
        profileImageUrl={session.profileImageUrl}
      />
      <BookmarkList
        username={session.username}
        paymentStatus={params.payment || null}
      />
    </div>
  );
}
