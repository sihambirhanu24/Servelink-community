import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/providers/QueryProvider";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from "sonner";
import { ProtectedActionModal } from "@/components/verification/ProtectedActionModal";
import { VerificationRequiredModal } from "@/components/community/VerificationRequiredModal";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "ServeLink",
  description: "Connect. Collaborate. Grow.",
};

export default function RootLayout({
  children,
  
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
  <AuthProvider>
    <QueryProvider>
      <NotificationProvider>
        {children}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          duration={5000}
          offset="80px"
          className="pointer-events-none"
          toastOptions={{
            style: { pointerEvents: 'auto' },
            className: 'max-w-[420px] w-full sm:w-[400px]',
          }}
        />
        <ProtectedActionModal />
        <VerificationRequiredModal />
      </NotificationProvider>
    </QueryProvider>
  </AuthProvider>
</body>
    </html>
  );
}
