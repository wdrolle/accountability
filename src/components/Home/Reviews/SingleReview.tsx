import { Review } from "@/types/review";
import Image from "next/image";

const SingleReview = ({ review }: { review: Review }) => {
  return (
    <div 
      className="relative rounded-xl bg-[url(/images/cta/grid.svg)] bg-cover bg-center bg-no-repeat p-8 border dark:border-white/[0.1] light:border-black/[0.1] gap-2.5 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
    >
      <div className="absolute inset-0 rounded-xl bg-white/10 dark:bg-dark/40 light:bg-white/10" />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5" 
        style={{
          boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-4.5">
          <div className="relative h-12 w-full max-w-[48px] overflow-hidden rounded-full transform hover:scale-105 transition-transform">
            <Image
              src={review.userImage}
              alt={review.userName}
              width={48}
              height={48}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white dark:text-white light:text-black transform hover:-translate-y-0.5 transition-transform">{review.userName}</h3>
            <p className="text-sm font-medium lowercase text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform">
              {review.userDesignation}
            </p>
          </div>
        </div>

        <div className="user-divider relative my-6 h-[1px] w-full"></div>

        <p className="text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform">{review.description}</p>
      </div>
    </div>
  );
};

export default SingleReview;
