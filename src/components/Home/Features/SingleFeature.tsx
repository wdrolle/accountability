import { Feature } from "@/types/feature";
import Image from "next/image";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  return (
    <div 
      className="relative rounded-xl bg-[url(/images/cta/grid.svg)] bg-cover bg-center bg-no-repeat p-8 border dark:border-white/[0.1] light:border-black/[0.1] shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
    >
      <div className="absolute inset-0 rounded-xl bg-white/10 dark:bg-dark/40 light:bg-white/10" />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5" 
        style={{
          boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
        }}
      />
      <div className="relative z-10">
        <div className="flex flex-col gap-2.5">
          <div className="icon-border relative mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full">
            <Image
              src={feature.icon}
              alt={feature.title}
              width={32}
              height={32}
              className={`${feature.rotate ? "rotate-[30deg]" : ""}`}
            />
          </div>
          <h3 className="mb-4 text-center text-heading-6 font-bold text-white dark:text-white light:text-black transform hover:-translate-y-0.5 transition-transform">
            {feature.title}
          </h3>
          <p className="text-center text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SingleFeature;
