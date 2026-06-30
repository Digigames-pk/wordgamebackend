import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

const navLinkClass =
    'inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]';

const navLinkActiveClass =
    'inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]';

export default function PublicHeader({ active }: { active?: 'home' | 'privacy' | 'contact' }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <header className="mb-6 w-full max-w-[335px] text-sm lg:max-w-4xl">
            <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
                <Link href={route('home')} className={active === 'home' ? navLinkActiveClass : navLinkClass}>
                    Home
                </Link>
                <Link href={route('privacy')} className={active === 'privacy' ? navLinkActiveClass : navLinkClass}>
                    Privacy Policy
                </Link>
                <Link href={route('contact')} className={active === 'contact' ? navLinkActiveClass : navLinkClass}>
                    Contact Us
                </Link>
                {auth.user ? (
                    <Link href={route('dashboard')} className={navLinkActiveClass}>
                        Dashboard
                    </Link>
                ) : (
                    <Link href={route('login')} className={navLinkActiveClass}>
                        Log in
                    </Link>
                )}
            </nav>
        </header>
    );
}
