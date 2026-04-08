import { AdsTypeView, type AdminAdAssetRow, type AdminAdvertiserOption } from './ads-type-view';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Banner ads', href: '/admin/ads/banner' },
];

export default function AdminAdsBannerPage({
    assets,
    advertisers,
}: {
    assets: AdminAdAssetRow[];
    advertisers: AdminAdvertiserOption[];
}) {
    return <AdsTypeView adType="banner" title="Banner ads" breadcrumbs={breadcrumbs} assets={assets} advertisers={advertisers} />;
}
