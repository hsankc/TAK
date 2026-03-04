import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Home, TrendingUp, Calendar as CalendarIcon, Target, BookOpen, UtensilsCrossed, Timer } from "lucide-react";
import PushNotificationManager from "@/components/PushNotificationManager";
import MobileNav from "@/components/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tak - Günlük Organizasyon",
  description: "Fırsatları yakala, günlük organize ol",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/opportunities", label: "Fırsatlar", icon: TrendingUp },
  { href: "/schedule", label: "Ders Programı", icon: BookOpen },
  { href: "/pomodoro", label: "Pomodoro", icon: Timer },
  { href: "/todos", label: "Hedefler", icon: Target },
  { href: "/calendar", label: "Takvim", icon: CalendarIcon },
  { href: "/yemek", label: "Yemekhane", icon: UtensilsCrossed },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#030712] text-white`}
      >
        <div className="flex min-h-screen">
          {/* Desktop Sidebar — hidden on mobile */}
          <aside className="hidden md:flex w-64 bg-gray-950/80 backdrop-blur-xl border-r border-white/5 p-6 flex-col fixed top-0 left-0 h-screen z-40">
            <Link href="/" className="mb-8">
              <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tighter">
                Tak
              </h2>
            </Link>

            <nav className="space-y-1 flex-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 text-sm font-medium">
                  <link.icon size={18} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            <div className="text-[10px] text-gray-600 mt-8 font-mono tracking-wider">
              <p>TAK v2.0</p>
              <p className="mt-1">© 2026</p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto md:ml-64 pt-14 md:pt-0">
            {children}
          </main>
        </div>

        {/* Mobile Nav (hamburger + drawer) */}
        <MobileNav />

        {/* Global UI Overlays */}
        <PushNotificationManager />
      </body>
    </html>
  );
}
