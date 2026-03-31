import { AdsTypeView } from './ads-type-view';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Video ads', href: '/admin/ads/video' },
];

export default function AdminAdsVideoPage() {
    return <AdsTypeView adType="video" title="Video ads" breadcrumbs={breadcrumbs} />;
}
