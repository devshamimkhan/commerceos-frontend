import '../blogs/blog.css';
import { BlogToaster } from '@/components/blogs/blog-toaster';

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<BlogToaster /></>;
}
