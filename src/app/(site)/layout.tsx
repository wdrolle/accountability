"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import NextTopLoader from "nextjs-toploader";
import "../../styles/animate.css";
import "../../styles/prism-vsc-dark-plus.css";
import "../../styles/star.css";
import "../../styles/tailwind.css";
import AuthProvider from "../context/AuthContext";
import ToasterContext from "../context/ToastContext";
import HubAutoSignIn from "@/components/Auth/HubAutoSignIn";
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation';
import { Providers } from "../providers";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Pages where both header and footer should be hidden
  const hideAll = pathname === '/auth/verify' || 
                 pathname === '/privacy' || 
                 pathname === '/terms';

  return (
    <Providers>
      <ThemeProvider>
        <NextTopLoader
          color="#111111"
          crawlSpeed={300}
          showSpinner={false}
          shadow="none"
        />
        <AuthProvider>
          <ToasterContext />
          <HubAutoSignIn />
          {!hideAll && <Header />}
          <main className="min-h-screen overflow-x-hidden">
            {children}
          </main>
          {!hideAll && (
            <>
              <Footer />
              <ThemeToggle />
            </>
          )}
          <ScrollToTop />
        </AuthProvider>
      </ThemeProvider>
    </Providers>
  );
}