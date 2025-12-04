"use client";

import React from "react";
import Link from "next/link";
import { DotPattern } from "./components/dots";
import { Particles as MagicParticles } from "./components/magicui/particles";
import { Button } from "./components/ui/button";
import { GlowingEffect } from "./components/ui/glowing-effect";
import { AuroraText } from "./components/magicui/aurora-text";

interface BotStatus {
	running: boolean;
	token?: string;
	prefix?: string;
	alias?: string;
}

interface Token {
	alias: string;
	createdAt: string;
}

export default function Home() {
	const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://story.honored.rip';

	const [token, setToken] = React.useState("");
	const [tokenAlias, setTokenAlias] = React.useState("default");
	const [selectedAlias, setSelectedAlias] = React.useState("default");
 	const [isStarting, setIsStarting] = React.useState(false);
 	const [botStatus, setBotStatus] = React.useState<BotStatus | null>(null);
 	const [loading, setLoading] = React.useState(true);
 	const [showStopConfirm, setShowStopConfirm] = React.useState(false);
 	const [loggedIn, setLoggedIn] = React.useState(false);
	const [tokens, setTokens] = React.useState<Token[]>([]);
	const [loadingTokens, setLoadingTokens] = React.useState(false);


	const fetchTokens = React.useCallback(async () => {
		if (!API_URL) return;
		setLoadingTokens(true);
		try {
			const res = await fetch(`${API_URL}/api/tokens`, { credentials: 'include' });
			if (!res.ok) {
				setTokens([]);
				return;
			}
			const data = await res.json();
			if (data.success && data.data && data.data.tokens) {
				setTokens(data.data.tokens);
				if (data.data.tokens.length > 0 && !selectedAlias) {
					setSelectedAlias(data.data.tokens[0].alias);
				}
			}
		} catch (err) {
			console.error('Error fetching tokens:', err);
		} finally {
			setLoadingTokens(false);
		}
	}, [API_URL, selectedAlias]);

	const checkBotStatus = React.useCallback(async () => {
		if (!API_URL || !selectedAlias) return;
		try {
			const res = await fetch(`${API_URL}/api/bots/status?alias=${encodeURIComponent(selectedAlias)}`, { credentials: 'include' });
			if (!res.ok) {
				setBotStatus(null);
				return;
			}
			const data = await res.json();
			if (data.success && data.data) {
				setBotStatus({
					running: data.data.running,
					prefix: data.data.prefix,
					alias: selectedAlias
				});
			} else {
				setBotStatus(null);
			}
		} catch (err) {
			console.error('Error checking bot status:', err);
		} finally {
			setLoading(false);
		}
	}, [API_URL, selectedAlias]);

	const checkAuthAndStatus = React.useCallback(async () => {
		if (!API_URL) {
			setLoggedIn(false);
			setLoading(false);
			return;
		}
		let isAuth = false;
		try {
			const res = await fetch(`${API_URL}/auth/user`, { credentials: 'include' });
			if (!res.ok) {
				setLoggedIn(false);
				setLoading(false);
				return;
			}
			const data = await res.json();
			isAuth = !!(data && data.success && data.data);
			setLoggedIn(isAuth);
		} catch (err) {
			console.error('Auth check failed:', err);
			setLoggedIn(false);
		} finally {
			if (isAuth) {
				await fetchTokens();
				await checkBotStatus();
			}
			setLoading(false);
		}
	}, [API_URL, checkBotStatus, fetchTokens]);

	React.useEffect(() => {
		checkAuthAndStatus();
	}, [checkAuthAndStatus]);

	const handleAddTokenAndStart = async () => {
		if (!token.trim() || !tokenAlias.trim()) return;
		setIsStarting(true);
		try {
			const addRes = await fetch(`${API_URL}/api/tokens/add`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, alias: tokenAlias })
			});
			const addData = await addRes.json();
			if (!addRes.ok || !addData.success) {
				console.error('Failed to add token:', addData.error);
				// Show a clear message to the user based on HTTP status or returned error
				const message = addData.error || (addRes.status === 409 ? 'Token already exists' : 'Failed to add token');
				alert(message);
				return;
			}

			const startRes = await fetch(`${API_URL}/api/bots/start`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ alias: tokenAlias })
			});
			const startData = await startRes.json();
			if (startRes.ok && startData.success) {
				setToken("");
				setTokenAlias("default");
				setSelectedAlias(tokenAlias);
				await fetchTokens();
				await checkBotStatus();
			} else {
				console.error('Failed to start bot:', startData.error);
				const message = startData.error || (startRes.status === 409 ? 'Bot is already running' : startRes.status === 401 ? 'Invalid token' : 'Failed to start bot');
				alert(message);
			}
		} catch (err) {
			console.error('Error starting bot:', err);
		} finally {
			setIsStarting(false);
		}
	};

	const handleStop = async () => {
		setIsStarting(true);
		try {
			const res = await fetch(`${API_URL}/api/bots/stop`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ alias: selectedAlias })
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setShowStopConfirm(false);
				await checkBotStatus();
			} else {
				console.error('Failed to stop bot:', data.error);
			}
		} catch (err) {
			console.error('Error stopping bot:', err);
		} finally {
			setIsStarting(false);
		}
	};

	return (
		<main className="relative min-h-screen w-full overflow-hidden bg-neutral-950">
			<div className="absolute inset-0">
				<MagicParticles quantity={30} color="#D4BCD2" />
				<DotPattern className="text-neutral-600/30" glow width={32} height={32} />
			</div>

			<nav className="relative z-30 sticky top-0 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 px-4 py-3 sm:px-6 sm:py-4">
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<div className="text-lg sm:text-xl font-bold text-white">
						Honored.rip
					</div>
					{loggedIn && tokens.length > 0 && (
						<Link href="/tokens">
							<Button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 transition">
								Manage Tokens ({tokens.length})
							</Button>
						</Link>
					)}
				</div>
			</nav>

			<section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 py-20">
				
				<div className="text-center space-y-8 max-w-4xl mx-auto">
					<div className="space-y-4">
						<h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
						</h1>
					</div>

					<div className="relative mx-auto w-full max-w-md mt-8 sm:mt-12 px-2 sm:px-0">
						<div className="relative rounded-2xl bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-6 sm:p-8 overflow-hidden">
							<GlowingEffect
								blur={10}
								spread={50}
								variant="default"
								glow={token.length > 0 || botStatus?.running}
								inactiveZone={0.5}
								proximity={100}
								disabled={false}
							/>
							
							<div className="relative z-10 space-y-6">
								{loading ? (
									<div className="text-center py-4">
										<p className="text-gray-400">Loading...</p>
									</div>
								) : botStatus?.running ? (
									<div>
										<AuroraText className="text-white mb-4" speed={0.8}>
											Bot is Running
										</AuroraText>
										<div className="mb-4 p-3 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/30">
											<p className="text-xs sm:text-sm text-green-400 break-all">Token: {botStatus.token?.substring(0, 10)}...{botStatus.token?.substring(botStatus.token.length - 5)}</p>
											<p className="text-xs sm:text-sm text-green-400 mt-2">Prefix: {botStatus.prefix}</p>
										</div>
										{!showStopConfirm ? (
											<Button
												onClick={() => setShowStopConfirm(true)}
												className="w-full py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white transition"
											>
												Stop Selfbot
											</Button>
										) : (
											<div className="space-y-2">
												<p className="text-yellow-400 text-xs sm:text-sm">Are you sure?</p>
												<div className="flex gap-2">
													<Button
														onClick={handleStop}
														disabled={isStarting}
														className="flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white transition"
													>
														{isStarting ? "Stopping..." : "Yes, Stop"}
													</Button>
													<Button
														onClick={() => setShowStopConfirm(false)}
														disabled={isStarting}
														className="flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-gray-600 hover:bg-gray-700 text-white transition"
													>
														Cancel
													</Button>
												</div>
											</div>
										)}
									</div>
								) : (
									<div>
										{!loggedIn ? (
											<div className="space-y-4">
												<p className="text-xs sm:text-sm text-neutral-400">You must log in with Discord to manage tokens and start bots.</p>
												<a href={`https://story.honored.rip/auth/discord`}>
													<Button className="w-full py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white transition">Sign in with Discord</Button>
												</a>
											</div>
										) : (
											<div>
												<AuroraText className="text-white mb-4" speed={0.8}>
													#1 Selfbot Hosting
												</AuroraText>

												{tokens.length > 0 && (
													<div className="mb-4">
														<label className="block text-xs sm:text-sm text-neutral-400 mb-2">Select Token</label>
														<select
															value={selectedAlias}
															onChange={(e) => setSelectedAlias(e.target.value)}
															className="w-full px-3 sm:px-4 py-2 rounded-lg bg-neutral-800/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-neutral-700 transition"
														>
															{tokens.map((t) => (
																<option key={t.alias} value={t.alias}>
																	{t.alias}
																</option>
															))}
														</select>
													</div>
												)}

												<div className="mb-4 p-3 sm:p-4 rounded-lg bg-neutral-800/30 border border-neutral-700">
													<p className="text-xs text-neutral-400 mb-3">Add New Token</p>
													<input
														type="password"
														value={token}
														onChange={(e) => setToken(e.target.value)}
														placeholder="paste your token here"
														className="w-full px-3 sm:px-4 py-2 rounded-lg bg-neutral-800/50 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-neutral-700 transition mb-3"
													/>
													<input
														type="text"
														value={tokenAlias}
														onChange={(e) => setTokenAlias(e.target.value)}
														placeholder="token alias (e.g., 'main', 'alt', 'farm')"
														className="w-full px-3 sm:px-4 py-2 rounded-lg bg-neutral-800/50 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-neutral-700 transition"
													/>
												</div>

												<Button
													onClick={handleAddTokenAndStart}
													disabled={isStarting || !token.trim() || !tokenAlias.trim()}
													className={`w-full py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition ${
														isStarting
															? "bg-purple-500/50 text-white"
															: "bg-gradient-to-r from-gray-700 to-purple-500 text-white hover:from-gray-600 hover:via-purple-600 hover:to-purple-600 focus:ring-4 focus:ring-purple-500/30"
													}`}
												>
													{isStarting ? "Starting..." : "Add Token & Start"}
												</Button>

												{tokens.length > 0 && (
													<a href="/tokens" className="block text-center mt-4">
														<Button className="w-full py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm bg-neutral-800 hover:bg-neutral-700 text-white transition">
															Manage Tokens ({tokens.length})
														</Button>
													</a>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					<p className="text-sm text-neutral-500">
            <AuroraText speed={0.5} className="text-neutral-500s">
						made by jeagerist (rewrite yurrion)
            </AuroraText>
					</p>
				</div>
			</section>
		</main>
	);
}
