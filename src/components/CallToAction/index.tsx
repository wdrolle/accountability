import Link from "next/link";

const CallToAction = () => {
  return (
    <section className="relative z-10 overflow-hidden bg-primary py-10 lg:py-[115px]">
      <div className="container mx-auto">
        <div className="relative overflow-hidden">
          <div className="-mx-4 flex flex-wrap items-center">
            <div className="w-full px-4 lg:w-1/2">
              <div className="mx-auto max-w-[670px] lg:mx-0">
                <h2 className="mb-3.5 text-3xl font-bold light:text-white dark:text-white md:text-[28px] md:leading-tight lg:text-[30px] xl:text-[32px]">
                  Experience Next-Gen AI Conversations
                </h2>
                <p className="mb-2 text-base text-white opacity-90 md:text-lg lg:mb-8">
                  Unlock the power of advanced AI with our cutting-edge platform. 
                  Combining GPT-4 and Llama 3 for smarter, more intuitive interactions. 
                  Start your free trial today and discover how AI can transform your workflow.
                </p>
                <div className="flex flex-wrap items-center">
                  <Link
                    href="/auth/signup"
                    className="mr-5 mb-3 inline-flex items-center justify-center rounded-md bg-white px-7 py-3 text-base font-medium light:text-black dark:text-black transition duration-300 ease-in-out hover:bg-opacity-90 hover:shadow-lg"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    href="/ai/demo"
                    className="mb-3 inline-flex items-center justify-center rounded-md border border-white px-7 py-3 text-base font-medium light:text-black dark:text-white transition duration-300 ease-in-out hover:bg-white hover:text-primary"
                  >
                    Try Demo
                  </Link>
                </div>
              </div>
            </div>
            <div className="w-full px-4 lg:w-1/2">
              <div className="mt-10 lg:mt-0">
                <div className="flex flex-wrap justify-center lg:justify-end">
                  <div className="w-full px-3">
                    <div className="mx-auto max-w-[450px] text-center light:text-white dark:text-white lg:text-right">
                      <div className="mb-4 text-2xl font-semibold">
                        Platform Features
                      </div>
                      <p className="mb-2 text-base opacity-90">• Multi-model AI Integration</p>
                      <p className="mb-2 text-base opacity-90">• Real-time Processing</p>
                      <p className="mb-2 text-base opacity-90">• Advanced Context Understanding</p>
                      <p className="mb-2 text-base opacity-90">• Custom AI Solutions</p>
                      <p className="text-base opacity-90">• Enterprise-grade Security</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <span className="absolute top-0 left-0 z-[-1]">
          <svg
            width="189"
            height="162"
            viewBox="0 0 189 162"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse
              cx="16"
              cy="-16.5"
              rx="173"
              ry="178.5"
              transform="rotate(180 16 -16.5)"
              fill="url(#paint0_linear)"
            />
            <defs>
              <linearGradient
                id="paint0_linear"
                x1="-157"
                y1="-107.754"
                x2="98.5011"
                y2="-106.425"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.07" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span className="absolute bottom-0 right-0 z-[-1]">
          <svg
            width="191"
            height="208"
            viewBox="0 0 191 208"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse
              cx="173"
              cy="178.5"
              rx="173"
              ry="178.5"
              fill="url(#paint0_linear)"
            />
            <defs>
              <linearGradient
                id="paint0_linear"
                x1="-3.27832e-05"
                y1="87.2457"
                x2="255.501"
                y2="88.5747"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" stopOpacity="0.07" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      </div>
    </section>
  );
};

export default CallToAction;
