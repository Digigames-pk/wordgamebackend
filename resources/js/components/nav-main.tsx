import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

function navItemIsActive(pageUrl: string, itemUrl: string): boolean {
    const p = pageUrl.split('?')[0];
    if (itemUrl === '/dashboard') {
        return p === '/dashboard';
    }
    return p === itemUrl || p.startsWith(itemUrl + '/');
}

export function NavMain({ items = [], groupLabel = 'Platform' }: { items: NavItem[]; groupLabel?: string }) {
    const page = usePage();
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={navItemIsActive(page.url, item.url)}>
                            <Link href={item.url} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
