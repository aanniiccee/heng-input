import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Form System",
  description: "Verify admin invite code with LINE LIFF and Google Sheets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
