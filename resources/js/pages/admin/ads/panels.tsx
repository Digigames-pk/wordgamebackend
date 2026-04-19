import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { apiJson } from '@/lib/api';
import { postWithMethod } from '@/lib/inertia-form-method';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

function inertiaErrorMessage(errors: Record<string, string | string[] | undefined>): string {
    const first = Object.values(errors).find(Boolean);
    if (Array.isArray(first)) return first[0] ?? 'Request failed';
    return typeof first === 'string' ? first : 'Request failed';
}

interface AdRuleRow {
    id: string;
    frequency_per_hour: number;
    allowed_hours?: unknown[] | null;
    targeting?: unknown | null;
    enabled: boolean;
}

export function RulesPanel({ rules: initialRules }: { rules: Record<string, unknown>[] }) {
    const [rules, setRules] = useState<AdRuleRow[]>(() => initialRules as AdRuleRow[]);
    const [busy, setBusy] = useState(false);
    const [createFph, setCreateFph] = useState('60');
    const [createHoursJson, setCreateHoursJson] = useState('');
    const [createEnabled, setCreateEnabled] = useState(true);

    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<AdRuleRow | null>(null);
    const [editFph, setEditFph] = useState('60');
    const [editHoursJson, setEditHoursJson] = useState('');
    const [editEnabled, setEditEnabled] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await apiJson<{ rules: AdRuleRow[] }>('/ads/rules');
            setRules(res.rules ?? []);
        } catch {
            setRules(initialRules as AdRuleRow[]);
        }
    }, [initialRules]);

    useEffect(() => {
        void load();
    }, [load]);

    const parseHours = (raw: string): unknown[] | null | undefined => {
        const t = raw.trim();
        if (!t) return null;
        try {
            const v = JSON.parse(t) as unknown;
            return Array.isArray(v) ? v : undefined;
        } catch {
            toast.error('Allowed hours must be valid JSON array or empty');
            return undefined;
        }
    };

    const create = async () => {
        const allowed = parseHours(createHoursJson);
        if (allowed === undefined) return;
        setBusy(true);
        try {
            await apiJson('/ads/rules', {
                method: 'POST',
                body: JSON.stringify({
                    frequency_per_hour: Number(createFph) || 0,
                    allowed_hours: allowed,
                    enabled: createEnabled,
                }),
            });
            toast.success('Rule created');
            setCreateFph('60');
            setCreateHoursJson('');
            setCreateEnabled(true);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Create failed');
        } finally {
            setBusy(false);
        }
    };

    const openEdit = (r: AdRuleRow) => {
        setEditing(r);
        setEditFph(String(r.frequency_per_hour));
        setEditHoursJson(r.allowed_hours ? JSON.stringify(r.allowed_hours, null, 2) : '');
        setEditEnabled(r.enabled);
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        const allowed = parseHours(editHoursJson);
        if (allowed === undefined) return;
        setBusy(true);
        try {
            await apiJson(`/ads/rules/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    frequency_per_hour: Number(editFph) || 0,
                    allowed_hours: allowed,
                    enabled: editEnabled,
                }),
            });
            toast.success('Rule updated');
            setEditOpen(false);
            setEditing(null);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setBusy(false);
        }
    };

    const destroy = async (r: AdRuleRow) => {
        if (!confirm('Delete this ad rule?')) return;
        setBusy(true);
        try {
            await apiJson(`/ads/rules/${r.id}`, { method: 'DELETE' });
            toast.success('Deleted');
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add rule</CardTitle>
                    <CardDescription>Frequency per hour and optional allowed hours JSON array.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Frequency / hour</Label>
                            <Input inputMode="numeric" value={createFph} onChange={(e) => setCreateFph(e.target.value)} />
                        </div>
                        <div className="flex items-end gap-2 pb-2">
                            <Switch checked={createEnabled} onCheckedChange={(c) => setCreateEnabled(Boolean(c))} />
                            <Label>Enabled</Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Allowed hours (JSON array, optional)</Label>
                        <Textarea
                            value={createHoursJson}
                            onChange={(e) => setCreateHoursJson(e.target.value)}
                            placeholder="[0,1,2,…,23]"
                            rows={3}
                            className="font-mono text-xs"
                        />
                    </div>
                    <Button onClick={() => void create()} disabled={busy} className="gap-2">
                        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        Create
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rules</CardTitle>
                </CardHeader>
                <CardContent>
                    {rules.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No rules.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Freq / hr</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rules.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>{r.frequency_per_hour}</TableCell>
                                        <TableCell className="max-w-xs truncate font-mono text-xs">
                                            {r.allowed_hours ? JSON.stringify(r.allowed_hours) : '—'}
                                        </TableCell>
                                        <TableCell>{r.enabled ? 'Yes' : 'No'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(r)} disabled={busy}>
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => destroy(r)} disabled={busy}>
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit rule</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Frequency / hour</Label>
                            <Input inputMode="numeric" value={editFph} onChange={(e) => setEditFph(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Allowed hours JSON</Label>
                            <Textarea
                                value={editHoursJson}
                                onChange={(e) => setEditHoursJson(e.target.value)}
                                rows={4}
                                className="font-mono text-xs"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={editEnabled} onCheckedChange={(c) => setEditEnabled(Boolean(c))} />
                            <Label>Enabled</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => void saveEdit()} disabled={busy}>
                            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
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

interface BannerRow {
    id: string;
    image_url: string;
    link_url?: string | null;
    name?: string | null;
    position?: string;
    size?: string;
    weight?: number;
    is_active?: boolean;
}

export function BannersPanel({ banners: initial }: { banners: Record<string, unknown>[] }) {
    const [banners, setBanners] = useState<BannerRow[]>(() => initial as BannerRow[]);
    const [busy, setBusy] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [cf, setCf] = useState({ image_url: '', link_url: '', name: '', weight: '5', is_active: true });

    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<BannerRow | null>(null);
    const [ef, setEf] = useState({ image_url: '', link_url: '', name: '', weight: '5', is_active: true });

    const load = useCallback(async () => {
        try {
            const res = await apiJson<{ banners: BannerRow[] }>('/admin/banners');
            setBanners(res.banners ?? []);
        } catch {
            setBanners(initial as BannerRow[]);
        }
    }, [initial]);

    useEffect(() => {
        void load();
    }, [load]);

    const create = async () => {
        setBusy(true);
        try {
            await apiJson('/admin/banners', {
                method: 'POST',
                body: JSON.stringify({
                    image_url: cf.image_url.trim(),
                    link_url: cf.link_url.trim() || null,
                    name: cf.name.trim() || null,
                    weight: Number(cf.weight) || 5,
                    is_active: cf.is_active,
                }),
            });
            toast.success('Banner created');
            setCreateOpen(false);
            setCf({ image_url: '', link_url: '', name: '', weight: '5', is_active: true });
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Create failed');
        } finally {
            setBusy(false);
        }
    };

    const openEdit = (b: BannerRow) => {
        setEditing(b);
        setEf({
            image_url: b.image_url,
            link_url: b.link_url ?? '',
            name: b.name ?? '',
            weight: String(b.weight ?? 5),
            is_active: b.is_active !== false,
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        setBusy(true);
        try {
            await apiJson(`/admin/banners/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    image_url: ef.image_url.trim(),
                    link_url: ef.link_url.trim() || null,
                    name: ef.name.trim() || null,
                    weight: Number(ef.weight) || 5,
                    is_active: ef.is_active,
                }),
            });
            toast.success('Updated');
            setEditOpen(false);
            setEditing(null);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setBusy(false);
        }
    };

    const destroy = async (b: BannerRow) => {
        if (!confirm('Delete this banner?')) return;
        setBusy(true);
        try {
            await apiJson(`/admin/banners/${b.id}`, { method: 'DELETE' });
            toast.success('Deleted');
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="size-4" /> Add banner
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Platform banners</CardTitle>
                    <CardDescription>Image banners for the game shell.</CardDescription>
                </CardHeader>
                <CardContent>
                    {banners.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No banners.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-24">Preview</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banners.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell>
                                            <img src={b.image_url} alt="" className="h-10 w-20 rounded border object-cover" />
                                        </TableCell>
                                        <TableCell>{b.name ?? '—'}</TableCell>
                                        <TableCell>{b.weight ?? 5}</TableCell>
                                        <TableCell>{b.is_active !== false ? 'Yes' : 'No'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(b)} disabled={busy}>
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => destroy(b)} disabled={busy}>
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New banner</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input value={cf.image_url} onChange={(e) => setCf((f) => ({ ...f, image_url: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Link URL</Label>
                            <Input value={cf.link_url} onChange={(e) => setCf((f) => ({ ...f, link_url: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={cf.name} onChange={(e) => setCf((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Weight</Label>
                            <Input inputMode="numeric" value={cf.weight} onChange={(e) => setCf((f) => ({ ...f, weight: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={cf.is_active} onCheckedChange={(c) => setCf((f) => ({ ...f, is_active: Boolean(c) }))} />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => void create()} disabled={busy || !cf.image_url.trim()}>
                            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit banner</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input value={ef.image_url} onChange={(e) => setEf((f) => ({ ...f, image_url: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Link URL</Label>
                            <Input value={ef.link_url} onChange={(e) => setEf((f) => ({ ...f, link_url: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={ef.name} onChange={(e) => setEf((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Weight</Label>
                            <Input inputMode="numeric" value={ef.weight} onChange={(e) => setEf((f) => ({ ...f, weight: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={ef.is_active} onCheckedChange={(c) => setEf((f) => ({ ...f, is_active: Boolean(c) }))} />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => void saveEdit()} disabled={busy}>
                            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
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
        postWithMethod(
            'put',
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

interface PlanRow {
    id: number;
    name: string;
    amount: number;
    currency: string;
    interval: string;
    removes_ads?: boolean;
    is_active?: boolean;
    coins?: number;
    stripe_price_id?: string | null;
}

export function PlansPanel({ plans: initialPlans }: { plans: Record<string, unknown>[] }) {
    const [name, setName] = useState('Pro');
    const [amount, setAmount] = useState('999');
    const [interval, setInterval] = useState('month');
    const [coins, setCoins] = useState('0');
    const [creating, setCreating] = useState(false);

    const [plans, setPlans] = useState<PlanRow[]>(() => initialPlans as PlanRow[]);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<PlanRow | null>(null);
    const [ef, setEf] = useState({ name: '', amount: '', interval: 'month', coins: '0', removes_ads: true, is_active: true });
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await apiJson<{ plans: PlanRow[] }>('/admin/subscription/plans');
            setPlans(res.plans ?? []);
        } catch {
            setPlans(initialPlans as PlanRow[]);
        }
    }, [initialPlans]);

    useEffect(() => {
        void load();
    }, [load]);

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
                coins: Number(coins) || 0,
            },
            {
                preserveScroll: true,
                onFinish: () => setCreating(false),
                onSuccess: () => {
                    toast.success('Plan created');
                    void load();
                },
                onError: (errors) => toast.error(inertiaErrorMessage(errors)),
            },
        );
    };

    const openEdit = (p: PlanRow) => {
        setEditing(p);
        setEf({
            name: p.name,
            amount: String(p.amount),
            interval: p.interval,
            coins: String(p.coins ?? 0),
            removes_ads: p.removes_ads !== false,
            is_active: p.is_active !== false,
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        setBusy(true);
        try {
            await apiJson(`/admin/subscription/plans/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: ef.name,
                    amount: Number(ef.amount),
                    interval: ef.interval,
                    currency: editing.currency,
                    removes_ads: ef.removes_ads,
                    is_active: ef.is_active,
                    coins: Number(ef.coins) || 0,
                }),
            });
            toast.success('Plan updated');
            setEditOpen(false);
            setEditing(null);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Subscription plans</CardTitle>
                    <CardDescription>Creates Stripe Product + Price when saved (requires Stripe secret).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 md:grid-cols-4">
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
                        <div>
                            <Label>Coins (local)</Label>
                            <Input value={coins} onChange={(e) => setCoins(e.target.value)} inputMode="numeric" />
                        </div>
                    </div>
                    <Button onClick={create} disabled={creating}>
                        Create & sync to Stripe
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing plans</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        {plans.map((p) => (
                            <li key={String(p.id)} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                                <span>
                                    {p.name} — {p.amount} {p.currency} / {p.interval} — coins: {p.coins ?? 0} (
                                    {String(p.stripe_price_id ?? 'no price')})
                                </span>
                                <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(p)}>
                                    <Pencil className="size-3" /> Edit
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit plan</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={ef.name} onChange={(e) => setEf((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (cents)</Label>
                            <Input inputMode="numeric" value={ef.amount} onChange={(e) => setEf((f) => ({ ...f, amount: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Interval</Label>
                            <Input value={ef.interval} onChange={(e) => setEf((f) => ({ ...f, interval: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Coins</Label>
                            <Input inputMode="numeric" value={ef.coins} onChange={(e) => setEf((f) => ({ ...f, coins: e.target.value }))} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={ef.removes_ads} onCheckedChange={(c) => setEf((f) => ({ ...f, removes_ads: Boolean(c) }))} />
                            <Label>Removes ads</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={ef.is_active} onCheckedChange={(c) => setEf((f) => ({ ...f, is_active: Boolean(c) }))} />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => void saveEdit()} disabled={busy}>
                            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Save & sync Stripe'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
