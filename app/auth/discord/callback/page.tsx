"use client";

import React from 'react';

export default function DiscordCallbackPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const [manualHref, setManualHref] = React.useState('#');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code) {
      // Build target URL to forward code to backend
      const target = `${API_URL}/auth/discord/callback?code=${encodeURIComponent(code)}` + (state ? `&state=${encodeURIComponent(state)}` : '');
      setManualHref(target);
      // Auto-redirect to backend callback to finish OAuth
      window.location.href = target;
    }
  }, [API_URL]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-neutral-900 rounded-lg text-center">
        <h1 className="text-lg font-semibold">Finishing sign-in...</h1>
        <p className="text-sm text-neutral-400 mt-2">If you are not redirected automatically, <a id="manual-link" href={manualHref} className="text-blue-400">click here</a>.</p>
      </div>
    </main>
  );
}
