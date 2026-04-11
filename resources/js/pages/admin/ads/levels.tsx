import { LevelAdRulesPanel, type LevelAdRuleRow } from './level-ad-rules-panel';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Level ad rules', href: '/admin/ads/levels' },
];

export default function AdminAdsLevelsPage({ levelRules }: { levelRules: LevelAdRuleRow[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Level ad rules" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">Level ad rules</h2>
                    <p className="mt-1 max-w-3xl text-muted-foreground">
                        Global conditions for which levels trigger interstitial ad opportunities. Rules are ordered; the first
                        matching range applies when the app requests an ad for a given level.
                    </p>
                </div>
                <LevelAdRulesPanel levelRules={levelRules} />
            </div>
        </AppLayout>
    );
}
