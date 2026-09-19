import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ReviewsManager } from './reviews-manager';
import './reviews.css';

export default async function ReviewsPage() {
  const user=await getCurrentUser(); if(user?.role!=='admin')redirect('/admin/dashboard');
  return <ReviewsManager storefrontUrl={process.env.STOREFRONT_URL ?? 'http://localhost:3000'}/>;
}
