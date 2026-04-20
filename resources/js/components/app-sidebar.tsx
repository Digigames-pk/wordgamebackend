import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Code,
    Folder,
    Image,
    LayoutGrid,
    LayoutList,
    Layers,
    Music,
    Settings,
    Users,
    UserCog,
    Video,
    Wallet,
    Waypoints,
} from 'lucide-react';
import AppLogo from './app-logo';

function useMainNavItems(): NavItem[] {
    return [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
    ];
}

const adminNavItems: NavItem[] = [
    { title: 'Users', url: '/admin/users', icon: UserCog },
    { title: 'Audio ads', url: '/admin/ads/audio', icon: Music },
    { title: 'VAST / VMAP', url: '/admin/ads/vast', icon: Code },
    { title: 'Video ads', url: '/admin/ads/video', icon: Video },
    { title: 'Banner ads', url: '/admin/ads/banner', icon: Image },
    { title: 'Advertisers', url: '/admin/ads/advertisers', icon: Users },
    // { title: 'Free tier settings', url: '/admin/ads/free-tier', icon: Settings },
    { title: 'Ad rules', url: '/admin/ads/rules', icon: Layers },
    // { title: 'Analytics', url: '/admin/ads/analytics', icon: BarChart3 },
    // { title: 'Platform banners', url: '/admin/ads/platform-banners', icon: Image },
    { title: 'Stripe keys', url: '/admin/ads/stripe', icon: Wallet },
    { title: 'Subscription plans', url: '/admin/ads/plans', icon: Waypoints },
    { title: 'Level ad rules', url: '/admin/ads/levels', icon: LayoutList },
    { title: 'Level backgrounds', url: '/admin/ads/level-backgrounds', icon: Image },
    { title: 'Game configs', url: '/admin/ads/game-configs', icon: Settings },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        url: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        url: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const mainNavItems = useMainNavItems();
    const { auth } = usePage<{ auth: { user?: { is_admin?: boolean } } }>().props;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {auth.user?.is_admin ? <NavMain items={adminNavItems} groupLabel="Administration" /> : null}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
