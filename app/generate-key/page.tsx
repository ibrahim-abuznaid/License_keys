import Link from 'next/link';
import KeyGenerationForm from '@/components/KeyGenerationForm';

export default function GenerateKeyPage() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Generate License Key</h1>
            <p className="text-indigo-100">
              Configure customer details and select the abilities you need for their license.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <KeyGenerationForm redirectToSubscriber />
    </div>
  );
}
