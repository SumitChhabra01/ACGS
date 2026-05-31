import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Background } from "@/components/Background";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "AICOS — AI Autonomous Content OS",
  description:
    "A lean, cost-disciplined autonomous content operating system. Research, generate, approve, publish, analyze, learn.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Background />
        <div className="grid-overlay min-h-screen">
          <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <MobileHeader />
              <main className="min-w-0 flex-1 px-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pb-20 lg:px-8 lg:pb-16 lg:pt-0">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
