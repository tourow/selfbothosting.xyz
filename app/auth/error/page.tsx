"use client";

import React from "react";
import Link from 'next/link';

export default function ErrorPage() {
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const msg = params.get('message');
      setMessage(msg ? decodeURIComponent(msg) : 'Authentication failed');
    } catch (err) {
      setMessage('Authentication failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-neutral-900 rounded-lg">
        {loading ? (
          <p className="text-neutral-400">Processing...</p>
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-red-400">Authentication Error</h1>
            <p className="text-sm text-neutral-400 mt-2">{message}</p>
            <Link href="/" className="mt-4 inline-block text-blue-500">Return to dashboard</Link>
          </div>
        )}
      </div>
    </main>
  );
}
