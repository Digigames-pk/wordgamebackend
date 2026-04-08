import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Free tier settings', href: '/admin/ads/free-tier' },
];

export default function AdminAdsFreeTierPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Free tier settings" />
            <div className="mx-auto max-w-4xl space-y-6 p-8">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight">Free tier settings</h2>
                    <p className="mt-1 text-muted-foreground">Global defaults for ad frequency and formats on the free tier.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Defaults</CardTitle>
                        <CardDescription>
                            Wire this to an admin web route when the backend endpoint is available.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <p>This mirrors rdioAI&apos;s free-tier tab. No settings API is registered in this app yet.</p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
