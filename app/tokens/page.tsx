"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";

interface UserToken {
  alias: string;
  createdAt: string;
  lastUsed?: string | null;
}

export default function TokensPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://story.honored.rip';
  const [tokens, setTokens] = React.useState<UserToken[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  const fetchTokens = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/tokens`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Not authenticated. Please log in.');
        } else {
          setError('Failed to load tokens.');
        }
        setTokens([]);
        return;
      }
      const data = await res.json();
      if (data.success && data.data && data.data.tokens) {
        setTokens(data.data.tokens);
      } else {
        setTokens([]);
      }
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      setError('Failed to fetch tokens. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  React.useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleDelete = async (alias: string) => {
    setDeleting(alias);
    try {
      const res = await fetch(`${API_URL}/api/tokens/${encodeURIComponent(alias)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteConfirm(null);
        await fetchTokens();
      } else {
        setError(data.error || 'Failed to delete token.');
      }
    } catch (err) {
      console.error('Failed to delete token:', err);
      setError('Failed to delete token. Check your connection.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950">
      <nav className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg sm:text-xl font-bold text-white hover:text-purple-400 transition">
            Honored.rip
          </Link>
          <Link href="/">
            <Button className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm sm:text-base px-3 sm:px-4 py-2">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-12">

      
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Manage Tokens</h1>
          <p className="text-neutral-400 text-sm sm:text-base">View and delete your bot tokens</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">No tokens found.</p>
            <Link href="/">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Add Your First Token
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {tokens.map((t) => (
              <div
                key={t.alias}
                className="p-4 sm:p-6 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-base sm:text-lg font-semibold text-white break-all">{t.alias}</div>
                    {t.alias === 'default' && (
                      <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 whitespace-nowrap">Default</span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-400 space-y-1">
                    <p>Created: {new Date(t.createdAt).toLocaleString()}</p>
                    {t.lastUsed && (
                      <p>Last used: {new Date(t.lastUsed).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {deleteConfirm === t.alias ? (
                    <>
                      <Button
                        onClick={() => handleDelete(t.alias)}
                        disabled={deleting === t.alias}
                        className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white text-sm"
                      >
                        {deleting === t.alias ? "Deleting..." : "Confirm"}
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirm(null)}
                        disabled={deleting === t.alias}
                        className="flex-1 sm:flex-none bg-neutral-700 hover:bg-neutral-600 text-white text-sm"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setDeleteConfirm(t.alias)}
                      className="w-full sm:w-auto bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-600/50 text-sm"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
