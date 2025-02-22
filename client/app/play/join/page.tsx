"use client";

import { useSocketContext } from '@/context/SocketContext'
import { useRouter } from 'next/navigation';
import React from 'react'

const page = () => {
	const navigation = useRouter();

	const { onlinePlayers } = useSocketContext();
	console.log(onlinePlayers);
	return (
		<div>
			{onlinePlayers.map((room, _idx) => (
				<div key={_idx}>
					<span>{room}</span>
					<button className='bg-green-600' onClick={() => navigation.push(`/play/inventory?roomId=${room}`)}>Join Room</button>
				</div>
			))}
		</div>
	)
}

export default page