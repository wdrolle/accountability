import { PortableTextBlock } from "sanity";

export interface SanityImageAsset {
  _id: string;
  _type: string;
  _ref?: string;
  url?: string;
  metadata?: {
    dimensions: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    lqip?: string;
  };
}

export type SanityImage = {
  _type: "image";
  asset: SanityImageAsset;
  alt?: string;
};

export type Author = {
  name: string;
  image: SanityImage;
  bio?: string;
  slug: {
    current: string;
    _type: "slug";
  };
  _id: string;
};

export type Blog = {
  _id: string;
  title: string;
  slug: {
    current: string;
    _type: "slug";
  };
  metadata?: string;
  description?: string;
  image?: string;
  body?: PortableTextBlock[];
  mainImage: SanityImage;
  author?: Author;
  tags?: string[];
  publishedAt?: string;
};
