// src/components/Breadcrumb/index.tsx

import Link from "next/link";

type BreadcrumbProps = {
  pageTitle: string;
  items?: { label: string; href: string }[];
  className?: string;
  align?: 'center' | 'left';
};

const Breadcrumb = ({ pageTitle, items = [], className = '', align = 'center' }: BreadcrumbProps) => {
  const allItems = [
    { label: 'Home', href: '/' },
    ...items
  ];
  const isLeft = align === 'left';

  return (
    <section className={`relative z-10 bg-transparent px-4 pb-3 pt-18 sm:pt-20 lg:pt-22 ${className}`}>
      <div className="relative z-10">
        <div
          className={`mx-auto flex max-w-[1170px] flex-col ${
            isLeft ? 'max-w-5xl items-start text-left' : 'items-center text-center'
          }`}
        >
          <h1
            className={`mb-2 break-words font-extrabold text-black dark:text-white ${
              isLeft ? 'text-2xl sm:text-3xl' : 'text-2xl sm:text-heading-2'
            }`}
          >
            {pageTitle}
          </h1>
          <div className={`flex flex-wrap items-center gap-2 text-sm ${isLeft ? 'justify-start' : 'justify-center'}`}>
            {allItems.map((item) => (
              <div key={item.href} className="flex items-center gap-2">
                <Link
                  href={item.href}
                  className="text-black transition-colors hover:text-black dark:text-white/80 dark:hover:text-white"
                >
                  {item.label}
                </Link>
                <span className="text-black dark:text-white/80">/</span>
              </div>
            ))}
            <span className="text-black dark:text-white">{pageTitle}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Breadcrumb;
