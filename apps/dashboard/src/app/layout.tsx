import type { Metadata } from "next";
import "./globals.css";
import { Background } from "@/components/Background";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "AICOS — AI Autonomous Content OS",
  description:
    "A lean, cost-disciplined autonomous content operating system. Research, generate, approve, publish, analyze, learn.",
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
          <div className="mx-auto flex max-w-[1600px]">
            <Sidebar />
            <main className="min-w-0 flex-1 px-4 pb-16 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
