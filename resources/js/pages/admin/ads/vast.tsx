import { AdsTypeView, type AdminAdAssetRow, type AdminAdvertiserOption } from './ads-type-view';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'VAST / VMAP', href: '/admin/ads/vast' },
];

export default function AdminAdsVastPage({
    assets,
    advertisers,
}: {
    assets: AdminAdAssetRow[];
    advertisers: AdminAdvertiserOption[];
}) {
    return <AdsTypeView adType="vast" title="VAST / VMAP" breadcrumbs={breadcrumbs} assets={assets} advertisers={advertisers} />;
}
