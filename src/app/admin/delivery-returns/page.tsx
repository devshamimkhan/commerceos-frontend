import { PolicyEditor } from './policy-editor';
import { getCurrentUser } from '@/lib/auth';
import { BenefitsManager } from '../trust-highlights/benefits-manager';
import '../trust-highlights/benefits.css';
export default async function Page() { const user=await getCurrentUser();if(user?.role!=='admin')return <p>Admin access is required.</p>;return <><BenefitsManager endpoint="/api/v1/auth/delivery-info" title="Delivery & Returns" description="Manage the information strip displayed on every product details page." visibilityLabel="Show on every product details page"/><PolicyEditor/></>; }
