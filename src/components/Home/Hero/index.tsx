import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <section
      id="home"
      className="relative z-10 overflow-hidden pt-35 md:pt-40 xl:pt-45"
    >
      {/* <!-- Hero Bg Shapes --> */}
      <div className="mx-auto max-w-7xl">
        <div className="pointer-events-none absolute inset-0 -z-10 -mx-28 overflow-hidden">
          <div className="-u-z-10 hero-circle-gradient absolute -top-[128%] left-1/2 -z-1 h-[1282px] w-full max-w-[1282px] -translate-x-1/2 rounded-full sm:-top-[107%] xl:-top-[73%]"></div>
          <div className="-u-z-10 hero-circle-gradient absolute -top-[112%] left-1/2 -z-1 h-[1046px] w-full max-w-[1046px] -translate-x-1/2 rounded-full sm:-top-[93%] xl:-top-[62%]"></div>
          <div className="-u-z-10 absolute left-1/2 top-0 aspect-[1204/394] w-full max-w-[1204px] -translate-x-1/2">
            <Image
              src="/images/blur/blur-02.svg"
              alt="blur"
              fill
              className="max-w-none"
            />
          </div>
          <div className="-u-z-10 absolute left-1/2 top-0 h-full w-full -translate-x-1/2 bg-[url(/images/blur/blur-01.svg)] bg-cover bg-top bg-no-repeat"></div>
        </div>
      </div>

      {/* <!-- Hero Content --> */}
      <div className="relative z-1 mx-auto max-w-[900px] px-4 sm:px-8 xl:px-0">
        <div 
          className="text-center relative rounded-xl bg-[url(/images/cta/grid.svg)] bg-cover bg-center bg-no-repeat p-8 border dark:border-white/[0.1] light:border-black/[0.1] shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          <div className="absolute inset-0 rounded-xl bg-white/10 dark:bg-dark/40 light:bg-white/10" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5" 
            style={{
              boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
            }}
          />
          <div className="relative z-10">
            <span className="hero-subtitle-gradient hover:hero-subtitle-hover relative mb-5 inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium">
              <Image
                src="/images/hero/icon-title.svg"
                alt="icon"
                width={16}
                height={16}
                className="h-4 w-4"
              />
              <span className="hero-subtitle-text text-white dark:text-white light:text-black">
                CStudios Messages
              </span>
            </span>
            <h1 className="mb-6 text-3xl font-extrabold text-white dark:text-white light:text-black sm:text-5xl xl:text-heading-1 transform hover:-translate-y-0.5 transition-transform">
              Connect with Scripture, Family & Friends Through AI-Enhanced Discussions
            </h1>
            <p className="mx-auto mb-9 max-w-[600px] font-medium md:text-lg text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform">
              Receive CStudios messages via SMS, engage in meaningful discussions 
              with loved ones, and use AI-powered insights to deepen your understanding. 
              Share, reflect, and grow together in faith and knowledge.
            </p>

            <div className="flex justify-center gap-4">
              <Link
                href="/auth/signup"
                className="hero-button-gradient inline-flex rounded-lg px-7 py-3 font-medium light:text-white dark:text-white light:text-black duration-300 ease-in hover:opacity-80 transform hover:-translate-y-0.5 transition-transform"
              >
                Start Your Journey
              </Link>
              <Link
                href="/blog"
                className="inline-flex rounded-lg border border-white/20 px-7 py-3 font-medium text-white dark:text-white light:text-black duration-300 ease-in hover:bg-white/10 transform hover:-translate-y-0.5 transition-transform"
              >
                Read Blog
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-10 pr-6 grid grid-cols-3 gap-x-3 gap-y-1 px-2 text-center max-w-3xl">
        {/* Row 1 - Titles */}
        <div className="text-center">
          <span className="text-lg md:text-2xl lg:text-3xl font-bold text-white dark:text-white light:text-black">Daily</span>
        </div>
        <div className="text-center">
          <span className="text-lg md:text-2xl lg:text-3xl font-bold text-white dark:text-white light:text-black">AI-Powered</span>
        </div>
        <div className="text-center">
          <span className="text-lg md:text-2xl lg:text-3xl font-bold text-white dark:text-white light:text-black">Community</span>
        </div>
        
        {/* Row 2 - Subtitles */}
        <div className="text-center">
          <span className="text-xs md:text-sm lg:text-base text-white/70 dark:text-white/70 light:text-black/80">Scripture SMS</span>
        </div>
        <div className="text-center">
          <span className="text-xs md:text-sm lg:text-base text-white/70 dark:text-white/70 light:text-black/80">Discussions</span>
        </div>
        <div className="text-center">
          <span className="text-xs md:text-sm lg:text-base text-white/70 dark:text-white/70 light:text-black/80">Sharing</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
