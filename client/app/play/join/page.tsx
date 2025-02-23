
"use client"

import { useSocketContext } from "@/context/SocketContext"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, LogIn } from "lucide-react"
import { motion } from "framer-motion"

const JoinPage = () => {
	const router = useRouter()
	const { onlinePlayers } = useSocketContext()
	const [newRoom, setNewRoom] = useState("")

	const handleCreateRoom = () => {
		if (newRoom.trim()) {
			router.push(`/play/inventory?roomId=${newRoom.trim()}`)
		}
	}

	return (
		<div className="min-h-screen bg-[#030712] text-white overflow-hidden">
			<div className="fixed inset-0 bg-gradient-to-br from-black via-[#0a0f18] to-black" />
			<div className="fixed inset-0 opacity-30">
				<div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
				<div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
				<div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-violet-500/20 rounded-full blur-[120px] animate-pulse delay-2000" />
			</div>

			<div className="relative container mx-auto px-4 py-20 md:py-32">
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400"
				>
					Join a Game Room
				</motion.h1>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<Card className="bg-white/5 border-white/10 backdrop-blur-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-blue-400">
									<Users size={24} />
									Available Rooms
								</CardTitle>
							</CardHeader>
							<CardContent>
								{onlinePlayers.length > 0 ? (
									<ul className="space-y-4">
										{onlinePlayers.map((room, index) => (
											<li key={index} className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
												<span className="font-medium text-gray-300">{room}</span>
												<Button
													onClick={() => router.push(`/play/inventory?roomId=${room}`)}
													className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
												>
													Join Room
												</Button>
											</li>
										))}
									</ul>
								) : (
									<p className="text-center text-gray-400">No active rooms available.</p>
								)}
							</CardContent>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.4 }}
					>
						<Card className="bg-white/5 border-white/10 backdrop-blur-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-blue-400">
									<LogIn size={24} />
									Create a New Room
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col gap-4">
									<Input
										type="text"
										placeholder="Enter room name"
										value={newRoom}
										onChange={(e) => setNewRoom(e.target.value)}
										className="bg-white/10 border-white/20 text-white placeholder-gray-400"
									/>
									<Button
										onClick={handleCreateRoom}
										className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
									>
										Create and Join Room
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</div>
		</div>
	)
}

export default JoinPage