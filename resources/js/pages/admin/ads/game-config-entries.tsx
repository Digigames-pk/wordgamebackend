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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { postWithMethod } from '@/lib/inertia-form-method';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Game configs', href: '/admin/ads/game-configs' },
];

interface Row {
    id: number;
    entry_key: string;
    entry_value: string | null;
}

export default function GameConfigEntriesPage({ configs }: { configs: Row[] }) {
    const rows = useMemo(() => configs ?? [], [configs]);
    const [busy, setBusy] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({ entry_key: '', entry_value: '' });

    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [editForm, setEditForm] = useState({ entry_key: '', entry_value: '' });

    const create = () => {
        setBusy(true);
        router.post(
            route('admin.ads.game-config-entries.store'),
            {
                entry_key: form.entry_key.trim(),
                entry_value: form.entry_value,
            },
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    toast.success('Config created');
                    setCreateOpen(false);
                    setForm({ entry_key: '', entry_value: '' });
                    router.reload({ only: ['configs'] });
                },
                onError: () => toast.error('Save failed'),
            },
        );
    };

    const openEdit = (r: Row) => {
        setEditing(r);
        setEditForm({ entry_key: r.entry_key, entry_value: r.entry_value ?? '' });
        setEditOpen(true);
    };

    const saveEdit = () => {
        if (!editing) return;
        setBusy(true);
        postWithMethod(
            'patch',
            route('admin.ads.game-config-entries.update', editing.id),
            {
                entry_key: editForm.entry_key.trim(),
                entry_value: editForm.entry_value,
            },
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    toast.success('Updated');
                    setEditOpen(false);
                    setEditing(null);
                    router.reload({ only: ['configs'] });
                },
                onError: () => toast.error('Update failed'),
            },
        );
    };

    const destroy = (r: Row) => {
        if (!confirm(`Delete config “${r.entry_key}”?`)) return;
        setBusy(true);
        postWithMethod('delete', route('admin.ads.game-config-entries.destroy', r.id), {}, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: () => {
                toast.success('Deleted');
                router.reload({ only: ['configs'] });
            },
            onError: () => toast.error('Delete failed'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Game configs" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="font-display text-3xl font-bold tracking-tight">Game configs</h2>
                        <p className="mt-1 text-muted-foreground">
                            Key–value settings (for example <code className="text-xs">level_coins</code>) exposed on{' '}
                            <code className="text-xs">GET /api/game/mobile-configs</code>.
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus className="size-4" /> Add entry
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Entries</CardTitle>
                        <CardDescription>Values are returned to clients as JSON (numbers are coerced when numeric).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {rows.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">No config rows yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Key</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-mono text-sm">{r.entry_key}</TableCell>
                                            <TableCell className="max-w-md truncate font-mono text-xs">{r.entry_value ?? '—'}</TableCell>
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
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add config</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Key</Label>
                            <Input
                                value={form.entry_key}
                                onChange={(e) => setForm((f) => ({ ...f, entry_key: e.target.value }))}
                                placeholder="level_coins"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Value</Label>
                            <Textarea
                                value={form.entry_value}
                                onChange={(e) => setForm((f) => ({ ...f, entry_value: e.target.value }))}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => create()} disabled={busy || !form.entry_key.trim()}>
                            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit config</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Key</Label>
                            <Input value={editForm.entry_key} onChange={(e) => setEditForm((f) => ({ ...f, entry_key: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Value</Label>
                            <Textarea
                                value={editForm.entry_value}
                                onChange={(e) => setEditForm((f) => ({ ...f, entry_value: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => saveEdit()} disabled={busy}>
                            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
