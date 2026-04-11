import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { postWithMethod } from '@/lib/inertia-form-method';
import { router } from '@inertiajs/react';
import { Info, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';

export interface LevelAdRuleRow {
    id: number;
    sort_order: number;
    level_from: number;
    level_to: number | null;
    ads_after_level_complete: number;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}

function inertiaErrorMessage(errors: Record<string, string | string[] | undefined>): string {
    const first = Object.values(errors).find(Boolean);
    if (Array.isArray(first)) return first[0] ?? 'Request failed';
    return typeof first === 'string' ? first : 'Request failed';
}

function formatRange(from: number, to: number | null): string {
    if (to === null) {
        return `${from}+`;
    }
    if (from === to) {
        return String(from);
    }
    return `${from}–${to}`;
}

type FormState = {
    sort_order: string;
    level_from: string;
    level_to: string;
    ads_after_level_complete: string;
    is_active: boolean;
};

const emptyForm = (): FormState => ({
    sort_order: '0',
    level_from: '1',
    level_to: '',
    ads_after_level_complete: '1',
    is_active: true,
});

function formFromRow(r: LevelAdRuleRow): FormState {
    return {
        sort_order: String(r.sort_order),
        level_from: String(r.level_from),
        level_to: r.level_to === null ? '' : String(r.level_to),
        ads_after_level_complete: String(r.ads_after_level_complete),
        is_active: r.is_active,
    };
}

function payloadFromForm(f: FormState): Record<string, unknown> {
    return {
        sort_order: Number(f.sort_order) || 0,
        level_from: Number(f.level_from),
        level_to: f.level_to.trim() === '' ? null : Number(f.level_to),
        ads_after_level_complete: Number(f.ads_after_level_complete),
        is_active: f.is_active,
    };
}

export function LevelAdRulesPanel({ levelRules }: { levelRules: LevelAdRuleRow[] }) {
    const sortedRules = useMemo(
        () => [...levelRules].sort((a, b) => a.sort_order - b.sort_order || a.level_from - b.level_from),
        [levelRules],
    );

    const [createForm, setCreateForm] = useState<FormState>(() => emptyForm());
    const [creating, setCreating] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<LevelAdRuleRow | null>(null);
    const [editForm, setEditForm] = useState<FormState>(emptyForm);
    const [savingEdit, setSavingEdit] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<LevelAdRuleRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const create = () => {
        setCreating(true);
        router.post(route('admin.ads.game-level-ad-rules.store'), payloadFromForm(createForm), {
            preserveScroll: true,
            onFinish: () => setCreating(false),
            onSuccess: () => {
                toast.success('Rule created');
                setCreateForm(emptyForm());
            },
            onError: (errors) => toast.error(inertiaErrorMessage(errors)),
        });
    };

    const openEdit = (r: LevelAdRuleRow) => {
        setEditing(r);
        setEditForm(formFromRow(r));
        setEditOpen(true);
    };

    const saveEdit = () => {
        if (!editing) return;
        setSavingEdit(true);
        postWithMethod(
            'patch',
            route('admin.ads.game-level-ad-rules.update', editing.id),
            payloadFromForm(editForm),
            {
                preserveScroll: true,
                onFinish: () => setSavingEdit(false),
                onSuccess: () => {
                    toast.success('Rule updated');
                    setEditOpen(false);
                    setEditing(null);
                },
                onError: (errors) => toast.error(inertiaErrorMessage(errors)),
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        postWithMethod('delete', route('admin.ads.game-level-ad-rules.destroy', deleteTarget.id), {}, {
            preserveScroll: true,
            onFinish: () => setDeleting(false),
            onSuccess: () => {
                toast.success('Rule deleted');
                setDeleteTarget(null);
            },
            onError: (errors) => toast.error(inertiaErrorMessage(errors)),
        });
    };

    const patchActive = (r: LevelAdRuleRow, is_active: boolean) => {
        postWithMethod('patch', route('admin.ads.game-level-ad-rules.update', r.id), { is_active }, {
            preserveScroll: true,
            onSuccess: () => toast.success(is_active ? 'Rule enabled' : 'Rule disabled'),
            onError: (errors) => toast.error(inertiaErrorMessage(errors)),
        });
    };

    return (
        <div className="space-y-8">
            <Alert>
                <Info className="size-4" />
                <AlertTitle>How rules apply</AlertTitle>
                <AlertDescription className="space-y-2 text-muted-foreground">
                    <p>
                        Rules are evaluated in <strong className="text-foreground">sort order</strong>, then by level range.
                        The first rule whose range contains the player&apos;s level wins when calling{' '}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /api/game/next-ad?level=…</code>.
                    </p>
                    <p>
                        <strong className="text-foreground">Ads after level complete</strong> is the number of interstitial
                        opportunities after finishing a level in this band (client may still throttle). Leave <strong>level to</strong>{' '}
                        empty for &quot;from this level upward&quot;.
                    </p>
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Plus className="size-5 opacity-70" />
                        Add rule
                    </CardTitle>
                    <CardDescription>Define a level band and how many ad slots to offer after a level completes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-2">
                            <Label htmlFor="create-sort">Sort order</Label>
                            <Input
                                id="create-sort"
                                inputMode="numeric"
                                value={createForm.sort_order}
                                onChange={(e) => setCreateForm((f) => ({ ...f, sort_order: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">Lower runs first</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-from">Level from</Label>
                            <Input
                                id="create-from"
                                inputMode="numeric"
                                min={1}
                                value={createForm.level_from}
                                onChange={(e) => setCreateForm((f) => ({ ...f, level_from: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-to">Level to</Label>
                            <Input
                                id="create-to"
                                inputMode="numeric"
                                placeholder="Open-ended"
                                value={createForm.level_to}
                                onChange={(e) => setCreateForm((f) => ({ ...f, level_to: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-ads">Ads after level</Label>
                            <Input
                                id="create-ads"
                                inputMode="numeric"
                                min={0}
                                value={createForm.ads_after_level_complete}
                                onChange={(e) =>
                                    setCreateForm((f) => ({ ...f, ads_after_level_complete: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex flex-col justify-end gap-2">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="create-active"
                                    checked={createForm.is_active}
                                    onCheckedChange={(checked) =>
                                        setCreateForm((f) => ({ ...f, is_active: Boolean(checked) }))
                                    }
                                />
                                <Label htmlFor="create-active" className="cursor-pointer">
                                    Active
                                </Label>
                            </div>
                        </div>
                    </div>
                    <Button onClick={create} disabled={creating} className="gap-2">
                        <Plus className="size-4" />
                        {creating ? 'Saving…' : 'Create rule'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Configured rules</CardTitle>
                    <CardDescription>
                        {sortedRules.length === 0
                            ? 'No rules yet — the API will not mark any level as eligible until you add one.'
                            : `${sortedRules.length} rule${sortedRules.length === 1 ? '' : 's'}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedRules.length === 0 ? (
                        <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                            Create a rule above to tie level ranges to ad opportunities.
                        </p>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">Order</TableHead>
                                            <TableHead>Level range</TableHead>
                                            <TableHead className="text-right">Ads after level</TableHead>
                                            <TableHead>Active</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedRules.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-mono text-muted-foreground">{r.sort_order}</TableCell>
                                                <TableCell>
                                                    <span className="font-medium tabular-nums">{formatRange(r.level_from, r.level_to)}</span>
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        (levels {r.level_from}
                                                        {r.level_to === null ? '–∞' : `–${r.level_to}`})
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {r.ads_after_level_complete}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={r.is_active}
                                                            onCheckedChange={(c) => patchActive(r, c)}
                                                            aria-label={r.is_active ? 'Deactivate rule' : 'Activate rule'}
                                                        />
                                                        <Badge variant={r.is_active ? 'default' : 'secondary'}>
                                                            {r.is_active ? 'On' : 'Off'}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Edit">
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteTarget(r)}
                                                            aria-label="Delete"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Separator className="my-4" />
                            <p className="text-xs text-muted-foreground">
                                Last updated timestamps are stored per row. Mobile apps read public rules from{' '}
                                <code className="rounded bg-muted px-1">GET /api/game/level-ad-settings</code>.
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit rule</DialogTitle>
                        <DialogDescription>Update sort order, level range, ad count, or active state.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Sort order</Label>
                            <Input
                                inputMode="numeric"
                                value={editForm.sort_order}
                                onChange={(e) => setEditForm((f) => ({ ...f, sort_order: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Level from</Label>
                            <Input
                                inputMode="numeric"
                                value={editForm.level_from}
                                onChange={(e) => setEditForm((f) => ({ ...f, level_from: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Level to (empty = open)</Label>
                            <Input
                                inputMode="numeric"
                                value={editForm.level_to}
                                onChange={(e) => setEditForm((f) => ({ ...f, level_to: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ads after level</Label>
                            <Input
                                inputMode="numeric"
                                value={editForm.ads_after_level_complete}
                                onChange={(e) =>
                                    setEditForm((f) => ({ ...f, ads_after_level_complete: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <Switch
                                checked={editForm.is_active}
                                onCheckedChange={(checked) => setEditForm((f) => ({ ...f, is_active: Boolean(checked) }))}
                            />
                            <Label>Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveEdit} disabled={savingEdit}>
                            {savingEdit ? 'Saving…' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this rule?</DialogTitle>
                        <DialogDescription>
                            This removes the level band configuration. Clients using{' '}
                            <code className="text-xs">/api/game/next-ad?level=…</code> will no longer match this rule.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteTarget ? (
                        <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                            Order {deleteTarget.sort_order}: levels{' '}
                            <strong>{formatRange(deleteTarget.level_from, deleteTarget.level_to)}</strong>,{' '}
                            {deleteTarget.ads_after_level_complete} ad(s) after level.
                        </p>
                    ) : null}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
