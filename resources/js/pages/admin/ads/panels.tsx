import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiJson } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function RulesPanel() {
    const q = useQuery({
        queryKey: ['admin', 'rules'],
        queryFn: () => apiJson<{ rules: Record<string, unknown>[] }>('/ads/rules'),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ad rules</CardTitle>
                <CardDescription>Frequency caps and allowed hours</CardDescription>
            </CardHeader>
            <CardContent>
                {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
                <pre className="max-h-96 overflow-auto rounded-md border bg-muted/50 p-4 text-xs">{JSON.stringify(q.data?.rules, null, 2)}</pre>
            </CardContent>
        </Card>
    );
}

export function AnalyticsPanel() {
    const q = useQuery({
        queryKey: ['admin', 'platform-analytics'],
        queryFn: () => apiJson<{ analytics: Record<string, number> }>('/ads/platform-analytics'),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform analytics</CardTitle>
                <CardDescription>Aggregate impressions and clicks</CardDescription>
            </CardHeader>
            <CardContent>
                {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
                <pre className="rounded-md border bg-muted/50 p-4 text-sm">{JSON.stringify(q.data?.analytics, null, 2)}</pre>
            </CardContent>
        </Card>
    );
}

export function BannersPanel() {
    const q = useQuery({
        queryKey: ['admin', 'banners'],
        queryFn: () => apiJson<{ banners: Record<string, unknown>[] }>('/admin/banners'),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Platform banners</CardTitle>
                <CardDescription>Image banners for the game shell (outside VAST/video ads)</CardDescription>
            </CardHeader>
            <CardContent>
                {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
                <ul className="space-y-2 text-sm">
                    {q.data?.banners?.map((b) => (
                        <li key={String(b.id)} className="rounded border p-2">
                            {String(b.name ?? b.id)}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export function StripePanel() {
    const q = useQuery({
        queryKey: ['admin', 'stripe-settings'],
        queryFn: () =>
            apiJson<{
                stripe_publishable_key: string | null;
                stripe_secret_key_preview: string | null;
                webhook_url: string;
            }>('/admin/settings/stripe'),
    });
    const qc = useQueryClient();
    const [pub, setPub] = useState('');
    const [sec, setSec] = useState('');
    const [wh, setWh] = useState('');

    const save = useMutation({
        mutationFn: () =>
            apiJson('/admin/settings/stripe', {
                method: 'PUT',
                body: JSON.stringify({
                    stripe_publishable_key: pub || undefined,
                    stripe_secret_key: sec || undefined,
                    stripe_webhook_secret: wh || undefined,
                }),
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'stripe-settings'] });
            setSec('');
            setWh('');
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Stripe keys</CardTitle>
                <CardDescription>
                    Webhook URL: <code className="text-xs">{q.data?.webhook_url}</code>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {q.isLoading && <p>Loading…</p>}
                <div className="space-y-2">
                    <Label>Publishable key</Label>
                    <Input value={pub} onChange={(e) => setPub(e.target.value)} placeholder={q.data?.stripe_publishable_key ?? ''} />
                </div>
                <div className="space-y-2">
                    <Label>Secret key {q.data?.stripe_secret_key_preview ? `(saved ${q.data.stripe_secret_key_preview})` : ''}</Label>
                    <Input type="password" value={sec} onChange={(e) => setSec(e.target.value)} placeholder="sk_…" />
                </div>
                <div className="space-y-2">
                    <Label>Webhook signing secret</Label>
                    <Input type="password" value={wh} onChange={(e) => setWh(e.target.value)} placeholder="whsec_…" />
                </div>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                    Save
                </Button>
            </CardContent>
        </Card>
    );
}

export function PlansPanel() {
    const q = useQuery({
        queryKey: ['admin', 'plans'],
        queryFn: () => apiJson<{ plans: Record<string, unknown>[] }>('/admin/subscription/plans'),
    });
    const qc = useQueryClient();
    const [name, setName] = useState('Pro');
    const [amount, setAmount] = useState('999');
    const [interval, setInterval] = useState('month');

    const create = useMutation({
        mutationFn: () =>
            apiJson('/admin/subscription/plans', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    description: 'Removes ads',
                    interval,
                    amount: Number(amount),
                    currency: 'usd',
                    removes_ads: true,
                    is_active: true,
                }),
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] }),
    });

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
                <Button onClick={() => create.mutate()} disabled={create.isPending}>
                    Create & sync to Stripe
                </Button>
                {q.isLoading && <p>Loading…</p>}
                <ul className="space-y-2 text-sm">
                    {q.data?.plans?.map((p) => (
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

export function LevelsPanel() {
    const q = useQuery({
        queryKey: ['admin', 'levels'],
        queryFn: () => apiJson<{ rules: Record<string, unknown>[] }>('/admin/game-level-ad-rules'),
    });
    const qc = useQueryClient();
    const [from, setFrom] = useState('1');
    const [to, setTo] = useState('');
    const [count, setCount] = useState('1');

    const create = useMutation({
        mutationFn: () =>
            apiJson('/admin/game-level-ad-rules', {
                method: 'POST',
                body: JSON.stringify({
                    level_from: Number(from),
                    level_to: to ? Number(to) : null,
                    ads_after_level_complete: Number(count),
                    is_active: true,
                    sort_order: 0,
                }),
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'levels'] }),
    });

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
                <Button onClick={() => create.mutate()} disabled={create.isPending}>
                    Add rule
                </Button>
                <pre className="max-h-96 overflow-auto rounded-md border bg-muted/50 p-4 text-xs">{JSON.stringify(q.data?.rules, null, 2)}</pre>
            </CardContent>
        </Card>
    );
}
