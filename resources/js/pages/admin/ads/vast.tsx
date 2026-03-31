import { AdsTypeView } from './ads-type-view';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'VAST / VMAP', href: '/admin/ads/vast' },
];

export default function AdminAdsVastPage() {
    return <AdsTypeView adType="vast" title="VAST / VMAP" breadcrumbs={breadcrumbs} />;
}
