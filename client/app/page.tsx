"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Lenis from "lenis";
import { Button } from "@/components/ui/button";
import { ChevronRight, Shield, Trophy, Users, Sparkles, GripHorizontal } from 'lucide-react';
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useSocketContext } from "@/context/SocketContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const navigation = useRouter();
  const { onlinePlayers } = useSocketContext();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Initialize smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Enhanced GSAP animations
    const tl = gsap.timeline();

    tl.from(heroRef.current, {
      opacity: 0,
      duration: 1.2,
      y: 100,
      ease: "power4.out",
    })
    .from(textRef.current, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power4.out",
    }, "-=0.7")
    .from(statsRef.current, {
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: "back.out(1.7)",
    }, "-=0.5");

    // Cleanup
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Enhanced gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#0a0f18] to-black" />
      
      {/* Animated background particles */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-violet-500/20 rounded-full blur-[120px] animate-pulse delay-2000" />
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-32">
        {/* Header with Connect Button */}
        <header className="absolute top-0 left-0 right-0 z-50">
          <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
            </div>
            <ConnectButton />
          </nav>
        </header>

        {/* Hero section with fixed text visibility */}
        <div ref={heroRef} className="relative z-10 max-w-6xl mx-auto text-center mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="font-bold leading-tight">
              <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 pb-2 text-8xl">
                Checkmate Your Way To
              </span>
              <span className="inline-block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-violet-500 pb-4 text-8xl">
                Crypto Glory
              </span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Compete, win, and immortalize your victories with NFTs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={() => navigation.push("/play")}
              size="lg"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={cn(
                "relative bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700",
                "text-white px-8 py-6 text-lg rounded-full transition-all duration-300",
                "shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]",
                "overflow-hidden group"
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                Enter the Arena
                <ChevronRight className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isHovered ? "translate-x-1" : ""
                )} />
              </span>
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              )} />
            </Button>
          </motion.div>

          {/* Stats Section */}
          <div ref={statsRef} className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <StatCard
                icon={<Users className="w-6 h-6" />}
                value={onlinePlayers.length || 1000}
                label="Online Players"
              />
              <StatCard
                icon={<GripHorizontal className="w-6 h-6" />}
                value="10,000+"
                label="Games Played"
              />
              <StatCard
                icon={<Sparkles className="w-6 h-6" />}
                value="5,000+"
                label="NFTs Minted"
              />
            </div>
          </div>
        </div>

        {/* Features section */}
        <div ref={textRef} className="relative z-10 mt-32 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <Feature
              title="Stake & Win"
              description="Put your skills to the test. Stake crypto, play chess, and claim your rewards. Every match is an opportunity for glory and profit."
              icon="♔"
            />
            <Feature
              title="Secure & Fair Play"
              description="Our zero-knowledge proof system ensures complete fairness and security. Play with confidence knowing every move is verified on-chain."
              icon={<Shield className="w-6 h-6" />}
            />
            <Feature
              title="NFT Rewards"
              description="Transform your victories into unique NFT chess pieces. Each win is immortalized as a digital collectible with its own rarity and value."
              icon={<Trophy className="w-6 h-6" />}
            />
            <Feature
              title="Regular Tournaments"
              description="Compete in weekly tournaments for massive prize pools. Rise through the ranks and become a chess legend on the blockchain."
              icon="♗"
            />
          </div>
        </div>

        {/* Chess piece decoration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block pointer-events-none">
          <div className="relative w-[800px] h-[800px]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-blue-500/20 blur-3xl rounded-full" />
            <img
              src="/knight.png"
              alt="Chess Knight"
              className="relative z-10 w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Powered by section */}
        <div className="absolute bottom-8 right-8">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            Powered by
            <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-red-600">
              Polygon
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl text-blue-400 bg-blue-400/10 p-3 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
            {title}
          </h3>
          <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
          {icon}
        </div>
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
          {value}
        </div>
        <div className="text-sm text-gray-400">
          {label}
        </div>
      </div>
    </motion.div>
  );
}