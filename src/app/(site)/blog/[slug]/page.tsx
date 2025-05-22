import SingleBlog from "@/components/Blog/SingleBlog";
import Breadcrumb from "@/components/Breadcrumb";
import { getPost, getPosts, imageBuilder } from "@/sanity/sanity-utils";
import { Blog } from "@/types/blog";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await Promise.resolve(params);
    const post = await getPost(resolvedParams.slug);

    if (!post) {
      return {
        title: 'Post Not Found',
      };
    }

    return {
      title: post.title,
      description: post.metadata,
      openGraph: {
        title: post.title,
        description: post.metadata,
        type: 'article',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug.current}`,
        images: [
          {
            url: imageBuilder(post.mainImage),
            width: 1800,
            height: 1600,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.metadata,
        images: [imageBuilder(post.mainImage)],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Post Not Found',
    };
  }
}

export default async function BlogDetails({ params }: Props) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const post = await getPost(resolvedParams.slug);
    
    if (!post) {
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white">Blog post not found</h1>
          <p className="mt-4 text-black dark:text-gray-400">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog" className="mt-8 inline-block text-purple hover:underline">
            Return to blog
          </Link>
        </div>
      );
    }

    const posts = await getPosts();
    const imageUrl = post?.mainImage?.asset ? imageBuilder(post.mainImage) : null;

    return (
      <>
        <Breadcrumb pageTitle={post.title} />

        <section className="pb-17.5 pt-20 lg:pb-5.5 lg:pt-5 xl:pb-27.5">
          {imageUrl && (
            <div className="relative mx-auto mb-10 w-3/4 max-w-[375px]">
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={imageUrl}
                    alt={post.title || 'Blog post image'}
                    fill
                    className="w-full h-full object-contain p-4"
                    priority
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mx-auto w-full max-w-[1170px]">
            <div className="mx-auto max-w-[870px]">
              <div className="blog-details mb-12 prose prose-invert dark:prose-invert prose-light max-w-none">
                <PortableText value={post?.body || []} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="font-medium text-black dark:text-white">Share This Post:</p>
                  <div className="flex items-center gap-5">
                    <a
                      aria-label="social icon"
                      href="#"
                      className="duration-300 ease-in text-black dark:text-white hover:text-purple"
                    >
                      <svg
                        className="fill-current"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13 21.9506C18.0533 21.4489 22 17.1853 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 16.8379 5.43552 20.8734 10 21.8V16H7V13H10V9.79586C10 7.47449 11.9695 5.64064 14.285 5.80603L17 5.99996V8.99996H15C13.8954 8.99996 13 9.89539 13 11V13H17L16 16H13V21.9506Z"
                        />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="fill-current text-black dark:text-white"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 8.75C7.65625 8.75 5.78125 6.90625 5.78125 4.65625C5.78125 2.40625 7.65625 0.5625 10 0.5625C12.3438 0.5625 14.2188 2.40625 14.2188 4.65625C14.2188 6.90625 12.3438 8.75 10 8.75ZM10 1.96875C8.4375 1.96875 7.1875 3.1875 7.1875 4.65625C7.1875 6.125 8.4375 7.34375 10 7.34375C11.5625 7.34375 12.8125 6.125 12.8125 4.65625C12.8125 3.1875 11.5625 1.96875 10 1.96875Z"
                      />
                      <path
                        d="M16.5938 19.4688C16.2188 19.4688 15.875 19.1562 15.875 18.75V17.8438C15.875 14.5938 13.25 11.9688 10 11.9688C6.75 11.9688 4.125 14.5938 4.125 17.8438V18.75C4.125 19.125 3.8125 19.4688 3.40625 19.4688C3 19.4688 2.6875 19.1562 2.6875 18.75V17.8438C2.6875 13.8125 5.96875 10.5625 9.96875 10.5625C13.9688 10.5625 17.25 13.8437 17.25 17.8438V18.75C17.2813 19.125 16.9688 19.4688 16.5938 19.4688Z"
                      />
                    </svg>
                    <Link 
                      href={`/blog/author/${post?.author?.slug?.current}`} 
                      className="text-sm font-medium text-black dark:text-white hover:text-purple"
                    >
                      {post?.author?.name}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg
                      className="fill-current text-black dark:text-white"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.5 3.75H15.625V2.5C15.625 2.15625 15.3438 1.875 15 1.875C14.6562 1.875 14.375 2.15625 14.375 2.5V3.75H5.625V2.5C5.625 2.15625 5.34375 1.875 5 1.875C4.65625 1.875 4.375 2.15625 4.375 2.5V3.75H2.5C1.46875 3.75 0.625 4.59375 0.625 5.625V16.25C0.625 17.2812 1.46875 18.125 2.5 18.125H17.5C18.5312 18.125 19.375 17.2812 19.375 16.25V5.625C19.375 4.59375 18.5312 3.75 17.5 3.75ZM18.125 16.25C18.125 16.5938 17.8438 16.875 17.5 16.875H2.5C2.15625 16.875 1.875 16.5938 1.875 16.25V9.375H18.125V16.25ZM18.125 8.125H1.875V5.625C1.875 5.28125 2.15625 5 2.5 5H4.375V6.25C4.375 6.59375 4.65625 6.875 5 6.875C5.34375 6.875 5.625 6.59375 5.625 6.25V5H14.375V6.25C14.375 6.59375 14.6562 6.875 15 6.875C15.3438 6.875 15.625 6.59375 15.625 6.25V5H17.5C17.8438 5 18.125 5.28125 18.125 5.625V8.125Z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-black dark:text-white">
                      {new Date(post?.publishedAt!)
                        .toDateString()
                        .split(" ")
                        .slice(1)
                        .join(" ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="mb-10 mt-25 max-w-[579px] text-[34px] font-semibold leading-[45px] text-black dark:text-white">
              Related Articles
            </h2>

            <div className="grid grid-cols-1 gap-7.5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.length > 0 &&
                posts
                  .filter(p => p._id !== post._id)
                  .slice(0, 3)
                  .map((blog: Blog) => <SingleBlog key={blog._id} blog={blog} />)}
            </div>
          </div>
        </section>
      </>
    );
  } catch (error) {
    console.error('Error rendering BlogDetails:', error);
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-black dark:text-white">Error loading blog post</h1>
        <p className="mt-4 text-black dark:text-gray-400">An error occurred while loading the blog post.</p>
        <Link href="/blog" className="mt-8 inline-block text-purple hover:underline">
          Return to blog
        </Link>
      </div>
    );
  }
}
