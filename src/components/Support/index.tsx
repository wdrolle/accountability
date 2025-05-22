import Image from "next/image";
import SectionTitle from "../Common/SectionTitle";

const Support = () => {
  return (
    <section id="support" className="scroll-mt-17">
      <div className="mx-auto max-w-[1104px] px-4 sm:px-8 xl:px-0">
        <div 
          className="relative rounded-xl bg-white/10 dark:bg-transparent light:bg-white p-8 border dark:border-white/[0.1] light:border-white shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
            boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
          }}
        >
          <SectionTitle
            subTitle="Need Any Help?"
            title="Contact With Us"
            paragraph="Welcome to CStudios Messaging and Blog! Receive CStudios messages and explore insightful blog posts to inspire and uplift your spirit."
            titleClass="text-white dark:text-white light:text-black"
            paragraphClass="text-gray-400 dark:text-gray-400 light:text-black/80"
          />

          {/* <!-- support form --> */}
          <div className="form-box-gradient relative overflow-hidden rounded-[25px] bg-white/10 dark:bg-transparent  bg-transparent p-6 sm:p-8 xl:p-15 border dark:border-white/[0.1] light:border-white">
            <form
              action="https://formbold.com/s/unique_form_id"
              method="POST"
              className="relative z-10"
            >
              <div className="-mx-4 flex flex-wrap xl:-mx-10">
                <div className="w-full px-4 md:w-1/2 xl:px-5">
                  <div className="mb-9.5">
                    <label
                      htmlFor="name"
                      className="mb-2.5 block font-medium text-white dark:text-white light:text-black"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="Enter your Name"
                      required
                      className="w-full rounded-lg border dark:border-white/[0.12] light:border-white bg-transparent dark:bg-transparent light:text-black px-6 py-3 dark:text-white light:text-black outline-none focus:border-purple"
                    />
                  </div>
                </div>
                <div className="w-full px-4 md:w-1/2 xl:px-5">
                  <div className="mb-9.5">
                    <label
                      htmlFor="email"
                      className="mb-2.5 block font-medium text-white dark:text-white light:text-black"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="Enter your Email"
                      required
                      className="w-full rounded-lg border dark:border-white/[0.12] light:border-white bg-transparent dark:bg-transparent light:bg-transparent px-6 py-3 text-white dark:text-white light:text-black outline-none focus:border-purple"
                    />
                  </div>
                </div>
                <div className="w-full px-4 xl:px-5">
                  <div className="mb-10">
                    <label
                      htmlFor="message"
                      className="mb-2.5 block font-medium text-white dark:text-white light:text-black"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Type your message"
                      rows={6}
                      required
                      className="w-full rounded-lg border dark:border-white/[0.12] light:border-white bg-white/[0.05] dark:bg-transparent light:bg-transparent px-6 py-5 text-white dark:text-white light:text-black outline-none focus:border-purple"
                    />
                  </div>
                </div>
                <div className="w-full px-4 xl:px-5">
                  <div className="text-center">
                    <button
                      type="submit"
                      className="hero-button-gradient inline-flex rounded-lg px-7 py-3 font-medium light:text-white dark:text-white light:text-black duration-300 ease-in hover:opacity-80 transform hover:-translate-y-0.5 transition-transform"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default Support;
