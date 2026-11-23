"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import DropDown from "./DropDown";
import menuData from "./menuData";
import { ThemeToggle } from '@/components/ThemeToggle';
import { Menu } from "@/types/menu";

const adminMenu: Menu = {
  id: 999,
  title: "Admin",
  newTab: false,
  submenu: [
    {
      id: 9991,
      title: "Studio",
      newTab: false,
      path: "/admin",
    },
    {
      id: 9992,
      title: "Console",
      newTab: false,
      path: "/admin-console",
    }
  ],
};

const Header = () => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const { data: session } = useSession();
  const pathUrl = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setStickyMenu(window.scrollY >= 16);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setNavigationOpen(false);
  }, [pathUrl]);

  useEffect(() => {
    document.body.style.overflow = navigationOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navigationOpen]);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "https://amorolle.com/login",
      redirect: true
    });
  };

  const visibleMenuItems = menuData.filter(item => !item.hideIfNotAuth || session);

  const authControls = (
    <>
      <ThemeToggle />
      {session ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <button
            onClick={handleSignOut}
            className="button-border-gradient hover:button-gradient-hover relative flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm text-foreground shadow-button hover:shadow-none dark:text-white"
          >
            Sign Out
          </button>
          {session.user?.is_super_admin === true && (
            <DropDown menuItem={adminMenu} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Link
            href="/api/auth/hub-signin?next=/journal"
            className="text-sm font-medium text-black hover:text-gray-700 dark:text-white"
          >
            Log In
          </Link>
          <Link
            href="/api/auth/hub-signin?next=/journal"
            className="button-border-gradient hover:button-gradient-hover relative flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm text-foreground shadow-button hover:shadow-none dark:text-white"
          >
            Sign Up
          </Link>
        </div>
      )}
    </>
  );

  return (
    <header
      className={`fixed left-0 top-0 z-[1000] w-full ${
        stickyMenu || navigationOpen
          ? "bg-white/95 shadow backdrop-blur-lg dark:bg-dark/95"
          : "bg-white/90 backdrop-blur-md dark:bg-dark/90"
      }`}
    >
      <div className="w-full border-b border-foreground/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto flex max-w-[1170px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold text-black dark:text-white"
          >
            Amorolle Journal
          </Link>

          <nav className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-6">
            <ul className="flex items-center gap-2">
              {visibleMenuItems.map((menuItem, index) => (
                <li key={`${menuItem.title}-${index}`} className="nav__menu whitespace-nowrap">
                  {menuItem.submenu ? (
                    <DropDown menuItem={menuItem} />
                  ) : (
                    <Link
                      href={`${menuItem.path}`}
                      className={`hover:nav-gradient relative border border-transparent px-3 py-1.5 text-sm text-black hover:text-white dark:text-white/80 ${
                        pathUrl === menuItem.path ? "nav-gradient text-white" : ""
                      }`}
                    >
                      {menuItem.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">{authControls}</div>
          </nav>

          <button
            type="button"
            onClick={() => setNavigationOpen(!navigationOpen)}
            aria-expanded={navigationOpen}
            aria-label={navigationOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white lg:hidden"
          >
            {navigationOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {navigationOpen && (
          <nav className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-foreground/[0.08] px-4 py-4 dark:border-white/[0.08] lg:hidden">
            <ul className="flex flex-col gap-1">
              {visibleMenuItems.map((menuItem, index) => (
                <li key={`${menuItem.title}-mobile-${index}`}>
                  {menuItem.submenu ? (
                    <DropDown menuItem={menuItem} />
                  ) : (
                    <Link
                      href={`${menuItem.path}`}
                      className={`block rounded-lg px-3 py-3 text-base text-black dark:text-white ${
                        pathUrl === menuItem.path ? "bg-black text-white dark:bg-white/15" : ""
                      }`}
                    >
                      {menuItem.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-3 border-t border-foreground/[0.08] pt-4 dark:border-white/[0.08]">
              {authControls}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
