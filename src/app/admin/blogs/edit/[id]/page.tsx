import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import BlogEditorForm from '../../BlogEditorForm';
export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  const cookie = (await cookies()).get('commerce.sid');
  const response = await fetch(`${process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1'}/auth/blogs/${id}`, {
    headers: { Cookie: `commerce.sid=${cookie?.value ?? ''}` }, cache: 'no-store', signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401) redirect('/login');
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Could not load the blog. Please try again.');
  const result = await response.json();
  return <BlogEditorForm key={id} mode="edit" initialBlog={result.data} />;
}

