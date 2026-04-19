import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { apiJson } from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Eye, Loader2, Pencil, Plus, Shield, Trash2, User } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/ads/audio' },
    { title: 'Users', href: '/admin/users' },
];

interface DeviceState {
    id: number;
    device_id: string;
    last_level: number;
    coins: number;
}

interface Plan {
    id: number;
    name: string;
}

interface SubscriptionRow {
    id: number;
    status: string;
    stripe_subscription_id?: string | null;
    current_period_end?: string | null;
    plan?: Plan | null;
}

export interface AdminUserRow {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    coins_earned?: number;
    email_verified_at?: string | null;
    created_at?: string;
    device_state?: DeviceState | null;
    subscriptions?: SubscriptionRow[];
}

export default function AdminUsersPage({ users: initialUsers }: { users: AdminUserRow[] }) {
    const page = usePage<{ auth: { user?: { id: number } } }>();
    const currentId = page.props.auth.user?.id;

    const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
    const [busy, setBusy] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_admin: false,
    });

    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<AdminUserRow | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_admin: false,
    });

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);

    const reloadUsers = useCallback(async () => {
        try {
            const res = await apiJson<{ users: AdminUserRow[] }>('/admin/users');
            setUsers(res.users ?? []);
        } catch {
            router.reload({ only: ['users'] });
        }
    }, []);

    const openCreate = () => {
        setCreateForm({ name: '', email: '', password: '', password_confirmation: '', is_admin: false });
        setCreateOpen(true);
    };

    const createUser = async () => {
        setBusy(true);
        try {
            await apiJson('/admin/users', {
                method: 'POST',
                body: JSON.stringify({
                    name: createForm.name.trim(),
                    email: createForm.email.trim(),
                    password: createForm.password,
                    password_confirmation: createForm.password_confirmation,
                    is_admin: createForm.is_admin,
                }),
            });
            toast.success('User created');
            setCreateOpen(false);
            await reloadUsers();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Create failed');
        } finally {
            setBusy(false);
        }
    };

    const openEdit = (u: AdminUserRow) => {
        setEditing(u);
        setEditForm({
            name: u.name,
            email: u.email,
            password: '',
            password_confirmation: '',
            is_admin: u.is_admin === true,
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!editing) return;
        setBusy(true);
        try {
            const body: Record<string, unknown> = {
                name: editForm.name.trim(),
                email: editForm.email.trim(),
                is_admin: editForm.is_admin,
            };
            if (editForm.password) {
                body.password = editForm.password;
                body.password_confirmation = editForm.password_confirmation;
            }
            await apiJson(`/admin/users/${editing.id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            toast.success('User updated');
            setEditOpen(false);
            setEditing(null);
            await reloadUsers();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setBusy(false);
        }
    };

    const destroy = async (u: AdminUserRow) => {
        if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
        setBusy(true);
        try {
            await apiJson(`/admin/users/${u.id}`, { method: 'DELETE' });
            toast.success('User deleted');
            await reloadUsers();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="mx-auto max-w-7xl space-y-6 p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="font-display text-3xl font-bold tracking-tight">Users</h2>
                        <p className="mt-1 text-muted-foreground">
                            Full CRUD for app users. <strong className="text-foreground">Admin</strong> grants dashboard and API admin
                            access (super admin for this project). Linked device progress and subscriptions are shown in details.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="size-4" /> Add user
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Directory</CardTitle>
                        <CardDescription>Passwords are never shown. Edit to set a new password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Coins</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Subscriptions</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => {
                                        const subs = u.subscriptions ?? [];
                                        const active = subs.filter((s) => s.status === 'active');
                                        return (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.name}</TableCell>
                                                <TableCell className="text-sm">{u.email}</TableCell>
                                                <TableCell>
                                                    {u.is_admin ? (
                                                        <Badge className="gap-1">
                                                            <Shield className="size-3" /> Admin
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <User className="size-3" /> User
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">{u.coins_earned ?? 0}</TableCell>
                                                <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                                                    {u.device_state
                                                        ? `${u.device_state.device_id.slice(0, 12)}… · L${u.device_state.last_level}`
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {subs.length === 0 ? (
                                                        '—'
                                                    ) : (
                                                        <span>
                                                            {active.length} active / {subs.length} total
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setDetailUser(u);
                                                                setDetailOpen(true);
                                                            }}
                                                            aria-label="View details"
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)} disabled={busy}>
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => destroy(u)}
                                                            disabled={busy || u.id === currentId}
                                                            className="text-destructive"
                                                            title={u.id === currentId ? 'Cannot delete yourself' : 'Delete'}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add user</DialogTitle>
                        <DialogDescription>Create an account. Check Admin for full dashboard access.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={createForm.email}
                                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                value={createForm.password}
                                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm password</Label>
                            <Input
                                type="password"
                                value={createForm.password_confirmation}
                                onChange={(e) => setCreateForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={createForm.is_admin}
                                onCheckedChange={(c) => setCreateForm((f) => ({ ...f, is_admin: Boolean(c) }))}
                            />
                            <Label>Admin (super admin access)</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void createUser()}
                            disabled={
                                busy ||
                                !createForm.name.trim() ||
                                !createForm.email.trim() ||
                                !createForm.password ||
                                createForm.password !== createForm.password_confirmation
                            }
                        >
                            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit user</DialogTitle>
                        <DialogDescription>Leave password blank to keep the current password.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New password (optional)</Label>
                            <Input
                                type="password"
                                value={editForm.password}
                                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm new password</Label>
                            <Input
                                type="password"
                                value={editForm.password_confirmation}
                                onChange={(e) => setEditForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={editForm.is_admin}
                                onCheckedChange={(c) => setEditForm((f) => ({ ...f, is_admin: Boolean(c) }))}
                            />
                            <Label>Admin (super admin access)</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void saveEdit()}
                            disabled={
                                busy ||
                                !editForm.name.trim() ||
                                !editForm.email.trim() ||
                                (!!editForm.password && editForm.password !== editForm.password_confirmation)
                            }
                        >
                            {busy ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>User details</DialogTitle>
                        <DialogDescription>{detailUser?.email}</DialogDescription>
                    </DialogHeader>
                    {detailUser ? (
                        <ScrollArea className="max-h-[60vh] pr-3">
                            <div className="space-y-4 text-sm">
                                <div>
                                    <h4 className="mb-1 font-medium">Account</h4>
                                    <ul className="space-y-1 rounded-md border bg-muted/40 p-3 font-mono text-xs">
                                        <li>id: {detailUser.id}</li>
                                        <li>name: {detailUser.name}</li>
                                        <li>is_admin: {String(detailUser.is_admin)}</li>
                                        <li>coins_earned: {detailUser.coins_earned ?? 0}</li>
                                        <li>verified: {detailUser.email_verified_at ?? '—'}</li>
                                        <li>created: {detailUser.created_at ?? '—'}</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="mb-1 font-medium">Device state (linked)</h4>
                                    {detailUser.device_state ? (
                                        <ul className="space-y-1 rounded-md border bg-muted/40 p-3 font-mono text-xs">
                                            <li>id: {detailUser.device_state.id}</li>
                                            <li>device_id: {detailUser.device_state.device_id}</li>
                                            <li>last_level: {detailUser.device_state.last_level}</li>
                                            <li>coins: {detailUser.device_state.coins}</li>
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground">No device linked.</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="mb-1 font-medium">Subscriptions</h4>
                                    {(detailUser.subscriptions ?? []).length === 0 ? (
                                        <p className="text-muted-foreground">None.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {(detailUser.subscriptions ?? []).map((s) => (
                                                <li key={s.id} className="rounded-md border bg-muted/40 p-3 font-mono text-xs">
                                                    <div>id: {s.id}</div>
                                                    <div>status: {s.status}</div>
                                                    <div>plan: {s.plan?.name ?? '—'}</div>
                                                    <div>stripe_subscription_id: {s.stripe_subscription_id ?? '—'}</div>
                                                    <div>current_period_end: {s.current_period_end ?? '—'}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    ) : null}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
