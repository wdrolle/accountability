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

  // Pages where only footer should be hidden
  const hideFooter = pathname === '/ai-agents';

  return (
    <Providers>
      <ThemeProvider>
        <NextTopLoader
          color="#8646F4"
          crawlSpeed={300}
          showSpinner={false}
          shadow="none"
        />
        <AuthProvider>
          <ToasterContext />
          {!hideAll && <Header />}
          <main className="min-h-screen">
            {children}
          </main>
          {!hideAll && !hideFooter && (
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