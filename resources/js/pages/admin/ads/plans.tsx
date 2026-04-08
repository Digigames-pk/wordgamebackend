import { PlansPanel } from './panels';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Subscription plans', href: '/admin/ads/plans' },
];

export default function AdminAdsPlansPage({ plans }: { plans: Record<string, unknown>[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription plans" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">Subscription plans</h2>
                    <p className="mt-1 text-muted-foreground">Stripe Product/Price sync for ad-free subscriptions.</p>
                </div>
                <PlansPanel plans={plans} />
            </div>
        </AppLayout>
    );
}
