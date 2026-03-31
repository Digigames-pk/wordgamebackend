import { AdsTypeView } from './ads-type-view';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Audio ads', href: '/admin/ads/audio' },
];

export default function AdminAdsAudioPage() {
    return <AdsTypeView adType="audio" title="Audio ads" breadcrumbs={breadcrumbs} />;
}
