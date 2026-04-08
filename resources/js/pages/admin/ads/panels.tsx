import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { toast } from 'sonner';

function inertiaErrorMessage(errors: Record<string, string | string[] | undefined>): string {
    const first = Object.values(errors).find(Boolean);
    if (Array.isArray(first)) return first[0] ?? 'Request failed';
    return typeof first === 'string' ? first : 'Request failed';
}

export function RulesPanel({ rules }: { rules: Record<string, unknown>[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Ad rules</CardTitle>
                <CardDescription>Frequency caps and allowed hours</CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="max-h-96 overflow-auto rounded-md border bg-muted/50 p-4 text-xs">{JSON.stringify(rules, null, 2)}</pre>
            </CardContent>
        </Card>
    );
}

export function AnalyticsPanel({ analytics }: { analytics: Record<string, number> }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform analytics</CardTitle>
                <CardDescription>Aggregate impressions and clicks</CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="rounded-md border bg-muted/50 p-4 text-sm">{JSON.stringify(analytics, null, 2)}</pre>
            </CardContent>
        </Card>
    );
}

export function BannersPanel({ banners }: { banners: Record<string, unknown>[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform banners</CardTitle>
                <CardDescription>Image banners for the game shell (outside VAST/video ads)</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    {banners.map((b) => (
                        <li key={String(b.id)} className="rounded border p-2">
                            {String(b.name ?? b.id)}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export function StripePanel({
    stripeSettings,
}: {
    stripeSettings: {
        stripe_publishable_key: string | null;
        stripe_secret_key_preview: string | null;
        webhook_url: string;
    };
}) {
    const [pub, setPub] = useState('');
    const [sec, setSec] = useState('');
    const [wh, setWh] = useState('');
    const [saving, setSaving] = useState(false);

    const save = () => {
        setSaving(true);
        router.put(
            route('admin.ads.settings.stripe'),
            {
                stripe_publishable_key: pub || undefined,
                stripe_secret_key: sec || undefined,
                stripe_webhook_secret: wh || undefined,
            },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: () => {
                    toast.success('Stripe settings saved');
                    setSec('');
                    setWh('');
                },
                onError: (errors) => toast.error(inertiaErrorMessage(errors)),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Stripe keys</CardTitle>
                <CardDescription>
                    Webhook URL: <code className="text-xs">{stripeSettings.webhook_url}</code>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Publishable key</Label>
                    <Input
                        value={pub}
                        onChange={(e) => setPub(e.target.value)}
                        placeholder={stripeSettings.stripe_publishable_key ?? ''}
                    />
                </div>
                <div className="space-y-2">
                    <Label>
                        Secret key{' '}
                        {stripeSettings.stripe_secret_key_preview ? `(saved ${stripeSettings.stripe_secret_key_preview})` : ''}
                    </Label>
                    <Input type="password" value={sec} onChange={(e) => setSec(e.target.value)} placeholder="sk_…" />
                </div>
                <div className="space-y-2">
                    <Label>Webhook signing secret</Label>
                    <Input type="password" value={wh} onChange={(e) => setWh(e.target.value)} placeholder="whsec_…" />
                </div>
                <Button onClick={save} disabled={saving}>
                    Save
                </Button>
            </CardContent>
        </Card>
    );
}

export function PlansPanel({ plans }: { plans: Record<string, unknown>[] }) {
    const [name, setName] = useState('Pro');
    const [amount, setAmount] = useState('999');
    const [interval, setInterval] = useState('month');
    const [creating, setCreating] = useState(false);

    const create = () => {
        setCreating(true);
        router.post(
            route('admin.ads.subscription.plans.store'),
            {
                name,
                description: 'Removes ads',
                interval,
                amount: Number(amount),
                currency: 'usd',
                removes_ads: true,
                is_active: true,
            },
            {
                preserveScroll: true,
                onFinish: () => setCreating(false),
                onSuccess: () => toast.success('Plan created'),
                onError: (errors) => toast.error(inertiaErrorMessage(errors)),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription plans</CardTitle>
                <CardDescription>Creates Stripe Product + Price when saved (requires Stripe secret).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 md:grid-cols-3">
                    <div>
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <Label>Amount (cents)</Label>
                        <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div>
                        <Label>Interval</Label>
                        <Input value={interval} onChange={(e) => setInterval(e.target.value)} placeholder="month or year" />
                    </div>
                </div>
                <Button onClick={create} disabled={creating}>
                    Create & sync to Stripe
                </Button>
                <ul className="space-y-2 text-sm">
                    {plans.map((p) => (
                        <li key={String(p.id)} className="rounded border p-2">
                            {String(p.name)} — {String(p.amount)} {String(p.currency)} / {String(p.interval)} (
                            {String(p.stripe_price_id ?? 'no price')})
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export function LevelsPanel({ levelRules }: { levelRules: Record<string, unknown>[] }) {
    const [from, setFrom] = useState('1');
    const [to, setTo] = useState('');
    const [count, setCount] = useState('1');
    const [creating, setCreating] = useState(false);

    const create = () => {
        setCreating(true);
        router.post(
            route('admin.ads.game-level-ad-rules.store'),
            {
                level_from: Number(from),
                level_to: to ? Number(to) : null,
                ads_after_level_complete: Number(count),
                is_active: true,
                sort_order: 0,
            },
            {
                preserveScroll: true,
                onFinish: () => setCreating(false),
                onSuccess: () => toast.success('Rule added'),
                onError: (errors) => toast.error(inertiaErrorMessage(errors)),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Game level ad rules</CardTitle>
                <CardDescription>How many ad opportunities after completing a level (matched by range).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 md:grid-cols-3">
                    <div>
                        <Label>Level from</Label>
                        <Input value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div>
                        <Label>Level to (empty = open)</Label>
                        <Input value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <div>
                        <Label>Ads after level</Label>
                        <Input value={count} onChange={(e) => setCount(e.target.value)} />
                    </div>
                </div>
                <Button onClick={create} disabled={creating}>
                    Add rule
                </Button>
                <pre className="max-h-96 overflow-auto rounded-md border bg-muted/50 p-4 text-xs">{JSON.stringify(levelRules, null, 2)}</pre>
            </CardContent>
        </Card>
    );
}
