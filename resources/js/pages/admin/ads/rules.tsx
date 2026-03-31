import { RulesPanel } from './panels';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Ad rules', href: '/admin/ads/rules' },
];

export default function AdminAdsRulesPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ad rules" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">Ad rules</h2>
                    <p className="mt-1 text-muted-foreground">Frequency caps and scheduling windows.</p>
                </div>
                <RulesPanel />
            </div>
        </AppLayout>
    );
}
