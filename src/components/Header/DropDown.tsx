import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu } from "@/types/menu";

const DropDown = ({ menuItem }: { menuItem: Menu }) => {
  const [dropdownToggler, setDropdownToggler] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathUrl = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownToggler(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {menuItem.title !== "Pages" ? (
        <Link
          onClick={() => setDropdownToggler(!dropdownToggler)}
          className={`hover:nav-gradient relative flex items-center justify-between gap-3 border border-transparent px-4 py-1.5 text-sm hover:text-black dark:hover:text-white ${
            pathUrl === menuItem.path
              ? "nav-gradient text-black dark:text-white"
              : "text-black/80 dark:text-white/80"
          }`}
          href={`${menuItem.path ? menuItem.path : "#"}`}
        >
          {menuItem.title}
          <span className={`transition-transform duration-200 ${dropdownToggler ? 'rotate-180' : ''}`}>
            <svg
              className="h-3 w-3 cursor-pointer fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
            </svg>
          </span>
        </Link>
      ) : (
        <button
          onClick={() => setDropdownToggler(!dropdownToggler)}
          className={`hover:nav-gradient relative flex items-center justify-between gap-3 border border-transparent px-4 py-1.5 text-sm hover:text-black dark:hover:text-white ${
            pathUrl === menuItem.path
              ? "nav-gradient text-black dark:text-white"
              : "text-black/80 dark:text-white/80"
          }`}
        >
          {menuItem.title}
          <span className={`transition-transform duration-200 ${dropdownToggler ? 'rotate-180' : ''}`}>
            <svg
              className="h-3 w-3 cursor-pointer fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
            </svg>
          </span>
        </button>
      )}

      <ul
        className={`absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-lg bg-white dark:bg-gray-900 shadow-lg transition-all duration-300 ease-in-out
          ${dropdownToggler ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none"}
          border border-gray-100 dark:border-gray-800
          backdrop-blur-lg backdrop-filter
          dark:bg-opacity-90 bg-opacity-90`}
      >
        {menuItem?.submenu &&
          menuItem?.submenu.map((item, key) => (
            <li key={key}>
              <Link
                href={item.path || "#"}
                className={`flex rounded-md px-4 py-2 text-sm 
                  text-gray-700 dark:text-gray-200
                  transition-colors duration-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  hover:text-black dark:hover:text-white
                  border border-transparent
                  hover:border-gray-200 dark:hover:border-gray-700`}
              >
                {item.title}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default DropDown;
