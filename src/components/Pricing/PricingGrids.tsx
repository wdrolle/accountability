import SectionTitle from "../Common/SectionTitle";
import MultiPricing from "./MultiPricing";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number | null;
  productId: string | null;
  features: string[];
  popular?: boolean;
  contactSales?: boolean;
}

interface PricingGridsProps {
  plans: PricingPlan[];
}

const PricingGrids = ({ plans }: PricingGridsProps) => {
  if (!plans || plans.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mx-auto max-w-[1170px] px-4 sm:px-6 xl:px-0">
        <div className="mb-8">
          <SectionTitle
            subTitle="Choose Your Plan"
            title="Scripture Subscription Plans"
            paragraph="Select the perfect subscription plan for your spiritual journey. Whether you're seeking daily verses, weekly reflections, or premium content, we have options to support your faith."
          />
        </div>
        <MultiPricing plans={plans} />
      </div>
    </div>
  );
};

export default PricingGrids;
