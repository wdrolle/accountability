import Image from "next/image";

type propsType = {
  subTitle?: string;
  title: string;
  paragraph: string;
  center?: boolean;
  icon?: string;
  titleClass?: string;
  paragraphClass?: string;
};

const SectionTitle = ({
  subTitle,
  title,
  paragraph,
  icon = "/images/hero/icon-title.svg",
  center = true,
  titleClass = "text-white dark:text-white light:text-white",
  paragraphClass = "text-gray-400 dark:text-gray-400 light:text-white/80 "
}: propsType) => {
  return (
    <div 
      className="wow fadeInUp text-center relative rounded-xl bg-white/10 dark:bg-transparent light:bg-white p-8 mb-16 border dark:border-white/[0.1] light:border-white shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all bg-[url(/images/cta/grid.svg)] bg-cover bg-center bg-no-repeat"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
        boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
      }}
    >
      <div className={`relative z-10 ${center ? "text-center" : ""}`}>
        {subTitle && (
          <span className="hero-subtitle-gradient hover:hero-subtitle-hover relative mb-5 inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium">
            <Image src={icon} alt="icon" width={16} height={16} className="h-4 w-4 light:filter-none dark:filter-invert" />
            <span className="hero-subtitle-text light:text-white dark:text-white light:text-white">
              {subTitle}
            </span>
          </span>
        )}
        <h2 className={`mb-4.5 text-2xl font-extrabold sm:text-4xl xl:text-heading-2 ${titleClass} transform hover:-translate-y-0.5 transition-transform`}>
          {title}
        </h2>
        <p className={`mx-auto max-w-[714px] font-medium ${paragraphClass} transform hover:-translate-y-0.5 transition-transform`}>
          {paragraph}
        </p>
      </div>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
    </div>
  );
};

export default SectionTitle;
