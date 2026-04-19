import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AdminAdvertiserOption } from '@/pages/admin/ads/ads-type-view';
import { apiJson } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export type EditableAdAsset = {
    id: string;
    name: string;
    type?: string | null;
    format?: string | null;
    placement_type?: string | null;
    weight?: number | null;
    duration_sec?: number | null;
    skip_after_sec?: number | null;
    is_skippable?: boolean | null;
    click_through_url?: string | null;
    banner_position?: string | null;
    banner_size?: string | null;
    status?: string | null;
    asset_url?: string | null;
    video_url?: string | null;
    thumbnail_url?: string | null;
    vast_tag_url?: string | null;
    vmap_tag_url?: string | null;
    advertiser_id?: string | null;
    max_impressions?: number | null;
    max_clicks?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    aspect_ratio?: string | null;
};

function isBannerAsset(a: EditableAdAsset | null): boolean {
    if (!a) return false;
    return a.format === 'banner' || a.type === 'banner' || a.type === 'display';
}

function isVastAsset(a: EditableAdAsset | null): boolean {
    if (!a) return false;
    return a.type === 'vast' || !!a.vast_tag_url || !!a.vmap_tag_url;
}

export function EditAdAssetDialog({
    asset,
    open,
    onOpenChange,
    onSaved,
    advertisers,
}: {
    asset: EditableAdAsset | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
    advertisers: AdminAdvertiserOption[];
}) {
    const banner = useMemo(() => isBannerAsset(asset), [asset]);
    const vast = useMemo(() => isVastAsset(asset), [asset]);

    const [busy, setBusy] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [format, setFormat] = useState('');
    const [advertiser_id, setAdvertiserId] = useState('');
    const [placement_type, setPlacementType] = useState('all');
    const [weight, setWeight] = useState('5');
    const [duration_sec, setDurationSec] = useState('30');
    const [skip_after_sec, setSkipAfterSec] = useState('5');
    const [is_skippable, setIsSkippable] = useState(true);
    const [click_through_url, setClickThrough] = useState('');
    const [banner_position, setBannerPosition] = useState('bottom');
    const [banner_size, setBannerSize] = useState('medium');
    const [status, setStatus] = useState('approved');
    const [asset_url, setAssetUrl] = useState('');
    const [video_url, setVideoUrl] = useState('');
    const [thumbnail_url, setThumbnailUrl] = useState('');
    const [vast_tag_url, setVastTagUrl] = useState('');
    const [vmap_tag_url, setVmapTagUrl] = useState('');
    const [max_impressions, setMaxImpressions] = useState('');
    const [max_clicks, setMaxClicks] = useState('');
    const [start_date, setStartDate] = useState('');
    const [end_date, setEndDate] = useState('');
    const [aspect_ratio, setAspectRatio] = useState('');

    useEffect(() => {
        if (!asset) return;
        setName(asset.name ?? '');
        setType(asset.type ?? '');
        setFormat(asset.format ?? '');
        setAdvertiserId(asset.advertiser_id ?? '');
        setPlacementType((asset.placement_type as string) || 'all');
        setWeight(String(asset.weight ?? 5));
        setDurationSec(String(asset.duration_sec ?? 30));
        setSkipAfterSec(String(asset.skip_after_sec ?? 5));
        setIsSkippable(asset.is_skippable !== false);
        setClickThrough(asset.click_through_url ?? '');
        setBannerPosition((asset.banner_position as string) || 'bottom');
        setBannerSize((asset.banner_size as string) || 'medium');
        setStatus((asset.status as string) || 'approved');
        setAssetUrl(asset.asset_url ?? '');
        setVideoUrl(asset.video_url ?? '');
        setThumbnailUrl(asset.thumbnail_url ?? '');
        setVastTagUrl(asset.vast_tag_url ?? '');
        setVmapTagUrl(asset.vmap_tag_url ?? '');
        setMaxImpressions(asset.max_impressions != null ? String(asset.max_impressions) : '');
        setMaxClicks(asset.max_clicks != null ? String(asset.max_clicks) : '');
        setStartDate(asset.start_date ? String(asset.start_date).slice(0, 16) : '');
        setEndDate(asset.end_date ? String(asset.end_date).slice(0, 16) : '');
        setAspectRatio(asset.aspect_ratio ?? '');
    }, [asset]);

    const save = async () => {
        if (!asset) return;
        setBusy(true);
        try {
            const body: Record<string, unknown> = {
                name,
                type: type || undefined,
                format: format || undefined,
                advertiser_id: advertiser_id || null,
                placement_type,
                weight: Number(weight) || 5,
                duration_sec: Number(duration_sec) || 0,
                skip_after_sec: skip_after_sec === '' ? null : Number(skip_after_sec),
                is_skippable,
                click_through_url: click_through_url || null,
                status,
                asset_url: asset_url || null,
                video_url: video_url || null,
                thumbnail_url: thumbnail_url || null,
                vast_tag_url: vast_tag_url || null,
                vmap_tag_url: vmap_tag_url || null,
                max_impressions: max_impressions === '' ? null : Number(max_impressions),
                max_clicks: max_clicks === '' ? null : Number(max_clicks),
                start_date: start_date || null,
                end_date: end_date || null,
                aspect_ratio: aspect_ratio || null,
            };
            if (banner) {
                body.banner_position = banner_position;
                body.banner_size = banner_size || null;
            }

            await apiJson(`/ads/assets/${asset.id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
            toast.success('Ad updated');
            onOpenChange(false);
            onSaved();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Update failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 p-0 sm:max-w-2xl">
                <DialogHeader className="shrink-0 border-b px-6 py-4 pr-14">
                    <DialogTitle>Edit ad</DialogTitle>
                    <DialogDescription>
                        All fields for this asset. Banner position and size apply to banner/display ads only.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-10rem)] px-6">
                    <div className="grid gap-4 py-4 pr-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="audio, video, vast, banner…" />
                            </div>
                            <div className="space-y-2">
                                <Label>Format</Label>
                                <Input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="audio, video, banner…" />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Advertiser</Label>
                                <Select value={advertiser_id || '__none__'} onValueChange={(v) => setAdvertiserId(v === '__none__' ? '' : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">None (global)</SelectItem>
                                        {advertisers.map((adv) => (
                                            <SelectItem key={adv.id} value={adv.id}>
                                                {adv.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Placement</Label>
                                <Select value={placement_type} onValueChange={setPlacementType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="preroll">Pre-roll</SelectItem>
                                        <SelectItem value="midroll">Mid-roll</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Weight (1–10)</Label>
                                <Input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (sec)</Label>
                                <Input inputMode="numeric" value={duration_sec} onChange={(e) => setDurationSec(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Skip after (sec)</Label>
                                <Input inputMode="numeric" value={skip_after_sec} onChange={(e) => setSkipAfterSec(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Switch checked={is_skippable} onCheckedChange={(c) => setIsSkippable(Boolean(c))} />
                                <Label>Skippable</Label>
                            </div>
                        </div>

                        {banner ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Banner position</Label>
                                    <Select value={banner_position} onValueChange={setBannerPosition}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bottom">Bottom</SelectItem>
                                            <SelectItem value="top">Top</SelectItem>
                                            <SelectItem value="overlay">Overlay</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Banner size</Label>
                                    <Input value={banner_size} onChange={(e) => setBannerSize(e.target.value)} placeholder="medium, large…" />
                                </div>
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <Label>Asset URL</Label>
                            <Textarea value={asset_url} onChange={(e) => setAssetUrl(e.target.value)} rows={2} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-2">
                            <Label>Video URL</Label>
                            <Textarea value={video_url} onChange={(e) => setVideoUrl(e.target.value)} rows={2} className="font-mono text-xs" />
                        </div>
                        <div className="space-y-2">
                            <Label>Thumbnail URL</Label>
                            <Textarea
                                value={thumbnail_url}
                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                rows={2}
                                className="font-mono text-xs"
                            />
                        </div>

                        {vast ? (
                            <>
                                <div className="space-y-2">
                                    <Label>VAST tag URL</Label>
                                    <Textarea
                                        value={vast_tag_url}
                                        onChange={(e) => setVastTagUrl(e.target.value)}
                                        rows={3}
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>VMAP tag URL</Label>
                                    <Textarea
                                        value={vmap_tag_url}
                                        onChange={(e) => setVmapTagUrl(e.target.value)}
                                        rows={3}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </>
                        ) : null}

                        <div className="space-y-2">
                            <Label>Aspect ratio</Label>
                            <Input value={aspect_ratio} onChange={(e) => setAspectRatio(e.target.value)} placeholder="16:9" />
                        </div>
                        <div className="space-y-2">
                            <Label>Click-through URL</Label>
                            <Input value={click_through_url} onChange={(e) => setClickThrough(e.target.value)} placeholder="https://…" />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Max impressions</Label>
                                <Input inputMode="numeric" value={max_impressions} onChange={(e) => setMaxImpressions(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Max clicks</Label>
                                <Input inputMode="numeric" value={max_clicks} onChange={(e) => setMaxClicks(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Start (local)</Label>
                                <Input type="datetime-local" value={start_date} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>End (local)</Label>
                                <Input type="datetime-local" value={end_date} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="approved">Approved (active)</SelectItem>
                                    <SelectItem value="paused">Paused</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="shrink-0 border-t px-6 py-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => void save()} disabled={busy || !name.trim()}>
                        {busy ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
