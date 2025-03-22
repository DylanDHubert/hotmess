"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };
  
  return (
    <header className="glass-nav border-b border-white/20 dark:border-gray-700/30 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full overflow-hidden flex items-center justify-center shadow-md transition-transform group-hover:scale-105 border border-white/30 dark:border-purple-700/30">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SocialApp</h1>
          </Link>
          
          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {status === "authenticated" ? (
              <>
                <Link 
                  href="/profile" 
                  className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all px-3 py-1.5 rounded-md hover:bg-white/10 hover:backdrop-blur-md dark:hover:bg-gray-700/30"
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="font-medium">
                    {session.user.name?.split(' ')[0] || "Profile"}
                  </span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-white/10 hover:backdrop-blur-md dark:hover:bg-gray-700/30 transition-all"
                  aria-label="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="glass-button px-4 py-2 text-gray-700 dark:text-gray-300 border border-white/30 dark:border-gray-600/30 rounded-lg font-medium hover:bg-white/10 transition-all"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="glass-button-primary px-4 py-2 bg-gradient-to-r from-blue-600/90 to-blue-700/90 backdrop-blur-sm text-white rounded-lg font-medium hover:from-blue-700/90 hover:to-blue-800/90 transition-all shadow-md border border-white/10 dark:border-blue-500/30"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 