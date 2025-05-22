"use client";

import SectionTitle from "@/components/Common/SectionTitle";
import SingleReview from "./SingleReview";
import reviewsData from "./reviewsData";

const Reviews = () => {
  // Create three arrays for the columns
  const firstColumn = reviewsData.slice(0, 3);
  const secondColumn = reviewsData.slice(3, 6);
  const thirdColumn = reviewsData.slice(6, 9);

  return (
    <>
      <div className="mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0">
        <SectionTitle
          subTitle="Wall of love"
          title="What Our Users Say"
          paragraph="Read what others have experienced with our daily scripture messages. Join our community of believers growing together in faith."
        />

        <div className="grid grid-cols-1 gap-7.5 sm:grid-cols-2 lg:grid-cols-3">
          {/* First Column */}
          <div className="space-y-7.5">
            {firstColumn.map((review) => (
              <SingleReview 
                key={`col1-${review.id}`} 
                review={review} 
              />
            ))}
          </div>

          {/* Second Column */}
          <div className="hidden space-y-7.5 sm:block">
            {secondColumn.map((review) => (
              <SingleReview 
                key={`col2-${review.id}`} 
                review={review} 
              />
            ))}
          </div>

          {/* Third Column */}
          <div className="hidden space-y-7.5 lg:block">
            {thirdColumn.map((review) => (
              <SingleReview 
                key={`col3-${review.id}`} 
                review={review} 
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Reviews;
