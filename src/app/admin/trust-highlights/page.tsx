import { getCurrentUser } from '@/lib/auth';
import { BenefitsManager } from './benefits-manager';
import './benefits.css';
export default async function Page() { const user = await getCurrentUser(); if(user?.role !== 'admin') return <p>Admin access is required.</p>; return <BenefitsManager />; }
