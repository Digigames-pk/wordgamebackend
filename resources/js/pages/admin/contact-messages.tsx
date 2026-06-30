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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { postWithMethod } from '@/lib/inertia-form-method';
import { webSessionJson } from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Eye, Loader2, Mail, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/ads/audio' },
    { title: 'Contact messages', href: '/admin/contact-messages' },
];

interface UserSummary {
    id: number;
    name: string;
    email: string;
}

export interface ContactMessageRow {
    id: number;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    status: string;
    created_at?: string;
    user?: UserSummary | null;
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
    if (status === 'new') return 'default';
    if (status === 'read') return 'secondary';
    return 'outline';
}

export default function AdminContactMessagesPage({ messages: initialMessages }: { messages: ContactMessageRow[] }) {
    const [messages, setMessages] = useState<ContactMessageRow[]>(initialMessages);
    const [busy, setBusy] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState<ContactMessageRow | null>(null);

    const reload = useCallback(async () => {
        try {
            const res = await webSessionJson<{ messages: ContactMessageRow[] }>(route('admin.contact-messages.data'));
            setMessages(res.messages ?? []);
        } catch {
            router.reload({ only: ['messages'] });
        }
    }, []);

    const openDetail = (row: ContactMessageRow) => {
        setSelected(row);
        setDetailOpen(true);
        if (row.status === 'new') {
            markStatus(row.id, 'read', false);
        }
    };

    const markStatus = (id: number, status: string, showToast = true) => {
        setBusy(true);
        postWithMethod(
            'patch',
            route('admin.contact-messages.update', id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    if (showToast) toast.success('Status updated');
                    void reload();
                    setSelected((s) => (s?.id === id ? { ...s, status } : s));
                },
                onError: () => toast.error('Update failed'),
            },
        );
    };

    const destroy = (id: number) => {
        if (!confirm('Delete this message?')) return;
        setBusy(true);
        postWithMethod('delete', route('admin.contact-messages.destroy', id), {}, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: () => {
                toast.success('Message deleted');
                setDetailOpen(false);
                setSelected(null);
                void reload();
            },
            onError: () => toast.error('Delete failed'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contact messages" />
            <div className="flex flex-col gap-6 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Contact messages
                        </CardTitle>
                        <CardDescription>Messages submitted via the public Contact Us form or mobile app.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {messages.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                No messages yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        messages.map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {m.created_at ? new Date(m.created_at).toLocaleString() : '—'}
                                                </TableCell>
                                                <TableCell>{m.name}</TableCell>
                                                <TableCell>{m.email}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">{m.subject ?? '—'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => openDetail(m)} disabled={busy}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => destroy(m.id)} disabled={busy}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selected?.subject || 'Contact message'}</DialogTitle>
                        <DialogDescription>
                            From {selected?.name} ({selected?.email})
                            {selected?.user ? ` — registered user: ${selected.user.name}` : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-64 rounded-md border p-4 text-sm whitespace-pre-wrap">{selected?.message}</ScrollArea>
                    <DialogFooter className="gap-2 sm:justify-between">
                        <div className="flex gap-2">
                            {selected && selected.status !== 'read' && (
                                <Button variant="secondary" disabled={busy} onClick={() => markStatus(selected.id, 'read')}>
                                    Mark read
                                </Button>
                            )}
                            {selected && selected.status !== 'archived' && (
                                <Button variant="outline" disabled={busy} onClick={() => markStatus(selected.id, 'archived')}>
                                    Archive
                                </Button>
                            )}
                        </div>
                        {selected && (
                            <Button variant="destructive" disabled={busy} onClick={() => destroy(selected.id)}>
                                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
