import { AdPerformanceDialog, type PerformanceAdAsset } from '@/components/admin/ad-performance-dialog';
import { AddAdCampaignDialog } from '@/components/admin/add-ad-campaign-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/lib/api';
import {
    BarChart2,
    BarChart3,
    Code,
    Eye,
    Globe,
    Image,
    Infinity,
    Loader2,
    Music,
    Percent,
    PlayCircle,
    Plus,
    RefreshCw,
    Trash2,
    Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export type AdTypeTab = 'audio' | 'video' | 'banner' | 'vast';

export interface AdsTypeViewProps {
    adType: AdTypeTab;
    title: string;
    breadcrumbs: BreadcrumbItem[];
}

interface AdAssetRow extends PerformanceAdAsset {
    format?: string;
    owner_type: string;
    placement_type?: string;
    banner_position?: string | null;
    max_impressions?: number | null;
    max_clicks?: number | null;
    weight?: number;
    geo_countries?: string[] | null;
    geo_states?: string[] | null;
    geo_cities?: string[] | null;
    geo_exclude_countries?: string[] | null;
    geo_exclude_states?: string[] | null;
    geo_exclude_cities?: string[] | null;
    vast_tag_url?: string | null;
    vmap_tag_url?: string | null;
    metadata?: Record<string, unknown> | null;
}

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
}

function filterByType(campaigns: AdAssetRow[], type: AdTypeTab): AdAssetRow[] {
    return campaigns.filter((c) => {
        if (type === 'vast') {
            return c.type === 'vast' || !!c.vast_tag_url || !!c.vmap_tag_url;
        }
        if (type === 'video') {
            return (c.format === 'video' || c.type === 'video') && c.type !== 'vast' && !c.vast_tag_url;
        }
        if (type === 'banner') {
            return c.type === 'banner' || c.type === 'display' || c.format === 'banner';
        }
        return c.format === 'audio' || c.type === 'audio';
    });
}

function stationLabel(c: AdAssetRow): string {
    const m = c.metadata;
    const station = m && typeof m === 'object' && 'station' in m ? String((m as { station?: unknown }).station ?? '') : '';
    if (station) return station;
    return c.owner_type === 'global' ? 'Global' : '—';
}

function targetTierLabel(c: AdAssetRow): string {
    const m = c.metadata;
    const t = m && typeof m === 'object' && 'target_tier' in m ? String((m as { target_tier?: unknown }).target_tier ?? '') : '';
    if (t === 'paid') return 'Paid';
    if (t === 'all') return 'All tiers';
    return 'Free only';
}

export function AdsTypeView({ adType, title, breadcrumbs }: AdsTypeViewProps) {
    const qc = useQueryClient();
    const [addOpen, setAddOpen] = useState(false);
    const [perfOpen, setPerfOpen] = useState(false);
    const [perfAsset, setPerfAsset] = useState<AdAssetRow | null>(null);

    const q = useQuery({
        queryKey: ['admin', 'ads', 'assets'],
        queryFn: () => apiJson<{ assets: AdAssetRow[] }>('/ads/assets'),
    });

    const campaigns = q.data?.assets ?? [];
    const typeCampaigns = useMemo(() => filterByType(campaigns, adType), [campaigns, adType]);

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c) => c.status === 'approved').length;
    const totalImpressions = campaigns.reduce((s, c) => s + (c.impression_count ?? 0), 0);
    const totalClicks = campaigns.reduce((s, c) => s + (c.click_count ?? 0), 0);
    const fillRate = totalCampaigns > 0 ? Math.round((activeCampaigns / totalCampaigns) * 1000) / 10 : 0;

    const typeLabels: Record<AdTypeTab, { title: string; desc: string; icon: typeof Music }> = {
        audio: {
            title: 'Audio ads',
            desc: 'Manage audio ad assets for insertion during breaks',
            icon: Music,
        },
        video: {
            title: 'Video ads',
            desc: 'Pre-roll and mid-roll video ad management',
            icon: Video,
        },
        banner: {
            title: 'Banner ads',
            desc: 'Display banner ads on player pages',
            icon: Image,
        },
        vast: {
            title: 'VAST/VMAP tags',
            desc: 'Configure programmatic ad tags and endpoints',
            icon: Code,
        },
    };

    const toggleMut = useMutation({
        mutationFn: (id: string) => apiJson(`/ads/assets/${id}/toggle`, { method: 'PATCH' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'ads', 'assets'] });
            toast.success('Ad status updated');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => apiJson(`/ads/assets/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'ads', 'assets'] });
            toast.success('Ad deleted');
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const renderGeo = (c: AdAssetRow) => {
        const t =
            (c.geo_countries?.length ?? 0) + (c.geo_states?.length ?? 0) + (c.geo_cities?.length ?? 0);
        const ex =
            (c.geo_exclude_countries?.length ?? 0) +
            (c.geo_exclude_states?.length ?? 0) +
            (c.geo_exclude_cities?.length ?? 0);
        if (t === 0 && ex === 0) {
            return (
                <Badge variant="outline" className="text-xs">
                    <Globe className="mr-1 h-3 w-3" /> Worldwide
                </Badge>
            );
        }
        return (
            <div className="flex flex-wrap gap-1">
                {t > 0 && (
                    <Badge variant="secondary" className="border-green-500/20 bg-green-500/10 text-xs text-green-700 dark:text-green-400">
                        {t} targeted
                    </Badge>
                )}
                {ex > 0 && (
                    <Badge variant="secondary" className="border-red-500/20 bg-red-500/10 text-xs text-red-700 dark:text-red-400">
                        {ex} excluded
                    </Badge>
                )}
            </div>
        );
    };

    const renderLimits = (c: AdAssetRow) => {
        if (!c.max_impressions && !c.max_clicks) {
            return (
                <Badge variant="outline" className="text-xs">
                    <Infinity className="mr-1 h-3 w-3" /> Unlimited
                </Badge>
            );
        }
        return (
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {c.max_impressions != null && (
                    <span>
                        {formatNumber(c.impression_count ?? 0)}/{formatNumber(c.max_impressions)} views
                    </span>
                )}
                {c.max_clicks != null && (
                    <span>
                        {formatNumber(c.click_count ?? 0)}/{formatNumber(c.max_clicks)} clicks
                    </span>
                )}
            </div>
        );
    };

    const TL = typeLabels[adType];
    const TypeIcon = TL.icon;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <TooltipProvider delayDuration={200}>
            <Head title={title} />
            <div className="mx-auto max-w-7xl space-y-8 p-8">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-500">
                                ADMIN
                            </Badge>
                        </div>
                        <h2 className="font-display text-3xl font-bold tracking-tight">Ads Manager</h2>
                        <p className="mt-1 text-muted-foreground">Manage platform-wide advertising for free tier stations.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <BarChart3 className="h-4 w-4" />
                                Total ad campaigns
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{totalCampaigns}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Across all ad types</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <PlayCircle className="h-4 w-4 text-green-500" />
                                Active ads
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{activeCampaigns}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Currently running</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Eye className="h-4 w-4 text-blue-500" />
                                Total impressions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{formatNumber(totalImpressions)}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {formatNumber(totalClicks)} clicks (
                                {totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}% CTR)
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Percent className="h-4 w-4 text-purple-500" />
                                Fill rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-600">{fillRate}%</div>
                            <p className="mt-1 text-xs text-muted-foreground">Ad slots filled</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <TypeIcon className="h-5 w-5" />
                                    {TL.title}
                                </CardTitle>
                                <CardDescription>{TL.desc}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => q.refetch()}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => setAddOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add {TL.title.replace(/s$/, '')}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {q.isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : typeCampaigns.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No {adType} ads configured yet. Add your first ad to get started.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Station</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Placement</TableHead>
                                        <TableHead className="text-center">Weight</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Geo</TableHead>
                                        <TableHead>Limits</TableHead>
                                        <TableHead className="text-right">Views</TableHead>
                                        <TableHead className="text-right">Clicks</TableHead>
                                        <TableHead className="text-right">CTR</TableHead>
                                        <TableHead>Schedule</TableHead>
                                        <TableHead className="text-center">Enabled</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {typeCampaigns.map((campaign) => {
                                        const ctr = campaign.impression_count
                                            ? (((campaign.click_count ?? 0) / (campaign.impression_count || 1)) * 100).toFixed(2)
                                            : '0.00';
                                        return (
                                            <TableRow key={campaign.id}>
                                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">
                                                        {stationLabel(campaign)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            campaign.status === 'approved'
                                                                ? 'default'
                                                                : campaign.status === 'paused'
                                                                  ? 'secondary'
                                                                  : 'outline'
                                                        }
                                                    >
                                                        {campaign.status === 'approved' ? 'active' : campaign.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {adType === 'banner' ? (
                                                        <Badge variant="outline" className="border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-400">
                                                            {campaign.banner_position === 'top'
                                                                ? 'Top'
                                                                : campaign.banner_position === 'overlay'
                                                                  ? 'Overlay'
                                                                  : 'Bottom'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                campaign.placement_type === 'preroll'
                                                                    ? 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                                                    : campaign.placement_type === 'midroll'
                                                                      ? 'border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400'
                                                                      : 'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                                                            }
                                                        >
                                                            {campaign.placement_type === 'preroll'
                                                                ? 'Pre-Roll'
                                                                : campaign.placement_type === 'midroll'
                                                                  ? 'Mid-Roll'
                                                                  : 'All'}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={campaign.weight && campaign.weight >= 8 ? 'default' : 'secondary'}
                                                        className={campaign.weight && campaign.weight >= 8 ? 'bg-green-600' : ''}
                                                    >
                                                        {campaign.weight ?? 5}/10
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {targetTierLabel(campaign)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{renderGeo(campaign)}</TableCell>
                                                <TableCell>{renderLimits(campaign)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(campaign.impression_count ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(campaign.click_count ?? 0)}</TableCell>
                                                <TableCell className="text-right">{ctr}%</TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>
                                                            {campaign.start_date
                                                                ? new Date(campaign.start_date).toLocaleDateString()
                                                                : 'Now'}
                                                        </div>
                                                        <div className="text-muted-foreground">
                                                            {campaign.end_date
                                                                ? `to ${new Date(campaign.end_date).toLocaleDateString()}`
                                                                : 'No end date'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch
                                                        checked={campaign.status === 'approved'}
                                                        onCheckedChange={() => toggleMut.mutate(campaign.id)}
                                                        disabled={toggleMut.isPending}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label="Brief analytics"
                                                                    onClick={() => {
                                                                        setPerfAsset(campaign);
                                                                        setPerfOpen(true);
                                                                    }}
                                                                >
                                                                    <BarChart2 className="h-4 w-4 text-primary" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Ad performance</TooltipContent>
                                                        </Tooltip>
                                                        <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(campaign.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AddAdCampaignDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                defaultAdType={adType}
                onCreated={() => qc.invalidateQueries({ queryKey: ['admin', 'ads', 'assets'] })}
            />

            <AdPerformanceDialog open={perfOpen} onOpenChange={setPerfOpen} asset={perfAsset} />
            </TooltipProvider>
        </AppLayout>
    );
}
