import { AnalyticsPanel } from './panels';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Analytics', href: '/admin/ads/analytics' },
];

export default function AdminAdsAnalyticsPage({ analytics }: { analytics: Record<string, number> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">Platform analytics</h2>
                    <p className="mt-1 text-muted-foreground">Aggregate impressions and clicks.</p>
                </div>
                <AnalyticsPanel analytics={analytics} />
            </div>
        </AppLayout>
    );
}
