import BlogList from '@/components/blogs/blog-list';
import { getBlogsServer } from '@/lib/blog-server';

export default async function BlogsPage() {
  const result = await getBlogsServer();
  const initial = result.success ? result : {
    success: true,
    data: { blogs: [], pagination: { page: 1, pages: 1, total: 0 } },
    error: result.error,
  };
  return <BlogList initial={initial} />;
}
