import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { apiJson } from '@/lib/api';
import { Loader2, Pencil, Plus, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function inertiaErrorMessage(errors: Record<string, string | string[] | undefined>): string {
    const first = Object.values(errors).find(Boolean);
    if (Array.isArray(first)) return first[0] ?? 'Request failed';
    return typeof first === 'string' ? first : 'Request failed';
}

interface Advertiser {
    id: string;
    name: string;
    company_name?: string | null;
    contact_name?: string | null;
    email?: string | null;
    is_active?: boolean;
}

interface AssetRow {
    id: string;
    advertiser_id?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ads', href: '/admin/ads/audio' },
    { title: 'Advertisers', href: '/admin/ads/advertisers' },
];

export default function AdminAdsAdvertisersPage({
    advertisers,
    assets,
}: {
    advertisers: Advertiser[];
    assets: AssetRow[];
}) {
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<Advertiser | null>(null);
    const [editForm, setEditForm] = useState({ name: '', company_name: '', contact_name: '', email: '', is_active: true });
    const [savingEdit, setSavingEdit] = useState(false);
    const [form, setForm] = useState({
        name: '',
        company_name: '',
        contact_name: '',
        email: '',
    });

    const counts = useMemo(() => {
        const m = new Map<string, number>();
        for (const a of assets) {
            if (a.advertiser_id) {
                m.set(a.advertiser_id, (m.get(a.advertiser_id) ?? 0) + 1);
            }
        }
        return m;
    }, [assets]);

    const openEdit = (a: Advertiser) => {
        setEditing(a);
        setEditForm({
            name: a.name,
            company_name: a.company_name ?? '',
            contact_name: a.contact_name ?? '',
            email: a.email ?? '',
            is_active: a.is_active !== false,
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        setSavingEdit(true);
        try {
            await apiJson(`/advertisers/${editing.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: editForm.name,
                    company_name: editForm.company_name || null,
                    contact_name: editForm.contact_name || null,
                    email: editForm.email || null,
                    is_active: editForm.is_active,
                }),
            });
            toast.success('Advertiser updated');
            setEditOpen(false);
            setEditing(null);
            router.reload({ only: ['advertisers', 'assets'] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setSavingEdit(false);
        }
    };

    const createAdvertiser = () => {
        setCreating(true);
        router.post(
            route('admin.ads.advertisers.store'),
            {
                name: form.name,
                company_name: form.company_name || undefined,
                contact_name: form.contact_name || undefined,
                email: form.email || undefined,
                is_active: true,
            },
            {
                preserveScroll: true,
                onFinish: () => setCreating(false),
                onSuccess: () => {
                    setOpen(false);
                    setForm({ name: '', company_name: '', contact_name: '', email: '' });
                    toast.success('Advertiser created');
                },
                onError: (errors) => toast.error(inertiaErrorMessage(errors)),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Advertisers" />
            <div className="mx-auto max-w-7xl space-y-8 p-8">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="font-display text-3xl font-bold tracking-tight">Advertisers</h2>
                        <p className="mt-1 text-muted-foreground">Brands and agencies that own ad assets.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => router.reload({ only: ['advertisers', 'assets'] })}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => setOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add advertiser
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {advertisers.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">No advertisers yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Linked assets</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {advertisers.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell className="font-medium">{a.name}</TableCell>
                                            <TableCell>{a.company_name ?? '—'}</TableCell>
                                            <TableCell>{a.contact_name ?? '—'}</TableCell>
                                            <TableCell>{a.email ?? '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={a.is_active !== false ? 'default' : 'secondary'}>
                                                    {a.is_active !== false ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{counts.get(a.id) ?? 0}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(a)} aria-label="Edit">
                                                    <Pencil className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add advertiser</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Required" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Company</Label>
                            <Input
                                value={form.company_name}
                                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Contact</Label>
                            <Input
                                value={form.contact_name}
                                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={createAdvertiser} disabled={!form.name.trim() || creating}>
                            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit advertiser</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Company</Label>
                            <Input
                                value={editForm.company_name}
                                onChange={(e) => setEditForm((f) => ({ ...f, company_name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Contact</Label>
                            <Input
                                value={editForm.contact_name}
                                onChange={(e) => setEditForm((f) => ({ ...f, contact_name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
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
                        <Button onClick={() => void saveEdit()} disabled={!editForm.name.trim() || savingEdit}>
                            {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
