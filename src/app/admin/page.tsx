import { AdminPanel } from "@/components/admin-panel";
import { getStore } from "@/lib/get-store";
import { toPublicPuzzle } from "@/lib/puzzle";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const providedSecret = params.secret;
  const secret = Array.isArray(providedSecret) ? providedSecret[0] : providedSecret;
  const configuredSecret = process.env.ADMIN_SECRET;

  if (!configuredSecret) {
    return (
      <main className="admin-shell">
        <section className="admin-card">
          <p className="eyebrow">admin</p>
          <h1>ADMIN_SECRET is not configured</h1>
          <p>Set a high-entropy ADMIN_SECRET in Amplify environment variables before using this panel.</p>
        </section>
      </main>
    );
  }

  if (!secret || secret !== configuredSecret) {
    return (
      <main className="admin-shell">
        <section className="admin-card">
          <p className="eyebrow">admin</p>
          <h1>Unauthorized</h1>
          <p>Open this page with the configured admin secret.</p>
        </section>
      </main>
    );
  }

  const puzzle = await getStore().getCurrentPuzzle();

  return (
    <main className="admin-shell">
      <AdminPanel puzzle={toPublicPuzzle(puzzle)} trueCount={puzzle.trueCount} secret={secret} />
    </main>
  );
}
