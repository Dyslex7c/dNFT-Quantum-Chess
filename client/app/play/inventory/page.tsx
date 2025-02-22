"use client";

import { useSocketContext } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAccount } from "wagmi";

const Page = () => {
	const { socket } = useSocketContext();
	const { address } = useAccount();
	const navigation = useRouter();
	const { roomId } = useParams();

	const [user, setUser] = useState({
		metamaskId: address,
		rank: 700,
	});

	useEffect(() => {
		if (!socket) return;

		// Room Created Listener (For Player 1)
		socket.on("roomCreated", (data) => {
			console.log("Room created:", data);
			navigation.push("/play/inventory");
		});

		// Game Initialized Listener (For Both Players)
		socket.on("gameInitialized", (data) => {
			console.log("Game started:", data);
			navigation.push("/play/game");
		});

		// Error Listener
		socket.on("error", (error) => {
			console.log("Error:", error);
		});

		// Cleanup Listeners
		return () => {
			socket.off("roomCreated");
			socket.off("gameInitialized");
			socket.off("error");
		};
	}, [socket]);

	// Handle Create or Join Room
	const handleGameAction = () => {
		if (!user.metamaskId || user.rank === undefined) {
			console.log("Invalid user data");
			return;
		}

		if (roomId) {
			// Join an existing game
			socket?.emit("joinRoom", {
				p2Id: user.metamaskId,
				R2: user.rank,
				roomId,
			});
		} else {
			// Create a new game
			socket?.emit("createRoom", {
				p1Id: user.metamaskId,
				R1: user.rank,
			});
		}
	};

	return (
		<div>
			<button onClick={handleGameAction}>
				{roomId ? "Join Game" : "Start Game"}
			</button>
		</div>
	);
};

export default Page;