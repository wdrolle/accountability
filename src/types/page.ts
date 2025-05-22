export interface PageParams {
  params: {
    id: string;
    [key: string]: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
} 