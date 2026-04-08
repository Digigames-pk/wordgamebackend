import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiJson } from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    ChevronRight,
    ExternalLink,
    FileAudio,
    Globe,
    Image as ImageIcon,
    Library,
    Link as LinkIcon,
    Loader2,
    Target,
    Upload,
    Users,
    Video,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type CreateAdType = 'audio' | 'video' | 'banner' | 'vast';

interface LibraryAsset {
    id: string;
    name: string;
    type: string;
    format?: string;
    asset_url?: string | null;
    vast_tag_url?: string | null;
}

function filterByType(assets: LibraryAsset[], t: CreateAdType): LibraryAsset[] {
    return assets.filter((c) => {
        if (t === 'vast') {
            return c.type === 'vast' || !!c.vast_tag_url;
        }
        if (t === 'video') {
            return (c.format === 'video' || c.type === 'video') && c.type !== 'vast' && !c.vast_tag_url;
        }
        if (t === 'banner') {
            return c.type === 'banner' || c.type === 'display' || c.format === 'banner';
        }
        return c.format === 'audio' || c.type === 'audio';
    });
}

export function AddAdCampaignDialog({
    open,
    onOpenChange,
    defaultAdType,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultAdType: CreateAdType;
    onCreated: () => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [createAdType, setCreateAdType] = useState<CreateAdType>(defaultAdType);
    const [assetSource, setAssetSource] = useState<'upload' | 'library' | 'url'>('upload');
    const [form, setForm] = useState({
        name: '',
        placement_type: 'all' as 'preroll' | 'midroll' | 'all',
        weight: 5,
        duration_sec: 30,
        skip_after_sec: 5,
        nonSkippable: false,
        vast_tag_url: '',
        click_through_url: '',
        advertiser_id: '',
        library_asset_id: '',
        external_asset_url: '',
        display_start_sec: 0,
        display_duration_sec: 10,
        target_tier: 'free' as 'free' | 'all' | 'paid',
        station_name: '',
        max_impressions: '',
        max_clicks: '',
        start_date: '',
        end_date: '',
    });
    const [file, setFile] = useState<File | null>(null);

    const assetsQ = useQuery({
        queryKey: ['admin', 'ads', 'assets'],
        queryFn: () => apiJson<{ assets: LibraryAsset[] }>('/ads/assets'),
        enabled: open,
    });
    const advertisersQ = useQuery({
        queryKey: ['admin', 'advertisers'],
        queryFn: () => apiJson<{ advertisers: { id: string; name: string }[] }>('/advertisers'),
        enabled: open,
    });

    const libraryOptions = useMemo(
        () => filterByType(assetsQ.data?.assets ?? [], createAdType),
        [assetsQ.data?.assets, createAdType],
    );

    const resetForm = useCallback(() => {
        setCreateAdType(defaultAdType);
        setAssetSource('upload');
        setForm({
            name: '',
            placement_type: 'all',
            weight: 5,
            duration_sec: 30,
            skip_after_sec: 5,
            nonSkippable: false,
            vast_tag_url: '',
            click_through_url: '',
            advertiser_id: '',
            library_asset_id: '',
            external_asset_url: '',
            display_start_sec: 0,
            display_duration_sec: 10,
            target_tier: 'free',
            station_name: '',
            max_impressions: '',
            max_clicks: '',
            start_date: '',
            end_date: '',
        });
        setFile(null);
        setUploadProgress(0);
        if (fileRef.current) fileRef.current.value = '';
    }, [defaultAdType]);

    useEffect(() => {
        if (open) {
            resetForm();
        }
    }, [open, defaultAdType, resetForm]);

    const createMut = useMutation({
        mutationFn: async (payload: { kind: 'multipart'; fd: FormData } | { kind: 'json'; body: Record<string, unknown> }) => {
            if (payload.kind === 'multipart') {
                return apiJson('/ads/assets', {
                    method: 'POST',
                    body: payload.fd,
                });
            }
            return apiJson('/ads/assets/json', {
                method: 'POST',
                body: JSON.stringify(payload.body),
            });
        },
        onSuccess: () => {
            onCreated();
            onOpenChange(false);
            resetForm();
            toast.success('Ad campaign created');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const appendTypeToFormData = (fd: FormData, t: CreateAdType) => {
        if (t === 'vast') {
            fd.append('type', 'vast');
            fd.append('format', 'video');
        } else if (t === 'banner') {
            fd.append('type', 'display');
            fd.append('format', 'banner');
            fd.append('banner_position', 'bottom');
            fd.append('banner_size', 'medium');
        } else if (t === 'video') {
            fd.append('type', 'video');
            fd.append('format', 'video');
        } else {
            fd.append('type', 'audio');
            fd.append('format', 'audio');
        }
    };

    const buildMetadata = () => {
        const m: Record<string, string> = {
            target_tier: form.target_tier,
        };
        if (form.station_name.trim()) {
            m.station = form.station_name.trim();
        }
        return m;
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.error('Enter a campaign name');
            return;
        }

        const t = createAdType;
        const metadata = buildMetadata();

        if (t === 'vast') {
            if (!form.vast_tag_url.trim()) {
                toast.error('Enter a VAST tag URL');
                return;
            }
            await createMut.mutateAsync({
                kind: 'json',
                body: {
                    name: form.name.trim(),
                    type: 'vast',
                    format: 'video',
                    placement_type: form.placement_type,
                    weight: form.weight,
                    duration_sec: form.duration_sec,
                    skip_after_sec: form.skip_after_sec,
                    is_skippable: !form.nonSkippable,
                    vast_tag_url: form.vast_tag_url.trim(),
                    asset_url: form.vast_tag_url.trim() || 'programmatic://vast-vmap-ad',
                    click_through_url: form.click_through_url || undefined,
                    advertiser_id: form.advertiser_id || undefined,
                    max_impressions: form.max_impressions ? Number(form.max_impressions) : undefined,
                    max_clicks: form.max_clicks ? Number(form.max_clicks) : undefined,
                    start_date: form.start_date || undefined,
                    end_date: form.end_date || undefined,
                    metadata,
                },
            });
            return;
        }

        if (assetSource === 'url') {
            const u = form.external_asset_url.trim();
            if (!u.startsWith('http://') && !u.startsWith('https://')) {
                toast.error('Enter a valid http(s) asset URL');
                return;
            }
            const body: Record<string, unknown> = {
                name: form.name.trim(),
                placement_type: form.placement_type,
                weight: form.weight,
                duration_sec: form.duration_sec,
                skip_after_sec: form.skip_after_sec,
                is_skippable: !form.nonSkippable,
                asset_url: u,
                click_through_url: form.click_through_url || undefined,
                advertiser_id: form.advertiser_id || undefined,
                max_impressions: form.max_impressions ? Number(form.max_impressions) : undefined,
                max_clicks: form.max_clicks ? Number(form.max_clicks) : undefined,
                start_date: form.start_date || undefined,
                end_date: form.end_date || undefined,
                metadata,
            };
            if (t === 'banner') {
                body.type = 'display';
                body.format = 'banner';
                body.banner_position = 'bottom';
                body.banner_size = 'medium';
                body.display_timing = {
                    show_after_sec: form.display_start_sec,
                    duration_sec: form.display_duration_sec,
                };
            } else if (t === 'video') {
                body.type = 'video';
                body.format = 'video';
            } else {
                body.type = 'audio';
                body.format = 'audio';
            }
            setUploadProgress(40);
            await createMut.mutateAsync({ kind: 'json', body });
            setUploadProgress(0);
            return;
        }

        if (assetSource === 'library') {
            const sel = libraryOptions.find((a) => a.id === form.library_asset_id);
            if (!sel?.asset_url) {
                toast.error('Select a library asset');
                return;
            }
            const body: Record<string, unknown> = {
                name: form.name.trim(),
                placement_type: form.placement_type,
                weight: form.weight,
                duration_sec: form.duration_sec,
                skip_after_sec: form.skip_after_sec,
                is_skippable: !form.nonSkippable,
                asset_url: sel.asset_url,
                click_through_url: form.click_through_url || undefined,
                advertiser_id: form.advertiser_id || undefined,
                max_impressions: form.max_impressions ? Number(form.max_impressions) : undefined,
                max_clicks: form.max_clicks ? Number(form.max_clicks) : undefined,
                start_date: form.start_date || undefined,
                end_date: form.end_date || undefined,
                metadata,
            };
            if (t === 'banner') {
                body.type = 'display';
                body.format = 'banner';
                body.banner_position = 'bottom';
                body.banner_size = 'medium';
                body.display_timing = {
                    show_after_sec: form.display_start_sec,
                    duration_sec: form.display_duration_sec,
                };
            } else if (t === 'video') {
                body.type = 'video';
                body.format = 'video';
            } else {
                body.type = 'audio';
                body.format = 'audio';
            }
            await createMut.mutateAsync({ kind: 'json', body });
            return;
        }

        if (!file) {
            toast.error('Select a file to upload');
            return;
        }

        setUploadProgress(15);
        const fd = new FormData();
        fd.append('name', form.name.trim());
        appendTypeToFormData(fd, t);
        fd.append('placement_type', form.placement_type);
        fd.append('weight', String(form.weight));
        fd.append('duration_sec', String(form.duration_sec));
        fd.append('skip_after_sec', String(form.skip_after_sec));
        fd.append('is_skippable', form.nonSkippable ? '0' : '1');
        if (form.click_through_url) fd.append('click_through_url', form.click_through_url);
        if (form.advertiser_id) fd.append('advertiser_id', form.advertiser_id);
        if (form.max_impressions) fd.append('max_impressions', form.max_impressions);
        if (form.max_clicks) fd.append('max_clicks', form.max_clicks);
        if (form.start_date) fd.append('start_date', form.start_date);
        if (form.end_date) fd.append('end_date', form.end_date);
        fd.append('metadata[target_tier]', form.target_tier);
        if (form.station_name.trim()) {
            fd.append('metadata[station]', form.station_name.trim());
        }
        if (t === 'banner') {
            fd.append('display_timing[show_after_sec]', String(form.display_start_sec));
            fd.append('display_timing[duration_sec]', String(form.display_duration_sec));
        }
        fd.append('file', file);
        setUploadProgress(50);
        try {
            await createMut.mutateAsync({ kind: 'multipart', fd });
        } finally {
            setUploadProgress(0);
        }
    };

    const canSubmit =
        form.name.trim().length > 0 &&
        (createAdType === 'vast'
            ? form.vast_tag_url.trim().length > 0
            : assetSource === 'upload'
              ? file != null
              : assetSource === 'library'
                ? form.library_asset_id.length > 0
                : form.external_asset_url.trim().startsWith('http'));

    const placementLabel =
        form.placement_type === 'all'
            ? 'All (Pre-Roll & Mid-Roll)'
            : form.placement_type === 'preroll'
              ? 'Pre-roll'
              : 'Mid-roll';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="dialog-add-campaign">
                <DialogHeader>
                    <DialogTitle data-testid="title-add-campaign">Add New Ad Campaign</DialogTitle>
                    <DialogDescription>Create a new ad campaign for free tier stations</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                            id="campaign-name"
                            data-testid="input-campaign-name"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="Enter campaign name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Ad Type</Label>
                        <Select value={createAdType} onValueChange={(v) => setCreateAdType(v as CreateAdType)}>
                            <SelectTrigger data-testid="select-campaign-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="audio">Audio Ad</SelectItem>
                                <SelectItem value="video">Video Ad</SelectItem>
                                <SelectItem value="banner">Banner Ad</SelectItem>
                                <SelectItem value="vast">VAST / VMAP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="placement-type">Placement Type</Label>
                        <Select
                            value={form.placement_type}
                            onValueChange={(v) => setForm((f) => ({ ...f, placement_type: v as typeof f.placement_type }))}
                        >
                            <SelectTrigger data-testid="select-placement-type">
                                <SelectValue placeholder={placementLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All (Pre-Roll & Mid-Roll)</SelectItem>
                                <SelectItem value="preroll">Pre-roll</SelectItem>
                                <SelectItem value="midroll">Mid-roll</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Plays in both pre-roll and mid-roll positions when set to All</p>
                    </div>

                    {createAdType === 'banner' && (
                        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                            <h4 className="font-medium">Display Timing</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="display-start">Show After (seconds)</Label>
                                    <Input
                                        id="display-start"
                                        type="number"
                                        min={0}
                                        value={form.display_start_sec}
                                        onChange={(e) => setForm((f) => ({ ...f, display_start_sec: Number(e.target.value) }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Seconds after playback starts</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="display-duration">Display Duration (seconds)</Label>
                                    <Input
                                        id="display-duration"
                                        type="number"
                                        min={1}
                                        value={form.display_duration_sec}
                                        onChange={(e) => setForm((f) => ({ ...f, display_duration_sec: Number(e.target.value) }))}
                                    />
                                    <p className="text-xs text-muted-foreground">How long the banner stays visible</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(createAdType === 'audio' || createAdType === 'video') && (
                        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                            <h4 className="flex items-center gap-2 font-medium">
                                {createAdType === 'audio' ? (
                                    <FileAudio className="h-4 w-4" />
                                ) : (
                                    <Video className="h-4 w-4" />
                                )}
                                {createAdType === 'audio' ? 'Audio Ad Configuration' : 'Video Ad Configuration'}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration-sec-config">Duration (seconds)</Label>
                                    <Input
                                        id="duration-sec-config"
                                        type="number"
                                        min={5}
                                        max={120}
                                        value={form.duration_sec}
                                        onChange={(e) => setForm((f) => ({ ...f, duration_sec: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="skip-after-sec-config">Skip After (seconds)</Label>
                                    <Input
                                        id="skip-after-sec-config"
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={form.skip_after_sec}
                                        onChange={(e) => setForm((f) => ({ ...f, skip_after_sec: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-background/50 p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is-skippable-config" className="cursor-pointer">
                                        Non-Skippable Ad
                                    </Label>
                                    <p className="text-xs text-muted-foreground">Users will not be able to skip this ad</p>
                                </div>
                                <Switch
                                    id="is-skippable-config"
                                    checked={form.nonSkippable}
                                    onCheckedChange={(v) => setForm((f) => ({ ...f, nonSkippable: v }))}
                                />
                            </div>
                        </div>
                    )}

                    {createAdType === 'vast' && (
                        <div className="space-y-2">
                            <Label>VAST tag URL</Label>
                            <Textarea
                                value={form.vast_tag_url}
                                onChange={(e) => setForm((f) => ({ ...f, vast_tag_url: e.target.value }))}
                                rows={4}
                                placeholder="https://..."
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2" htmlFor="click-through-url-config">
                            <ExternalLink className="h-4 w-4" />
                            Click-through URL (Optional)
                        </Label>
                        <Input
                            id="click-through-url-config"
                            type="url"
                            value={form.click_through_url}
                            onChange={(e) => setForm((f) => ({ ...f, click_through_url: e.target.value }))}
                            placeholder="https://example.com/landing-page"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Advertiser (Optional)
                        </Label>
                        <Select
                            value={form.advertiser_id || 'none'}
                            onValueChange={(v) => setForm((f) => ({ ...f, advertiser_id: v === 'none' ? '' : v }))}
                        >
                            <SelectTrigger data-testid="select-advertiser">
                                <SelectValue placeholder="No advertiser" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No advertiser</SelectItem>
                                {advertisersQ.data?.advertisers?.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {createAdType !== 'vast' && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <Label className="flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Ad Asset
                                </Label>
                                <Tabs value={assetSource} onValueChange={(v) => setAssetSource(v as typeof assetSource)}>
                                    <TabsList className="grid w-full grid-cols-3" data-testid="tabs-asset-source">
                                        <TabsTrigger value="upload" className="gap-1.5 text-xs" data-testid="tab-upload">
                                            <Upload className="h-3.5 w-3.5" />
                                            Upload New
                                        </TabsTrigger>
                                        <TabsTrigger value="library" className="gap-1.5 text-xs" data-testid="tab-library">
                                            <Library className="h-3.5 w-3.5" />
                                            From Library
                                        </TabsTrigger>
                                        <TabsTrigger value="url" className="gap-1.5 text-xs" data-testid="tab-url">
                                            <LinkIcon className="h-3.5 w-3.5" />
                                            External URL
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="upload" className="mt-4">
                                        <button
                                            type="button"
                                            className="w-full cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                                            data-testid="upload-zone"
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            <input
                                                ref={fileRef}
                                                className="hidden"
                                                type="file"
                                                data-testid="input-file"
                                                accept={
                                                    createAdType === 'video'
                                                        ? 'video/*'
                                                        : createAdType === 'banner'
                                                          ? 'image/*'
                                                          : 'audio/*'
                                                }
                                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                            />
                                            {createAdType === 'banner' ? (
                                                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                                            ) : createAdType === 'video' ? (
                                                <Video className="mx-auto h-10 w-10 text-muted-foreground" />
                                            ) : (
                                                <FileAudio className="mx-auto h-10 w-10 text-muted-foreground" />
                                            )}
                                            <div className="mt-2 font-medium">Drop your file here or click to browse</div>
                                            <div className="text-sm text-muted-foreground">
                                                {createAdType === 'banner' ? 'PNG, JPG, WebP' : 'MP3, WAV, OGG or video formats'}
                                            </div>
                                        </button>
                                    </TabsContent>
                                    <TabsContent value="library" className="mt-4 space-y-2">
                                        <Select
                                            value={form.library_asset_id}
                                            onValueChange={(v) => setForm((f) => ({ ...f, library_asset_id: v }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose an existing asset" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {libraryOptions.map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {a.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {libraryOptions.length === 0 && (
                                            <p className="text-xs text-muted-foreground">No matching assets in the library yet.</p>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="url" className="mt-4 space-y-2">
                                        <Input
                                            placeholder="https://cdn.example.com/ad.mp3"
                                            value={form.external_asset_url}
                                            onChange={(e) => setForm((f) => ({ ...f, external_asset_url: e.target.value }))}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Target Tier</Label>
                            <Select
                                value={form.target_tier}
                                onValueChange={(v) => setForm((f) => ({ ...f, target_tier: v as typeof f.target_tier }))}
                            >
                                <SelectTrigger data-testid="select-target-tier">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free Tier Only</SelectItem>
                                    <SelectItem value="all">All tiers</SelectItem>
                                    <SelectItem value="paid">Paid subscribers</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="station-name">Station name (optional)</Label>
                            <Input
                                id="station-name"
                                value={form.station_name}
                                onChange={(e) => setForm((f) => ({ ...f, station_name: e.target.value }))}
                                placeholder="Shown in the Station column"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Start Date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date">End Date (Optional)</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <Collapsible>
                        <CollapsibleTrigger
                            className="flex w-full items-center justify-between rounded-md py-2 text-left hover:bg-muted/40 [&[data-state=open]>svg:last-child]:rotate-90"
                            type="button"
                        >
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                <span className="font-semibold">Priority & Campaign Limits</span>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 transition-transform" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Weight (1–10)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={form.weight}
                                    onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Max impressions (optional)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.max_impressions}
                                        onChange={(e) => setForm((f) => ({ ...f, max_impressions: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max clicks (optional)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.max_clicks}
                                        onChange={(e) => setForm((f) => ({ ...f, max_clicks: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <Separator />

                    <Collapsible>
                        <CollapsibleTrigger
                            className="flex w-full items-center justify-between rounded-md py-2 text-left hover:bg-muted/40 [&[data-state=open]>svg:last-child]:rotate-90"
                            type="button"
                        >
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                <span className="font-semibold">Geo-Targeting</span>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 transition-transform" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4">
                            <p className="text-sm text-muted-foreground">
                                Geo rules can be refined per asset via the API or a future editor. Default is worldwide delivery.
                            </p>
                        </CollapsibleContent>
                    </Collapsible>

                    {uploadProgress > 0 && uploadProgress < 100 && <Progress value={uploadProgress} />}
                </div>

                <DialogFooter className="gap-2 border-t pt-4">
                    <Button variant="outline" data-testid="button-cancel-campaign" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button data-testid="button-create-campaign" disabled={!canSubmit || createMut.isPending} onClick={() => void handleSubmit()}>
                        {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Campaign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
