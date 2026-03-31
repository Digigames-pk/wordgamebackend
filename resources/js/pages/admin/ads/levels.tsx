import { LevelsPanel } from './panels';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Level ad rules', href: '/admin/ads/levels' },
];

export default function AdminAdsLevelsPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Level ad rules" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">Game level ad rules</h2>
                    <p className="mt-1 text-muted-foreground">How many ad opportunities after completing a level.</p>
                </div>
                <LevelsPanel />
            </div>
        </AppLayout>
    );
}
