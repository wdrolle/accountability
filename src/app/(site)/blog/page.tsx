import { getPosts } from "@/sanity/sanity-utils";
import Breadcrumb from "@/components/Breadcrumb";
import SingleBlog from "@/components/Blog/SingleBlog";
import { integrations } from "../../../../integrations.config";
import { Blog } from "@/types/blog";

const BlogPage = async () => {
  const posts = integrations.isSanityEnabled ? await getPosts() : [];

  // Group posts by date (YYYY-MM)
  const groupedPosts = posts.reduce((groups: { [key: string]: Blog[] }, post) => {
    if (!post.publishedAt) return groups;
    
    const date = new Date(post.publishedAt);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groups[yearMonth]) {
      groups[yearMonth] = [];
    }
    
    if (groups[yearMonth].length < 5) { // Limit to 5 posts per time period
      groups[yearMonth].push(post);
    }
    
    return groups;
  }, {});

  // Sort time periods in descending order
  const sortedTimePeriods = Object.keys(groupedPosts).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <Breadcrumb pageTitle="Spiritual Insights & Reflections" />

      <section className="pb-[120px] pt-[40px]">
        <div className="container">
          {sortedTimePeriods.map((timePeriod) => {
            const timeBlogs = groupedPosts[timePeriod];
            const [year, month] = timePeriod.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            const monthName = date.toLocaleString('default', { month: 'long' });

            return (
              <div key={timePeriod} className="mb-16">
                <div 
                  className="relative mx-auto mb-8 w-fit rounded-full border border-gray-300/20 dark:border-gray-600/20 px-8 py-2 shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all bg-[url(/images/cta/grid.svg)]"
                  style={{
                    boxShadow: 'inset -4px -4px 8px rgba(0,0,0,0.1), inset 4px 4px 8px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h2 className="text-2xl font-semibold text-white dark:text-white light:text-black">
                    {monthName} {year}
                  </h2>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 justify-items-stretch">
                  {timeBlogs.map((blog) => (
                    <SingleBlog key={blog._id} blog={blog} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default BlogPage;
