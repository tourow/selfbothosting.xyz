"use client";

import React from "react";
import { DotPattern } from "./components/dots";
import { Particles as MagicParticles } from "./components/magicui/particles";
import { Button } from "./components/ui/button";
import { GlowingEffect } from "./components/ui/glowing-effect";
import { AuroraText } from "./components/magicui/aurora-text";

interface BotStatus {
	running: boolean;
	token?: string;
	prefix?: string;
}

export default function Home() {
	const [token, setToken] = React.useState("");
	const [isStarting, setIsStarting] = React.useState(false);
	const [botStatus, setBotStatus] = React.useState<BotStatus | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [showStopConfirm, setShowStopConfirm] = React.useState(false);

	React.useEffect(() => {
		checkBotStatus();
		const interval = setInterval(checkBotStatus, 3000);
		return () => clearInterval(interval);
	}, []);

	const checkBotStatus = async () => {
		try {
			const response = await fetch('/api/bots');
			const data = await response.json();
			if (data.success && data.bots.length > 0) {
				const firstBot = data.bots[0];
				setBotStatus({
					running: firstBot.status === 'running',
					token: firstBot.token,
					prefix: firstBot.prefix,
				});
			} else {
				setBotStatus(null);
			}
		} catch (err) {
			console.error('Error checking bot status:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleStart = async () => {
		if (!token.trim()) return;

		setIsStarting(true);
		try {
			const response = await fetch('/api/bots', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, prefix: '$', action: 'add' }),
			});

			const data = await response.json();
			if (data.success) {
				const startResponse = await fetch(`/api/bots/${data.bot.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'start' }),
				});

				if (startResponse.ok) {
					setToken("");
					await checkBotStatus();
				}
			}
		} catch (err) {
			console.error('Error starting bot:', err);
		} finally {
			setIsStarting(false);
		}
	};

	const handleStop = async () => {
		if (!botStatus?.token) return;

		setIsStarting(true);
		try {
			const response = await fetch('/api/bots');
			const data = await response.json();
			if (data.success && data.bots.length > 0) {
				const firstBot = data.bots[0];
				const stopResponse = await fetch(`/api/bots/${firstBot.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'stop' }),
				});

				if (stopResponse.ok) {
					setShowStopConfirm(false);
					await checkBotStatus();
				}
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

			<section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 py-20">
				
				<div className="text-center space-y-8 max-w-4xl mx-auto">
					<div className="space-y-4">
						<h1 className="text-5xl md:text-7xl font-bold tracking-tight">
						</h1>
					</div>

					<div className="relative mx-auto w-full max-w-md mt-12">
						<div className="relative rounded-2xl bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 overflow-hidden">
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
											✓ Bot is Running
										</AuroraText>
										<div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
											<p className="text-sm text-green-400">Token: {botStatus.token?.substring(0, 10)}...{botStatus.token?.substring(botStatus.token.length - 5)}</p>
											<p className="text-sm text-green-400">Prefix: {botStatus.prefix}</p>
										</div>
										{!showStopConfirm ? (
											<Button
												onClick={() => setShowStopConfirm(true)}
												className="w-full py-3 rounded-lg font-semibold text-lg bg-red-600 hover:bg-red-700 text-white"
											>
												Stop Selfbot
											</Button>
										) : (
											<div className="space-y-2">
												<p className="text-yellow-400 text-sm">Are you sure?</p>
												<div className="flex gap-2">
													<Button
														onClick={handleStop}
														disabled={isStarting}
														className="flex-1 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
													>
														{isStarting ? "Stopping..." : "Yes, Stop"}
													</Button>
													<Button
														onClick={() => setShowStopConfirm(false)}
														disabled={isStarting}
														className="flex-1 py-2 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white"
													>
														Cancel
													</Button>
												</div>
											</div>
										)}
									</div>
								) : (
									<div>
										<AuroraText className="text-white mb-4" speed={0.8}>
											#1 Selfbot Hosting
										</AuroraText>
										<input
											type="password"
											value={token}
											onChange={(e) => setToken(e.target.value)}
											placeholder="paste your token here"
											className="w-full px-4 py-3 rounded-lg bg-neutral-800/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-neutral-700 transition mb-4"
										/>

										<Button
											onClick={handleStart}
											disabled={isStarting || !token.trim()}
											className={`w-full py-3 rounded-lg font-semibold text-lg transition ${
												isStarting
													? "bg-purple-500/50 text-white"
													: "bg-gradient-to-r from-gray-700 to-purple-500 text-white hover:from-gray-600 hover:via-purple-600 hover:to-purple-600 focus:ring-4 focus:ring-purple-500/30"
											}`}
										>
											{isStarting ? "Starting..." : "Start Selfbot"}
										</Button>
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
