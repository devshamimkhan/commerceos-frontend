import { getCurrentUser } from '@/lib/auth';
import { HeroSliderManager } from './hero-slider-manager';
import './hero-slider.css';

export default async function HeroSliderPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') return <p>Admin access is required to manage hero sliders.</p>;
  return <HeroSliderManager storefrontUrl={process.env.STOREFRONT_URL ?? 'http://localhost:3000'} />;
}
