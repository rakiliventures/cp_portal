import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CP — Catholic Professionals",
  description: "Catholic Professional group portal: membership, finance, events, and reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
