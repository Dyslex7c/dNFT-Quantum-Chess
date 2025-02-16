"use client";

import type React from "react";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Lenis from "lenis";
import { Button } from "@/components/ui/button";
import { ChevronRight, Image, ShieldHalf } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";

export default function Home() {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const navigation = useRouter();

  useEffect(() => {
    // Initialize smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // GSAP animations
    const tl = gsap.timeline();

    tl.from(heroRef.current, {
      opacity: 0,
      duration: 1,
      y: 100,
      ease: "power4.out",
    }).from(
      textRef.current,
      {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power4.out",
      },
      "-=0.5"
    );

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0a0f18] to-black text-white overflow-hidden">
      <div className="relative container mx-auto px-4 py-20 md:py-32">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px]" />

        {/* Connect Button */}
        <div className="absolute top-4 right-4 z-20">
          <ConnectButton />
        </div>

        {/* Hero section */}
        <div
          ref={heroRef}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Checkmate your way to
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              crypto glory
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white text-opacity-80 mb-8">
            Etheredrez, Immortalize your victories in NFTs
          </p>

          <Button
            onClick={() => navigation.push("/play")}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-8 py-6 text-lg rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] transition-all duration-300"
          >
            Enter Dapp
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features section */}
        <div
          ref={textRef}
          className="relative z-10 mt-20 md:mt-32 max-w-2xl mx-auto"
        >
          <div className="grid gap-6">
            <Feature
              title="Stake & Win"
              description="Stake your crypto in matches. Winners take it all."
              icon="♔"
            />
            <Feature
              title="Anti-Cheating & Security"
              description="Our proof system powered by zero-knowledge technology ensures every move and user is genuine"
              icon={<ShieldHalf />}
            />
            <Feature
              title="NFT Rewards"
              description="Each victory mints a unique chess piece"
              icon={<Image />}
            />
            <Feature
              title="Tournament"
              description="Where legends are made and immortalized on-chain"
              icon="♗"
            />
          </div>
        </div>

        {/* Chess piece decoration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30 hidden lg:block">
          <div className="relative w-[600px] h-[600px]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-blue-500/20 blur-2xl rounded-full" />
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
    <div className="group p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="text-2xl text-blue-400">{icon}</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">
            {title}
          </h3>
          <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
