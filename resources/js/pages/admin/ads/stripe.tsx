import { StripePanel } from './panels';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Stripe keys', href: '/admin/ads/stripe' },
];

export default function AdminAdsStripePage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stripe keys" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">Stripe</h2>
                    <p className="mt-1 text-muted-foreground">Publishable key, secret, and webhook signing secret.</p>
                </div>
                <StripePanel />
            </div>
        </AppLayout>
    );
}
