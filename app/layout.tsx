import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhenWasIt - Historical Events Game",
  description: "Guess when historical events happened!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
