import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jellybean Parliament",
  description: "A weekly interactive wisdom-of-crowds estimation experiment.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
