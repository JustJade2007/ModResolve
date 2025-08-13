
import { ModResolvePage } from '@/components/mod-resolve-page';
import Header from '@/components/header';

export default async function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center p-4 md:p-6">
        <ModResolvePage />
      </main>
    </div>
  );
}
