import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BarChart2, Clock, Globe, MousePointer, Target } from 'lucide-react';

export interface PerformanceAdAsset {
    id: string;
    name: string;
    type: string;
    format?: string;
    status: string;
    placement_type?: string;
    weight?: number;
    impression_count?: number;
    click_count?: number;
    completion_count?: number;
    max_impressions?: number | null;
    max_clicks?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    geo_countries?: string[] | null;
    geo_states?: string[] | null;
    geo_cities?: string[] | null;
    created_at?: string | null;
}

function formatNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
}

function limitPct(current: number, max: number | null | undefined): number {
    if (max == null || max <= 0) return 0;
    return Math.min(100, (current / max) * 100);
}

export function AdPerformanceDialog({
    open,
    onOpenChange,
    asset,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: PerformanceAdAsset | null;
}) {
    if (!asset) return null;

    const impressions = asset.impression_count ?? 0;
    const clicks = asset.click_count ?? 0;
    const completions = asset.completion_count ?? 0;
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
    const completionRate = impressions > 0 ? ((completions / impressions) * 100).toFixed(2) : '0.00';
    const maxImp = asset.max_impressions;
    const maxClk = asset.max_clicks;
    const geoN =
        (asset.geo_countries?.length ?? 0) + (asset.geo_states?.length ?? 0) + (asset.geo_cities?.length ?? 0);
    const geoLabel =
        geoN === 0 ? 'Worldwide (no restrictions)' : `${geoN} targeting rule(s) configured — see asset editor for detail.`;

    const typeLabel =
        asset.type === 'vast' || asset.format === 'vast'
            ? 'VAST'
            : asset.format === 'audio' || asset.type === 'audio'
              ? 'Audio'
              : asset.type === 'display' || asset.format === 'banner'
                ? 'Banner'
                : asset.format === 'video' || asset.type === 'video'
                  ? 'Video'
                  : String(asset.type ?? '—');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BarChart2 className="h-5 w-5" />
                        Ad Performance Report
                    </DialogTitle>
                    <DialogDescription>
                        {asset.name} — Detailed analytics
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Impressions</p>
                        <p className="text-2xl font-semibold tabular-nums">{formatNum(impressions)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="flex items-center gap-1 text-2xl font-semibold tabular-nums">
                            <MousePointer className="h-4 w-4 text-muted-foreground" />
                            {formatNum(clicks)}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">% CTR</p>
                        <p className="text-2xl font-semibold tabular-nums">{ctr}%</p>
                        <p className="text-[10px] text-muted-foreground">Click-through rate</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Completions</p>
                        <p className="text-2xl font-semibold tabular-nums">{formatNum(completions)}</p>
                        <p className="text-[10px] text-muted-foreground">{completionRate}% completion rate</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Target className="h-4 w-4 text-primary" />
                            Campaign settings
                        </div>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between gap-2">
                                <dt className="text-muted-foreground">Status</dt>
                                <dd>
                                    <Badge variant={asset.status === 'approved' ? 'default' : 'secondary'}>
                                        {asset.status === 'approved' ? 'active' : asset.status}
                                    </Badge>
                                </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-muted-foreground">Type</dt>
                                <dd>{typeLabel}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-muted-foreground">Weight</dt>
                                <dd>
                                    <Badge variant="outline">
                                        {asset.weight ?? 5}/10
                                    </Badge>
                                </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-muted-foreground">Start date</dt>
                                <dd>{asset.start_date ? new Date(asset.start_date).toLocaleDateString() : 'Immediate'}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                                <dt className="text-muted-foreground">End date</dt>
                                <dd>{asset.end_date ? new Date(asset.end_date).toLocaleDateString() : 'No end date'}</dd>
                            </div>
                        </dl>
                    </div>
                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Globe className="h-4 w-4 text-primary" />
                            Geo targeting
                        </div>
                        <p className="text-sm text-muted-foreground">{geoLabel}</p>
                    </div>
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-primary" />
                        Limits progress
                    </div>
                    <div className="space-y-3">
                        <div>
                            <div className="mb-1 flex justify-between text-xs">
                                <span>Impressions</span>
                                <span className="text-muted-foreground">
                                    {formatNum(impressions)} / {maxImp != null ? formatNum(maxImp) : '∞'}
                                </span>
                            </div>
                            <Progress
                                value={maxImp != null ? limitPct(impressions, maxImp) : 0}
                                className={cn('h-2', maxImp == null && '[&>div]:bg-emerald-500/30')}
                            />
                        </div>
                        <div>
                            <div className="mb-1 flex justify-between text-xs">
                                <span>Clicks</span>
                                <span className="text-muted-foreground">
                                    {formatNum(clicks)} / {maxClk != null ? formatNum(maxClk) : '∞'}
                                </span>
                            </div>
                            <Progress
                                value={maxClk != null ? limitPct(clicks, maxClk) : 0}
                                className={cn('h-2', maxClk == null && '[&>div]:bg-emerald-500/30')}
                            />
                        </div>
                    </div>
                </div>

                {asset.created_at && (
                    <p className="text-center text-[10px] text-muted-foreground">
                        Created: {new Date(asset.created_at).toLocaleString()}
                    </p>
                )}

                <DialogFooter>
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
