import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { type LucideIcon } from 'lucide-react';
import {
    BarChart3,
    Code,
    ChevronDown,
    Image,
    Layers,
    LayoutList,
    Megaphone,
    Music,
    Settings,
    Users,
    Video,
    Wallet,
    Waypoints,
} from 'lucide-react';

const adsItems: { title: string; url: string; icon: LucideIcon }[] = [
    { title: 'Audio ads', url: '/admin/ads/audio', icon: Music },
    { title: 'VAST / VMAP', url: '/admin/ads/vast', icon: Code },
    { title: 'Video ads', url: '/admin/ads/video', icon: Video },
    { title: 'Banner ads', url: '/admin/ads/banner', icon: Image },
    { title: 'Advertisers', url: '/admin/ads/advertisers', icon: Users },
    { title: 'Free tier settings', url: '/admin/ads/free-tier', icon: Settings },
    { title: 'Ad rules', url: '/admin/ads/rules', icon: Layers },
    { title: 'Analytics', url: '/admin/ads/analytics', icon: BarChart3 },
    { title: 'Platform banners', url: '/admin/ads/platform-banners', icon: Image },
    { title: 'Stripe keys', url: '/admin/ads/stripe', icon: Wallet },
    { title: 'Subscription plans', url: '/admin/ads/plans', icon: Waypoints },
    { title: 'Level ad rules', url: '/admin/ads/levels', icon: LayoutList },
];

export function AdminAdsNav() {
    const page = usePage();
    const path = page.url.split('?')[0];
    const isUnderAds = path.startsWith('/admin/ads');
    const isActive = (url: string) => path === url || path.startsWith(url + '/');

    return (
        <Collapsible defaultOpen={isUnderAds} className="group/collapsible">
            <SidebarGroup className="px-2 py-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip="Ads Manager"
                                className="[&[data-state=open]>svg:last-child]:rotate-180"
                            >
                                <Megaphone />
                                <span>Ads Manager</span>
                                <ChevronDown className="ml-auto shrink-0 transition-transform" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {adsItems.map((item) => (
                                    <SidebarMenuSubItem key={item.url}>
                                        <SidebarMenuSubButton asChild isActive={isActive(item.url)} size="md">
                                            <Link href={item.url} prefetch>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        </Collapsible>
    );
}
