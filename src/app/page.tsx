import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import SignInButton from "@/components/SignInButton";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = params.error;

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Bookmark Export</h1>
        <p className="text-lg text-gray-500 mb-8">
          Export your X bookmarks as JSON. Get your first 25 free.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error === "auth_denied" && "Authorization was denied."}
            {error === "auth_failed" && "Authentication failed. Please try again."}
            {error === "missing_params" && "Invalid callback. Please try again."}
            {error === "invalid_state" && "Invalid session state. Please try again."}
          </div>
        )}

        <SignInButton />

        <div className="mt-10 text-sm text-gray-400 space-y-2">
          <p>25 bookmarks free, then $1 per 100</p>
          <p>Download as JSON anytime</p>
        </div>
      </div>
    </main>
  );
}
