import Image from "next/image";
import Link from "next/link";

const FeaturesList = () => {
  return (
    <section className="pt-12.5">
      <div className="mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0">
        <div className="grid gap-7.5 sm:grid-cols-12">
          {/* <!-- features item --> */}
          <div className="sm:col-span-12">
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
                <div className="relative z-20 flex items-center justify-between">
                  <div className="w-full max-w-[477px]">
                    <span className="hero-subtitle-gradient relative mb-4 inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium">
                      <Image
                        src="/images/hero/icon-title.svg"
                        alt="icon"
                        width={16}
                        height={16}
                      />

                      <span className="hero-subtitle-text text-white dark:text-white light:text-black">
                        CStudios Inspiration
                      </span>
                    </span>
                    <h3 className="mb-4.5 text-heading-4 font-bold text-white dark:text-white light:text-black transform hover:-translate-y-0.5 transition-transform">
                      Daily Biblical Wisdom
                    </h3>
                    <p className="mb-10 font-medium text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform">
                      Receive CStudios messages and reflections delivered right to you. Join our community of believers seeking spiritual growth and divine inspiration.
                    </p>

                    <Link
                      href="/auth/signup"
                      className="hero-button-gradient inline-flex rounded-lg px-7 py-3 font-medium text-white dark:text-white light:text-black duration-300 ease-in hover:opacity-80 transform hover:-translate-y-0.5 transition-transform"
                    >
                      Get Started
                    </Link>
                  </div>

                  <div className="relative hidden aspect-square w-full max-w-[428px] sm:block">
                    <Image
                      src="/images/features/big-icon.svg"
                      alt="icon"
                      fill
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <!-- features item --> */}
          <div className="sm:col-span-7">
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
                <span className="icon-border relative mx-auto mb-13.5 inline-flex h-20 w-full max-w-[80px] items-center justify-center rounded-full transform hover:scale-105 transition-transform">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/20" />
                  <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                  <div className="absolute inset-[1px] rounded-full ring-1 ring-white/10 shadow-inner" />
                  <div className="absolute inset-0 rounded-full shadow-lg" />
                  <Image
                    src="/images/features/icon-05.svg"
                    alt="icon"
                    width={32}
                    height={32}
                    className="relative z-10 drop-shadow-lg"
                  />
                </span>

                <h3 className="mb-4.5 text-heading-6 font-semibold text-white dark:text-white light:text-black transform hover:-translate-y-0.5 transition-transform">
                  Personalized Daily Messages
                </h3>
                <p className="font-medium text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform">
                  Start each day with carefully selected scripture verses and thoughtful reflections tailored to provide guidance and spiritual nourishment.
                </p>
              </div>
            </div>
          </div>

          {/* <!-- features item --> */}
          <div className="sm:col-span-5">
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
                <span className="icon-border relative mx-auto mb-13.5 inline-flex h-20 w-full max-w-[80px] items-center justify-center rounded-full transform hover:scale-105 transition-transform">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/20" />
                  <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                  <div className="absolute inset-[1px] rounded-full ring-1 ring-white/10 shadow-inner" />
                  <div className="absolute inset-0 rounded-full shadow-lg" />
                  <Image
                    src="/images/features/icon-07.svg"
                    alt="icon"
                    width={32}
                    height={32}
                    className="relative z-10 drop-shadow-lg"
                  />
                </span>

                <h3 className="mb-4.5 text-heading-6 font-semibold text-white dark:text-white light:text-black transform hover:-translate-y-0.5 transition-transform">
                  Customized Spiritual Journey
                </h3>
                <p className="font-medium text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform">
                  Choose your preferred agents version, topics of interest, and delivery time. Make your CStudios experience uniquely meaningful to your spiritual path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesList;
