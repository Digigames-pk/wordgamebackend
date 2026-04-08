import { BannersPanel } from './panels';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Platform banners', href: '/admin/ads/platform-banners' },
];

export default function AdminAdsPlatformBannersPage({ banners }: { banners: Record<string, unknown>[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform banners" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">Platform banners</h2>
                    <p className="mt-1 text-muted-foreground">Image banners for the game shell (outside VAST/video ads).</p>
                </div>
                <BannersPanel banners={banners} />
            </div>
        </AppLayout>
    );
}
