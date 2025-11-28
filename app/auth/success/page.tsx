"use client";

import React from "react";
import Link from 'next/link';

export default function SuccessPage() {
  const [loading, setLoading] = React.useState(true);
  const [username, setUsername] = React.useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  React.useEffect(() => {
    async function fetchUser() {
      if (!API_URL) {
        setUsername(null);
        setLoading(false);
        return;
      }
      // If we were redirected here from the OAuth callback, the URL may include
      // `?session=<id>`. Some browsers block Set-Cookie on cross-site redirects,
      // so we explicitly POST the session id back to the API to have it set the
      // httpOnly cookie via a same-site request with credentials.
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const session = urlParams.get('session');

        if (session) {
          try {
            await fetch(`${API_URL}/auth/confirm`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session })
            });
            // remove session from URL for cleanliness
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (err) {
            console.error('Failed to confirm session via API:', err);
          }
        }

        const res = await fetch(`${API_URL}/auth/user`, { credentials: 'include' });
        if (!res.ok) {
          setUsername(null);
          return;
        }
        const data = await res.json();
        if (data.success && data.data) {
          setUsername(data.data.username || null);
        }
      } catch (err) {
        console.error('Failed to fetch user after auth:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [API_URL]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-neutral-900 rounded-lg">
        {loading ? (
          <p className="text-neutral-400">Completing sign-in...</p>
        ) : username ? (
          <div>
            <h1 className="text-lg font-semibold">Welcome, {username}!</h1>
            <p className="text-sm text-neutral-400 mt-2">Sign-in successful. You can return to the dashboard.</p>
            <Link href="/" className="mt-4 inline-block text-blue-500">Go to dashboard</Link>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-semibold">Sign-in failed</h1>
            <p className="text-sm text-neutral-400 mt-2">We could not confirm your session. Try signing in again.</p>
            <Link href="/" className="mt-4 inline-block text-blue-500">Return</Link>
          </div>
        )}
      </div>
    </main>
  );
}
