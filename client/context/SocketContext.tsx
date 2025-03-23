"use client";

import { useAptosAccount } from "@/app/hooks/useAptosAccount";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    onlinePlayers: string[];
}

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocketContext must be used within a SocketContextProvider");
    }
    return context;
};

export const SocketContextProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const { address } = useAptosAccount();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlinePlayers, setOnlinePlayers] = useState<string[]>([]);

    useEffect(() => {
        if (address) {
            const newSocket = io("http://localhost:5000", {
                query: {
                    userId: address,
                },
            });

            setSocket(newSocket);

            newSocket.on("activeRooms", (users: string[]) => {
                setOnlinePlayers(users);
            });

            return () => {
                newSocket.close();
                setSocket(null);
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [address]);

    return (
        <SocketContext.Provider value={{ socket, onlinePlayers }}>
            {children}
        </SocketContext.Provider>
    );
};
