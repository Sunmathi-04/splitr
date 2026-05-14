/*"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { Authenticated, Unauthenticated } from "convex/react";
import { LayoutDashboard } from "lucide-react";

const Header = () => {
  const path = usePathname();

  return (
    <header className="fixed top-0 w-full border-b bg-white/95 backdrop-blur z-50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo.png"
            alt="Splitr Logo"
            width={200}
            height={60}
            className="h-11 w-auto object-contain"
          />
        </Link>

        {path === "/" && (
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-green-600">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-green-600">
              How it works
            </Link>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Authenticated>
            <Link href="/dashboard" className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Authenticated>

          <Unauthenticated>
            <SignInButton>
              <Button variant="ghost">Sign In</Button>
            </SignInButton>

            <SignUpButton>
              <Button className="bg-green-600 hover:bg-green-700 border-none">
                Get Started
              </Button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      </nav>
    </header>
  );
};

export default Header;
*/
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="fixed top-0 w-full border-b bg-white/90 backdrop-blur z-50">
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="text-2xl font-bold text-green-600">
          Splitr
        </Link>

        {/* CENTER LINKS */}
        <div className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="#features">Features</Link>
          <Link href="#how-it-works">How It Works</Link>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">

          {/* BEFORE SIGN IN */}
          <SignedOut>
            <SignInButton mode="redirect">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>

            <SignUpButton mode="redirect">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>

          {/* AFTER SIGN IN */}
         <SignedIn>
  <Button
    asChild
    variant="outline"
    className="hidden md:flex items-center gap-2"
  >
    <Link href="/dashboard">
      <LayoutDashboard className="h-4 w-4" />
      Dashboard
    </Link>
  </Button>

  {/* Mobile dashboard icon */}
  <Link href="/dashboard" className="md:hidden">
    <LayoutDashboard className="h-6 w-6" />
  </Link>

  <UserButton afterSignOutUrl="/" />
</SignedIn>


        </div>
      </nav>
    </header>
  );
}
