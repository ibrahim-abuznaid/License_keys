import Link from 'next/link';
import SubscribersTable from '@/components/SubscribersTable';

const BRAND_NAME = 'Activepieces license keys';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to {BRAND_NAME}</h1>
            <p className="text-indigo-100">
              Manage subscribers and deliver license keys for Activepieces Business and Embed plans.
            </p>
          </div>
          <Link
            href="/generate-key"
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80"
          >
            Generate Key
          </Link>
        </div>
      </div>

      <SubscribersTable />
    </div>
  );
}
