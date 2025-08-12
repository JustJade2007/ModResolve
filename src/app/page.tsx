import { getSession } from "@/lib/auth";
import { ModResolvePage } from "@/components/mod-resolve-page";
import Header from "@/components/header";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={session?.user ?? null} />
      <main className="flex flex-1 flex-col items-center p-4 md:p-6">
        <ModResolvePage />
      </main>
    </div>
  );
}
