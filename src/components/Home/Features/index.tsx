import SectionTitle from "../../Common/SectionTitle";
import featuresData from "./featuresData";
import SingleFeature from "./SingleFeature";

const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-25">
      <div className="mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0">
        <SectionTitle
          subTitle="Main Features"
          title="Core Features"
          paragraph="Experience the power of our platform's core features designed to enhance your spiritual journey."
          titleClass="text-white dark:text-white light:text-black"
          paragraphClass="text-gray-400 dark:text-gray-400 light:text-black/80"
        />

        <div className="grid grid-cols-1 gap-7.5 sm:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature) => (
            <SingleFeature key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
