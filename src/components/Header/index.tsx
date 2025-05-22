"use client";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import logo from "../../../public/images/logo/agents.png";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  const { data: session } = useSession();
  const pathUrl = usePathname();

  // Sticky menu and collapse handling
  const handleScroll = () => {
    if (window.scrollY >= 80) {
      setStickyMenu(true);
      if (window.scrollY >= 300) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    } else {
      setStickyMenu(false);
      setIsCollapsed(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close navigation when path changes
  useEffect(() => {
    setNavigationOpen(false);
  }, [pathUrl]);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/',
      redirect: true
    });
  };

  // Filter menu items based on auth status
  const visibleMenuItems = menuData.filter(item => !item.hideIfNotAuth || session);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed right-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-purple text-white shadow-lg hover:opacity-90"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    );
  }

  return (
    <header
      className={`fixed left-0 top-0 z-[1000] items-center w-full ${
        stickyMenu
          ? "bg-white/95 dark:bg-dark/95 shadow backdrop-blur-lg transition duration-100"
          : "bg-transparent dark:bg-dark/95 pr-30"
          
      }`}
    >
      <div className="w-full border-b border-foreground/[0.08] dark:border-white/[0.08] bg-inherit">
        <div className="relative mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0">  
          <div className="flex items-center justify-between py-0 lg:py-2 pl-4">
            <div className="flex flex-1 items-center justify-end pr-11">
            <div className="flex w-[180px] items-center justify-start pl-1">
              {/* <Link href="/">
                <Image 
                  src={logo} 
                  alt="Logo" 
                  width={60} 
                  height={10} 
                  className="w-[100px] object-contain"
                  priority
                />
              </Link> */}
            </div>
              <div
                className={`absolute left-0 top-full w-full bg-white/95 dark:bg-dark/95 px-4 py-3 shadow lg:static lg:flex lg:w-auto lg:justify-between lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none ${
                  navigationOpen ? "block" : "hidden"
                }`}
              >
                <nav>
                  <ul className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
                    {visibleMenuItems.map((menuItem, index) => (
                      <li
                        key={`${menuItem.title}-${index}`}
                        className={`nav__menu group relative whitespace-nowrap ${
                          stickyMenu ? "lg:py-4" : "lg:py-7"
                        }`}
                      >
                        {menuItem.submenu ? (
                          <DropDown menuItem={menuItem} />
                        ) : (
                          <Link
                            href={`${menuItem.path}`}
                            className={`hover:nav-gradient relative border border-transparent px-4 py-1.5 text-sm text-foreground hover:text-white dark:text-white/80 ${
                              pathUrl === menuItem.path
                                ? "nav-gradient text-white"
                                : ""
                            }`}
                          >
                            {menuItem.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="mt-7 flex items-center gap-4 lg:mt-0">
                  <ThemeToggle />
                  {session ? (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSignOut}
                        className="button-border-gradient hover:button-gradient-hover relative flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm text-foreground dark:text-white shadow-button hover:shadow-none"
                      >
                        Sign Out
                      </button>
                      {session.user?.is_super_admin === true && (
                        <div className="pl-2 pr-[10px]">
                          <DropDown menuItem={adminMenu} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="border-r border-foreground/[0.12] dark:border-white/[0.12] pr-4 text-sm font-medium text-foreground hover:text-purple dark:text-white"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="button-border-gradient hover:button-gradient-hover relative flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm text-foreground dark:text-white shadow-button hover:shadow-none"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setNavigationOpen(!navigationOpen)}
                className="ml-4 flex h-7 w-7 items-center justify-center rounded-full bg-purple text-white lg:hidden"
              >
                <svg
                  className="fill-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 14.9999H1C0.734784 14.9999 0.48043 14.8946 0.292893 14.707C0.105357 14.5195 0 14.2651 0 13.9999C0 13.7347 0.105357 13.4803 0.292893 13.2928C0.48043 13.1052 0.734784 12.9999 1 12.9999H15C15.2652 12.9999 15.5196 13.1052 15.7071 13.2928C15.8946 13.4803 16 13.7347 16 13.9999C16 14.2651 15.8946 14.5195 15.7071 14.707C15.5196 14.8946 15.2652 14.9999 15 14.9999ZM15 8.99989H1C0.734784 8.99989 0.48043 8.89453 0.292893 8.707C0.105357 8.51946 0 8.26511 0 7.99989C0 7.73468 0.105357 7.48032 0.292893 7.29279C0.48043 7.10525 0.734784 6.99989 1 6.99989H15C15.2652 6.99989 15.5196 7.10525 15.7071 7.29279C15.8946 7.48032 16 7.73468 16 7.99989C16 8.26511 15.8946 8.51946 15.7071 8.707C15.5196 8.89453 15.2652 8.99989 15 8.99989ZM15 2.99989H1C0.734784 2.99989 0.48043 2.89453 0.292893 2.707C0.105357 2.51946 0 2.26511 0 1.99989C0 1.73468 0.105357 1.48032 0.292893 1.29279C0.48043 1.10525 0.734784 0.999893 1 0.999893H15C15.2652 0.999893 15.5196 1.10525 15.7071 1.29279C15.8946 1.48032 16 1.73468 16 1.99989C16 2.26511 15.8946 2.51946 15.7071 2.707C15.5196 2.89453 15.2652 2.99989 15 2.99989Z"
                    fill=""
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
