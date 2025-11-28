"use client";

import React from "react";
import { Button } from "../components/ui/button";

interface UserToken {
  alias: string;
  createdAt: string;
  lastUsed?: string | null;
}

export default function TokensPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const [tokens, setTokens] = React.useState<UserToken[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchTokens = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tokens`, { credentials: 'include' });
      if (!res.ok) return setTokens([]);
      const data = await res.json();
      if (data.success && data.data && data.data.tokens) {
        setTokens(data.data.tokens);
      } else {
        setTokens([]);
      }
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  React.useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleDelete = async (alias: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tokens/${encodeURIComponent(alias)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchTokens();
      }
    } catch (err) {
      console.error('Failed to delete token:', err);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl mb-4">My Tokens</h1>
      {loading ? (
        <p className="text-neutral-400">Loading...</p>
      ) : tokens.length === 0 ? (
        <p className="text-neutral-500">No tokens found.</p>
      ) : (
        <div className="space-y-3">
          {tokens.map((t) => (
            <div key={t.alias} className="p-4 bg-neutral-900 rounded flex justify-between items-center">
              <div>
                <div className="text-sm text-neutral-300">Alias: {t.alias}</div>
                <div className="text-xs text-neutral-500">Created: {t.createdAt}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleDelete(t.alias)} className="bg-red-600">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
