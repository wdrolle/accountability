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
    <div ref={dropdownRef} className="relative w-full lg:w-auto">
      <button
        type="button"
        onClick={() => setDropdownToggler(!dropdownToggler)}
        className={`hover:nav-gradient relative flex w-full items-center justify-between gap-3 border border-transparent px-3 py-3 text-base hover:text-black dark:hover:text-white lg:w-auto lg:px-4 lg:py-1.5 lg:text-sm ${
          pathUrl === menuItem.path
            ? "nav-gradient text-black dark:text-white"
            : "text-black dark:text-white/80"
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

      <ul
        className={`${dropdownToggler ? "block" : "hidden"} static z-50 mt-1 w-full rounded-lg border border-gray-200/70 bg-white/80 p-1 backdrop-blur-md dark:border-white/15 dark:bg-dark-6/80 lg:absolute lg:left-0 lg:top-full lg:mt-2 lg:min-w-[200px]`}
      >
        {menuItem?.submenu &&
          menuItem?.submenu.map((item, key) => (
            <li key={key}>
              <Link
                href={item.path || "#"}
                className="flex rounded-md px-4 py-2.5 text-sm text-black transition-colors duration-200 hover:bg-white/50 dark:text-white dark:hover:bg-white/10"
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
