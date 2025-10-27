'use client';

import { useState } from 'react';
import KeyGenerationForm from '@/components/KeyGenerationForm';
import SubscribersTable from '@/components/SubscribersTable';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleKeyCreated = () => {
    // Trigger a refresh of the key table
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to License Key Manager</h1>
        <p className="text-indigo-100">
          Manage subscribers and deliver license keys for Activepieces Business and Embed plans.
        </p>
      </div>

      {/* Key Generation Form */}
      <KeyGenerationForm onSuccess={handleKeyCreated} />

      {/* Subscribers Table */}
      <SubscribersTable key={refreshKey} />
    </div>
  );
}

