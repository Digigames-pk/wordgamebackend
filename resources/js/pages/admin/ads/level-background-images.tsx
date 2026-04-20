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
import AppLayout from '@/layouts/app-layout';
import { postWithMethod } from '@/lib/inertia-form-method';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Level backgrounds', href: '/admin/ads/level-backgrounds' },
];

interface Row {
    id: number;
    image_url: string;
    title?: string | null;
    sort_order: number;
    is_active: boolean;
}

function inertiaErrorMessage(errors: Record<string, string | string[] | undefined>): string {
    const first = Object.values(errors).find(Boolean);
    if (Array.isArray(first)) return first[0] ?? 'Request failed';
    return typeof first === 'string' ? first : 'Request failed';
}

export default function LevelBackgroundImagesPage({ images }: { images: Row[] }) {
    const rows = images;
    const [busy, setBusy] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({ image_url: '', title: '', sort_order: '0', is_active: true });
    const [file, setFile] = useState<File | null>(null);

    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [editForm, setEditForm] = useState({ image_url: '', title: '', sort_order: '0', is_active: true });

    const create = () => {
        setBusy(true);
        const fd = new FormData();
        const url = form.image_url.trim();
        if (url) {
            fd.append('image_url', url);
        }
        fd.append('title', form.title.trim());
        fd.append('sort_order', String(Number(form.sort_order) || 0));
        fd.append('is_active', form.is_active ? '1' : '0');
        if (file) {
            fd.append('file', file);
        }
        router.post(route('admin.ads.level-background-images.store'), fd, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: () => {
                toast.success('Image saved');
                setCreateOpen(false);
                setForm({ image_url: '', title: '', sort_order: '0', is_active: true });
                setFile(null);
            },
            onError: (errors) => toast.error(inertiaErrorMessage(errors)),
        });
    };

    const openEdit = (r: Row) => {
        setEditing(r);
        setEditForm({
            image_url: r.image_url,
            title: r.title ?? '',
            sort_order: String(r.sort_order),
            is_active: r.is_active,
        });
        setEditOpen(true);
    };

    const saveEdit = () => {
        if (!editing) return;
        setBusy(true);
        postWithMethod(
            'patch',
            route('admin.ads.level-background-images.update', editing.id),
            {
                image_url: editForm.image_url,
                title: editForm.title.trim() || null,
                sort_order: Number(editForm.sort_order) || 0,
                is_active: editForm.is_active,
            },
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    toast.success('Updated');
                    setEditOpen(false);
                    setEditing(null);
                },
                onError: (errors) => toast.error(inertiaErrorMessage(errors)),
            },
        );
    };

    const destroy = (r: Row) => {
        if (!confirm(`Delete background #${r.id}?`)) return;
        setBusy(true);
        postWithMethod('delete', route('admin.ads.level-background-images.destroy', r.id), {}, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: () => toast.success('Deleted'),
            onError: (errors) => toast.error(inertiaErrorMessage(errors)),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Level background images" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="font-display text-3xl font-bold tracking-tight">Level background images</h2>
                        <p className="mt-1 text-muted-foreground">
                            Upload image files with the same dashboard flow as banner ads, or paste a URL.
                        </p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="gap-2">
                        <Plus className="size-4" /> Add image
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Library</CardTitle>
                        <CardDescription>Inactive rows are ignored by the random selector.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {rows.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">No images yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-24">Preview</TableHead>
                                        <TableHead>URL</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div className="flex max-w-[220px] flex-col gap-1">
                                                    <span className="truncate font-mono text-[11px] text-muted-foreground" title={r.image_url}>
                                                        {r.image_url.split('/').filter(Boolean).pop() ?? r.image_url}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 w-fit gap-1 text-xs"
                                                        onClick={() => {
                                                            setPreviewSrc(r.image_url);
                                                            setPreviewOpen(true);
                                                        }}
                                                    >
                                                        Preview
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate font-mono text-xs">{r.image_url}</TableCell>
                                            <TableCell>{r.title ?? '—'}</TableCell>
                                            <TableCell>{r.sort_order}</TableCell>
                                            <TableCell>{r.is_active ? 'Yes' : 'No'}</TableCell>
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
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add background</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Upload file (Wasabi)</Label>
                            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Or image URL</Label>
                            <Input
                                value={form.image_url}
                                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                                placeholder="https://…"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Sort order</Label>
                            <Input
                                inputMode="numeric"
                                value={form.sort_order}
                                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: Boolean(c) }))} />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => create()} disabled={busy} className="gap-2">
                            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit background</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                                value={editForm.image_url}
                                onChange={(e) => setEditForm((f) => ({ ...f, image_url: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Sort order</Label>
                            <Input
                                inputMode="numeric"
                                value={editForm.sort_order}
                                onChange={(e) => setEditForm((f) => ({ ...f, sort_order: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={editForm.is_active}
                                onCheckedChange={(c) => setEditForm((f) => ({ ...f, is_active: Boolean(c) }))}
                            />
                            <Label>Active</Label>
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

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Background preview</DialogTitle>
                    </DialogHeader>
                    {previewSrc ? (
                        <div className="flex max-h-[70vh] justify-center overflow-auto rounded-md border bg-muted/30 p-2">
                            <img src={previewSrc} alt="Background preview" className="max-h-[65vh] max-w-full object-contain" />
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
