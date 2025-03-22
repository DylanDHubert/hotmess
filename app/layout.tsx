import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/auth/AuthProvider";
import Header from "./components/layout/Header";
import NavBar from "./components/layout/NavBar";
import { getServerSession } from "next-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SocialApp - Connect and Share",
  description: "A social media platform to connect with friends and share your moments",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col animated-gradient text-gray-900 dark:text-gray-100 custom-scrollbar`}
      >
        <AuthProvider>
          <Header />
          <div className="flex-grow flex flex-col">
            {session && <NavBar />}
            <main className="flex-grow container mx-auto px-4 py-6 md:py-8 mb-16 md:mb-0">
              {children}
            </main>
          </div>
          <footer className="glass-nav border-t border-white/20 dark:border-gray-700/30 py-6 text-center text-gray-600 dark:text-gray-300 text-sm shadow-lg">
            <div className="container mx-auto px-4">
              <p>&copy; {new Date().getFullYear()} SocialApp. All rights reserved.</p>
              <div className="mt-2 flex justify-center space-x-4">
                <a href="#" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">Terms</a>
                <a href="#" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">Privacy</a>
                <a href="#" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">Help</a>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
