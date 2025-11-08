import type { Metadata } from 'next';
import './globals.css';
import { isAuthenticated } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

const BRAND_NAME = 'Activepieces license keys';

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: 'Generate and manage license keys for Activepieces',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  return (
    <html lang="en">
      <body className="bg-gray-50">
        {authenticated && (
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    {BRAND_NAME}
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Sales Team Dashboard
                  </div>
                  <LogoutButton />
                </div>
              </div>
            </div>
          </nav>
        )}
        <main className={authenticated ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          {children}
        </main>
      </body>
    </html>
  );
}

