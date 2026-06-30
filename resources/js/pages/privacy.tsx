import PublicHeader from '@/components/public-header';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function Privacy() {
    const { supportEmail } = usePage<SharedData>().props;
    const email = (supportEmail as string) || 'hello@example.com';

    return (
        <>
            <Head title="Privacy Policy" />
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:p-8 dark:bg-[#0a0a0a]">
                <PublicHeader active="privacy" />
                <main className="w-full max-w-3xl rounded-lg bg-white p-8 shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] dark:bg-[#161615] dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                    <h1 className="mb-2 text-2xl font-semibold">Privacy Policy</h1>
                    <p className="mb-6 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                        Christmas Word Quest — Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

                    <div className="space-y-6 text-sm leading-relaxed text-[#1b1b18] dark:text-[#EDEDEC]">
                        <section>
                            <h2 className="mb-2 text-lg font-medium">Introduction</h2>
                            <p>
                                Christmas Word Quest (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Christmas Word Quest mobile game and
                                related services. This Privacy Policy explains what information we collect, how we use it, and your
                                choices regarding your data.
                            </p>
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-medium">Information We Collect</h2>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>
                                    <strong>Account information:</strong> When you register, we collect your name, email address, and
                                    password (stored in hashed form). We do not store your plain-text password.
                                </li>
                                <li>
                                    <strong>Game progress:</strong> We store gameplay data including a device identifier, current level,
                                    and coin balance so your progress can be saved and restored across sessions.
                                </li>
                                <li>
                                    <strong>Subscription data:</strong> If you purchase an ad-free subscription, we process payment
                                    information through Stripe and store Stripe customer and subscription identifiers and status.
                                </li>
                                <li>
                                    <strong>Advertising analytics:</strong> When ads are shown or interacted with, we may collect event
                                    data such as ad impressions and clicks, approximate location (country, region, city), device type,
                                    browser or app session identifiers, and IP address for analytics and fraud prevention.
                                </li>
                                <li>
                                    <strong>Contact messages:</strong> If you contact us, we collect the name, email, subject, and message
                                    you provide.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-medium">How We Use Your Information</h2>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>Provide, maintain, and improve the game and your account</li>
                                <li>Save and sync your level progress and in-game rewards</li>
                                <li>Process subscriptions and manage ad-free access</li>
                                <li>Deliver and measure advertising (for users without an active ad-free subscription)</li>
                                <li>Respond to support requests and contact form submissions</li>
                                <li>Protect against abuse, fraud, and security incidents</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-medium">Third-Party Services</h2>
                            <p className="mb-2">We use trusted third parties to operate the game, including:</p>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>
                                    <strong>Stripe</strong> — payment processing for subscriptions. Stripe&apos;s privacy policy applies to
                                    payment data they handle directly.
                                </li>
                                <li>
                                    <strong>Advertising partners</strong> — third-party ad networks may collect or receive information as
                                    described in their own policies when ads are displayed in the app.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-medium">Data Retention</h2>
                            <p>
                                We retain account and game data for as long as your account is active or as needed to provide the
                                service. Advertising analytics may be retained for reporting purposes. When you delete your account, we
                                remove your user profile and associated subscription records. Device-level game progress may remain stored
                                anonymously if not linked to an account.
                            </p>
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-medium">Your Rights and Choices</h2>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>Access or update your profile information in the app or via your account settings</li>
                                <li>Delete your account at any time using the in-app account deletion feature (Settings → Delete Account)</li>
                                <li>Contact us to request access, correction, or deletion of personal data</li>
                                <li>Opt out of ads by purchasing an ad-free subscription where available</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-medium">Children&apos;s Privacy</h2>
                            <p>
                                Christmas Word Quest is not directed at children under 13. We do not knowingly collect personal
                                information from children under 13. If you believe a child has provided us personal information, please
                                contact us and we will take steps to delete it.
                            </p>
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-medium">Account Deletion</h2>
                            <p>
                                You may delete your account from within the app. Deletion requires confirmation with your account
                                password and permanently removes your profile, authentication tokens, and subscription records associated
                                with your account. You may also{' '}
                                <Link href={route('contact')} className="underline underline-offset-4">
                                    contact us
                                </Link>{' '}
                                if you need assistance deleting your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="mb-2 text-lg font-medium">Contact Us</h2>
                            <p>
                                If you have questions about this Privacy Policy or our data practices, please contact us at{' '}
                                <a href={`mailto:${email}`} className="underline underline-offset-4">
                                    {email}
                                </a>{' '}
                                or use our{' '}
                                <Link href={route('contact')} className="underline underline-offset-4">
                                    Contact Us
                                </Link>{' '}
                                form.
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}
