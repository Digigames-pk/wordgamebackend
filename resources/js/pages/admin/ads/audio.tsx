import { AdsTypeView, type AdminAdAssetRow, type AdminAdvertiserOption } from './ads-type-view';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Audio ads', href: '/admin/ads/audio' },
];

export default function AdminAdsAudioPage({
    assets,
    advertisers,
}: {
    assets: AdminAdAssetRow[];
    advertisers: AdminAdvertiserOption[];
}) {
    return <AdsTypeView adType="audio" title="Audio ads" breadcrumbs={breadcrumbs} assets={assets} advertisers={advertisers} />;
}
