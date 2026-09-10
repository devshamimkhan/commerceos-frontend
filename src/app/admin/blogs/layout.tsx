import { BlogToaster } from '@/components/blogs/blog-toaster';
import './blog.css';
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="blog-workspace">{children}<BlogToaster /></div>;
}

