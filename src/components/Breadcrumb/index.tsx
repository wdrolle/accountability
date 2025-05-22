// src/components/Breadcrumb/index.tsx

import Link from "next/link";

type BreadcrumbProps = {
  pageTitle: string;
  items?: { label: string; href: string }[];
  className?: string;
};

const Breadcrumb = ({ pageTitle, items = [], className = '' }: BreadcrumbProps) => {
  const allItems = [
    { label: 'Home', href: '/' },
    ...items
  ];

  return (
    <section className={`relative z-10 pb-5 pt-20 lg:pt-30 xl:pt-30 sm:pt-20 ${className}`}>
      <div className="absolute left-0 top-25 -z-10 flex w-full flex-col gap-3 opacity-50">
        <div className="h-[1.24px] w-full bg-gradient-to-r from-light-4 to-light-7 dark:footer-bg-gradient"></div>
        <div className="h-[2.47px] w-full bg-gradient-to-r from-light-4 to-light-7 dark:footer-bg-gradient"></div>
        <div className="h-[3.71px] w-full bg-gradient-to-r from-light-4 to-light-7 dark:footer-bg-gradient"></div>
        <div className="h-[4.00px] w-full bg-gradient-to-r from-light-4 to-light-9 dark:footer-bg-gradient"></div>
        <div className="h-[6.19px] w-full bg-gradient-to-r from-light-4 to-light-9 dark:footer-bg-gradient"></div>
        <div className="h-[7.42px] w-full bg-gradient-to-r from-light-4 to-light-9 dark:footer-bg-gradient"></div>
      </div>
      <div className="absolute bottom-0 left-0 -z-10 h-60 w-full bg-gradient-to-b from-light/0 to-light-2 dark:from-dark/0 dark:to-dark"></div>

      <div className="relative z-10 px-2">
        <div className="mx-auto max-w-[1170px] flex flex-col items-center">
          <h1 className="text-heading-2 font-extrabold text-black dark:text-white mb-4">
            {pageTitle}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm">
            {allItems.map((item, index) => (
              <div key={item.href} className="flex items-center gap-2">
                <Link 
                  href={item.href}
                  className="text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
                <span className="text-black/60 dark:text-white/60">/</span>
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
