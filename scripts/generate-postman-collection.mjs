/**
 * Regenerates postman/GameAppBackend.postman_collection.json from routes/api.php coverage.
 * Run: node scripts/generate-postman-collection.mjs
 * Or: npm run postman:generate
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'postman', 'GameAppBackend.postman_collection.json');

const acceptJson = [{ key: 'Accept', value: 'application/json' }];
const contentJson = [
    { key: 'Accept', value: 'application/json' },
    { key: 'Content-Type', value: 'application/json' },
];

/** @param {'noauth' | 'inherit'} auth */
function authBlock(auth) {
    return auth === 'noauth' ? { type: 'noauth' } : undefined;
}

/**
 * @param {object} p
 * @param {string} p.name
 * @param {string} p.method
 * @param {string} p.urlPath - path after /api (no leading slash)
 * @param {'noauth' | 'inherit'} [p.auth]
 * @param {object} [p.body] - { mode, raw } | { mode, formdata }
 * @param {string} [p.description]
 * @param {Array<{key:string,value:string,description?:string}>} [p.extraHeaders]
 */
function item(p) {
    const headers = [...acceptJson, ...(p.extraHeaders ?? [])];
    if (p.body?.mode === 'raw' && p.method !== 'GET' && p.method !== 'DELETE') {
        const hasCt = headers.some((h) => h.key.toLowerCase() === 'content-type');
        if (!hasCt && p.body.raw !== undefined) {
            headers.push({ key: 'Content-Type', value: 'application/json' });
        }
    }
    const req = {
        method: p.method,
        header: headers,
        url: `{{base_url}}/api/${p.urlPath.replace(/^\//, '')}`,
    };
    if (p.body) {
        req.body = p.body;
    }
    if (p.description) {
        req.description = p.description;
    }
    const auth = authBlock(p.auth ?? 'inherit');
    if (auth) {
        req.auth = auth;
    }
    return {
        name: p.name,
        request: req,
    };
}

const folders = [
    {
        name: 'Auth',
        item: [
            item({
                name: 'Register',
                method: 'POST',
                urlPath: 'register',
                auth: 'noauth',
                body: {
                    mode: 'raw',
                    raw: '{\n  "name": "User",\n  "email": "user@example.com",\n  "password": "password",\n  "password_confirmation": "password"\n}',
                },
                description: 'Throttle: 10/min',
            }),
            item({
                name: 'Login',
                method: 'POST',
                urlPath: 'login',
                auth: 'noauth',
                body: {
                    mode: 'raw',
                    raw: '{\n  "email": "admin@example.com",\n  "password": "password"\n}',
                },
                description: 'Throttle: 10/min',
            }),
            item({
                name: 'Logout',
                method: 'POST',
                urlPath: 'logout',
                description: 'Requires auth:sanctum',
            }),
            item({
                name: 'Current user',
                method: 'GET',
                urlPath: 'user',
                description: 'Requires auth:sanctum',
            }),
            item({
                name: 'Get profile',
                method: 'GET',
                urlPath: 'profile',
                description: 'Requires auth:sanctum. User + linked device_state.',
            }),
            item({
                name: 'Update profile',
                method: 'PUT',
                urlPath: 'profile',
                body: {
                    mode: 'raw',
                    raw: '{\n  "name": "Player",\n  "email": "player@example.com",\n  "device_id": "optional-device-uuid"\n}',
                },
                description:
                    'Requires auth:sanctum. Optional: name, email, device_id (link/clear device_states). Send device_id null or empty to unlink.',
            }),
        ],
    },
    {
        name: 'Public',
        item: [
            item({
                name: 'Subscription plans (public)',
                method: 'GET',
                urlPath: 'subscription/plans',
                auth: 'noauth',
            }),
            item({
                name: 'Stripe webhook',
                method: 'POST',
                urlPath: 'stripe/webhook',
                auth: 'noauth',
                body: { mode: 'raw', raw: '' },
                extraHeaders: [
                    { key: 'Stripe-Signature', value: '<stripe_signature>', description: 'Set by Stripe; raw body' },
                ],
                description: 'Throttle: 120/min. Raw Stripe event payload.',
            }),
            item({
                name: 'Game level ad settings',
                method: 'GET',
                urlPath: 'game/level-ad-settings',
                auth: 'noauth',
            }),
            item({
                name: 'Game config',
                method: 'GET',
                urlPath: 'game/config',
                auth: 'noauth',
                description: 'Includes level_ad_rules + mobile configs map.',
            }),
            item({
                name: 'Mobile configs',
                method: 'GET',
                urlPath: 'game/mobile-configs',
                auth: 'noauth',
                description: 'Key/value map for mobile (e.g. level_coins).',
            }),
            item({
                name: 'List game levels (paginated)',
                method: 'GET',
                urlPath: 'game/levels',
                auth: 'noauth',
                query: [{ key: 'page', value: '1', description: '10 levels per page (default page 1)' }],
                description:
                    'Pagination: ?page=1 → levels 1–10. Bulk range: ?from=1&to=25. Bulk list: ?levels=1,11,12. Missing levels 11+ are generated and saved.',
            }),
            item({
                name: 'Get game level',
                method: 'GET',
                urlPath: 'game/level/{{level_number}}',
                auth: 'noauth',
                description: 'Public level payload (camelCase). Use 1–10 seeded; 11+ generated and cached.',
            }),
            item({
                name: 'Public device state (upsert)',
                method: 'POST',
                urlPath: 'public/device-state',
                auth: 'noauth',
                body: {
                    mode: 'raw',
                    raw: '{\n  "device_id": "device-uuid-123",\n  "last_level": 3,\n  "coins": 100\n}',
                },
                description: 'Throttle: 120/min',
            }),
            item({
                name: 'Level complete',
                method: 'POST',
                urlPath: 'game/level-complete',
                auth: 'noauth',
                body: {
                    mode: 'raw',
                    raw: '{\n  "device_id": "device-uuid-123",\n  "level_cleared": 5,\n  "coins_earned": 25\n}',
                },
                description:
                    'Throttle: 120/min. Optional Bearer: awards user coins_earned too. Server uses game config entry_key level_coins when > 0, else coins_earned.',
            }),
        ],
    },
    {
        name: 'Ads & banners (public / throttled)',
        item: [
            item({
                name: 'Next video ad',
                method: 'GET',
                urlPath: 'ads/next-video',
                auth: 'noauth',
                description: 'Throttle: 120/min',
            }),
            item({
                name: 'Next audio ad',
                method: 'GET',
                urlPath: 'ads/next-audio',
                auth: 'noauth',
                description: 'Throttle: 120/min',
            }),
            item({
                name: 'Next random interstitial (hint)',
                method: 'GET',
                urlPath: 'game/next-ad',
                auth: 'noauth',
                description:
                    'Weighted random among approved audio + video + VAST/VMAP. Response includes `deliveryType`, `assetUrl`, `videoUrl`, `vastTagUrl`, `vmapTagUrl`. Throttle: 120/min.',
            }),
            item({
                name: 'Next random interstitial (level query)',
                method: 'GET',
                urlPath: 'game/next-ad?level=5',
                auth: 'noauth',
                description:
                    'If `level` matches an active game_level_ad_rules row, `eligible` is true and `rule` is returned; otherwise `eligible` false and no ad. Throttle: 120/min.',
            }),
            item({
                name: 'Next random interstitial (alias)',
                method: 'GET',
                urlPath: 'ads/next-random',
                auth: 'noauth',
                description: 'Same as GET /api/game/next-ad. Throttle: 120/min.',
            }),
            item({
                name: 'Track ad event',
                method: 'POST',
                urlPath: 'analytics/ad-event',
                auth: 'noauth',
                body: {
                    mode: 'raw',
                    raw: '{\n  "adAssetId": "{{asset_id}}",\n  "eventType": "impression",\n  "sessionId": null,\n  "watchedDuration": 12.5,\n  "placement": "hint"\n}',
                },
                description:
                    'Interstitial `ad_assets` only. `watchedDuration` is seconds (stored as ms). `placement`: hint | level | unknown. Banners: use /api/banners/{id}/click|impression. Throttle: 120/min.',
            }),
            item({
                name: 'Public banner',
                method: 'GET',
                urlPath: 'banners/public',
                auth: 'noauth',
            }),
            item({
                name: 'Public banner (alias)',
                method: 'GET',
                urlPath: 'ads/banner',
                auth: 'noauth',
                description: 'Same response as GET /api/banners/public.',
            }),
            item({
                name: 'Banner click',
                method: 'POST',
                urlPath: 'banners/{{public_banner_id}}/click',
                auth: 'noauth',
            }),
            item({
                name: 'Banner impression',
                method: 'POST',
                urlPath: 'banners/{{public_banner_id}}/impression',
                auth: 'noauth',
            }),
        ],
    },
    {
        name: 'Subscription (guest or authenticated)',
        item: [
            item({
                name: 'IAP confirm (no account required)',
                method: 'POST',
                urlPath: 'subscription/iap/confirm',
                auth: 'noauth',
                body: {
                    mode: 'raw',
                    raw: '{\n  "device_id": "{{device_id}}",\n  "product_id": "com.wordgridarena.app.pro.monthly",\n  "transaction_id": "txn_example_123",\n  "platform": "ios"\n}',
                },
                description: 'optional.sanctum. Records StoreKit purchase for a device without requiring login.',
            }),
            item({
                name: 'IAP restore (no account required)',
                method: 'POST',
                urlPath: 'subscription/iap/restore',
                auth: 'noauth',
                body: {
                    mode: 'raw',
                    raw: '{\n  "device_id": "{{device_id}}",\n  "platform": "ios",\n  "purchases": [\n    {\n      "product_id": "com.wordgridarena.app.pro.monthly",\n      "transaction_id": "txn_example_123"\n    }\n  ]\n}',
                },
                description: 'optional.sanctum. Restores IAP entitlements for a device without requiring login.',
            }),
            item({
                name: 'Subscription status (device or user)',
                method: 'GET',
                urlPath: 'subscription/status?device_id={{device_id}}',
                auth: 'noauth',
                description: 'optional.sanctum. Pass device_id for guests; Bearer token optional for account-linked status.',
            }),
        ],
    },
    {
        name: 'Subscription (Stripe — authenticated user)',
        item: [
            item({
                name: 'Checkout',
                method: 'POST',
                urlPath: 'subscription/checkout',
                body: { mode: 'raw', raw: '{\n  "subscription_plan_id": 1,\n  "success_url": "https://example.com/success",\n  "cancel_url": "https://example.com/cancel"\n}' },
                description: 'auth:sanctum. Stripe web checkout only. Throttle: 60/min',
            }),
            item({
                name: 'Billing portal',
                method: 'POST',
                urlPath: 'subscription/portal',
                description: 'auth:sanctum. Throttle: 60/min',
            }),
        ],
    },
    {
        name: 'Admin — Ad assets',
        item: [
            item({
                name: 'Presigned upload URL',
                method: 'POST',
                urlPath: 'ads/upload-url',
                body: {
                    mode: 'raw',
                    raw: '{\n  "filename": "promo.mp4",\n  "contentType": "video/mp4"\n}',
                },
                description:
                    'auth:sanctum + admin. Prefers Wasabi (WAS_*) when set; else AWS S3. Response includes `publicUrl`, `maxUploadBytes` (200MB cap for client PUT). Set PHP upload_max_filesize/post_max_size ≥ 200M for multipart /api/ads/assets.',
            }),
            item({
                name: 'Create asset (JSON)',
                method: 'POST',
                urlPath: 'ads/assets/json',
                body: {
                    mode: 'raw',
                    raw: '{\n  "name": "Sample",\n  "type": "audio",\n  "format": "audio",\n  "asset_url": "https://example.com/file.mp3"\n}',
                },
            }),
            item({
                name: 'Create asset (multipart)',
                method: 'POST',
                urlPath: 'ads/assets',
                body: {
                    mode: 'formdata',
                    formdata: [
                        { key: 'name', value: 'TEST', type: 'text' },
                        { key: 'type', value: 'audio', type: 'text' },
                        { key: 'format', value: 'audio', type: 'text' },
                        { key: 'file', type: 'file', src: [] },
                    ],
                },
                description: 'Use form-data; CSRF for SPA (X-XSRF-TOKEN + cookies).',
            }),
            item({ name: 'List assets', method: 'GET', urlPath: 'ads/assets' }),
            item({ name: 'List assets with analytics', method: 'GET', urlPath: 'ads/assets/with-analytics' }),
            item({
                name: 'Update asset',
                method: 'PATCH',
                urlPath: 'ads/assets/{{asset_id}}',
                body: { mode: 'raw', raw: '{}' },
            }),
            item({ name: 'Delete asset', method: 'DELETE', urlPath: 'ads/assets/{{asset_id}}' }),
            item({
                name: 'Approve asset',
                method: 'PATCH',
                urlPath: 'ads/assets/{{asset_id}}/approve',
                body: { mode: 'raw', raw: '{\n  "status": "approved"\n}' },
            }),
            item({
                name: 'Toggle asset (approved/paused)',
                method: 'PATCH',
                urlPath: 'ads/assets/{{asset_id}}/toggle',
            }),
            item({ name: 'Asset analytics events', method: 'GET', urlPath: 'ads/assets/{{asset_id}}/analytics' }),
            item({
                name: 'Asset event locations',
                method: 'GET',
                urlPath: 'ads/assets/{{asset_id}}/locations',
                description: 'Optional query: ?eventType=...',
            }),
        ],
    },
    {
        name: 'Admin — Rules & campaigns',
        item: [
            item({ name: 'List ad rules', method: 'GET', urlPath: 'ads/rules' }),
            item({
                name: 'Create ad rule',
                method: 'POST',
                urlPath: 'ads/rules',
                body: {
                    mode: 'raw',
                    raw: '{\n  "frequency_per_hour": 60,\n  "allowed_hours": null,\n  "enabled": true\n}',
                },
            }),
            item({
                name: 'Update ad rule',
                method: 'PATCH',
                urlPath: 'ads/rules/{{rule_id}}',
                body: { mode: 'raw', raw: '{}' },
            }),
            item({ name: 'Delete ad rule', method: 'DELETE', urlPath: 'ads/rules/{{rule_id}}' }),
            item({ name: 'List campaigns', method: 'GET', urlPath: 'ads/campaigns' }),
            item({
                name: 'Create campaign',
                method: 'POST',
                urlPath: 'ads/campaigns',
                body: { mode: 'raw', raw: '{}' },
            }),
            item({
                name: 'Update campaign',
                method: 'PATCH',
                urlPath: 'ads/campaigns/{{campaign_id}}',
                body: { mode: 'raw', raw: '{}' },
            }),
            item({ name: 'Delete campaign', method: 'DELETE', urlPath: 'ads/campaigns/{{campaign_id}}' }),
        ],
    },
    {
        name: 'Admin — Analytics',
        item: [
            item({ name: 'Platform analytics', method: 'GET', urlPath: 'ads/platform-analytics' }),
            item({ name: 'Top performing', method: 'GET', urlPath: 'ads/top-performing' }),
            item({
                name: 'Ads analytics (alias)',
                method: 'GET',
                urlPath: 'ads/analytics',
                description: 'Same controller as platform-analytics in routes.',
            }),
        ],
    },
    {
        name: 'Admin — Advertisers',
        item: [
            item({ name: 'List advertisers', method: 'GET', urlPath: 'advertisers' }),
            item({
                name: 'Create advertiser',
                method: 'POST',
                urlPath: 'advertisers',
                body: {
                    mode: 'raw',
                    raw: '{\n  "name": "Acme",\n  "company_name": "Acme Inc",\n  "email": "ads@acme.com",\n  "is_active": true\n}',
                },
            }),
            item({ name: 'Show advertiser', method: 'GET', urlPath: 'advertisers/{{advertiser_id}}' }),
            item({
                name: 'Update advertiser',
                method: 'PUT',
                urlPath: 'advertisers/{{advertiser_id}}',
                body: { mode: 'raw', raw: '{}' },
            }),
            item({ name: 'Delete advertiser', method: 'DELETE', urlPath: 'advertisers/{{advertiser_id}}' }),
            item({ name: 'Advertiser report', method: 'GET', urlPath: 'advertisers/{{advertiser_id}}/report' }),
            item({ name: 'Advertiser export', method: 'GET', urlPath: 'advertisers/{{advertiser_id}}/export' }),
        ],
    },
    {
        name: 'Admin — Platform banners',
        item: [
            item({ name: 'List banners', method: 'GET', urlPath: 'admin/banners' }),
            item({
                name: 'Create banner',
                method: 'POST',
                urlPath: 'admin/banners',
                body: {
                    mode: 'raw',
                    raw: '{\n  "image_url": "https://example.com/banner.png",\n  "link_url": "https://example.com",\n  "name": "Home promo",\n  "weight": 5,\n  "is_active": true\n}',
                },
            }),
            item({
                name: 'Update banner',
                method: 'PATCH',
                urlPath: 'admin/banners/{{banner_id}}',
                body: { mode: 'raw', raw: '{}' },
            }),
            item({ name: 'Delete banner', method: 'DELETE', urlPath: 'admin/banners/{{banner_id}}' }),
        ],
    },
    {
        name: 'Admin — Game level ad rules',
        item: [
            item({ name: 'List level ad rules', method: 'GET', urlPath: 'admin/game-level-ad-rules' }),
            item({
                name: 'Create level ad rule',
                method: 'POST',
                urlPath: 'admin/game-level-ad-rules',
                body: {
                    mode: 'raw',
                    raw: '{\n  "level_from": 1,\n  "level_to": null,\n  "ads_after_level_complete": 1,\n  "is_active": true,\n  "sort_order": 0\n}',
                },
            }),
            item({
                name: 'Update level ad rule',
                method: 'PATCH',
                urlPath: 'admin/game-level-ad-rules/{{level_rule_id}}',
                body: { mode: 'raw', raw: '{}' },
            }),
            item({
                name: 'Delete level ad rule',
                method: 'DELETE',
                urlPath: 'admin/game-level-ad-rules/{{level_rule_id}}',
            }),
        ],
    },
    {
        name: 'Admin — Subscription plans',
        item: [
            item({ name: 'List plans (admin)', method: 'GET', urlPath: 'admin/subscription/plans' }),
            item({
                name: 'Create plan',
                method: 'POST',
                urlPath: 'admin/subscription/plans',
                body: {
                    mode: 'raw',
                    raw: '{\n  "name": "Pro",\n  "description": "Removes ads",\n  "interval": "month",\n  "amount": 999,\n  "currency": "usd",\n  "removes_ads": true,\n  "coins": 100,\n  "is_active": true\n}',
                },
            }),
            item({
                name: 'Update plan',
                method: 'PATCH',
                urlPath: 'admin/subscription/plans/{{plan_id}}',
                body: {
                    mode: 'raw',
                    raw: '{\n  "name": "Pro",\n  "amount": 999,\n  "interval": "month",\n  "removes_ads": true,\n  "coins": 100,\n  "is_active": true\n}',
                },
            }),
            item({ name: 'Delete plan', method: 'DELETE', urlPath: 'admin/subscription/plans/{{plan_id}}' }),
        ],
    },
    {
        name: 'Admin — Level backgrounds',
        item: [
            item({
                name: 'Presigned level background upload',
                method: 'POST',
                urlPath: 'level-backgrounds/presign',
                body: {
                    mode: 'raw',
                    raw: '{\n  "filename": "bg.jpg",\n  "contentType": "image/jpeg"\n}',
                },
                description: 'auth:sanctum + admin. Wasabi/S3 presign; PUT file to uploadUrl then save publicUrl via create row.',
            }),
            item({ name: 'List level background images', method: 'GET', urlPath: 'admin/level-background-images' }),
            item({
                name: 'Create level background image',
                method: 'POST',
                urlPath: 'admin/level-background-images',
                body: {
                    mode: 'raw',
                    raw: '{\n  "image_url": "https://...",\n  "title": "Winter",\n  "sort_order": 0,\n  "is_active": true\n}',
                },
            }),
            item({
                name: 'Update level background image',
                method: 'PATCH',
                urlPath: 'admin/level-background-images/{{level_bg_image_id}}',
                body: { mode: 'raw', raw: '{}' },
            }),
            item({
                name: 'Delete level background image',
                method: 'DELETE',
                urlPath: 'admin/level-background-images/{{level_bg_image_id}}',
            }),
        ],
    },
    {
        name: 'Admin — Game config entries',
        item: [
            item({ name: 'List game config entries', method: 'GET', urlPath: 'admin/game-config-entries' }),
            item({
                name: 'Create game config entry',
                method: 'POST',
                urlPath: 'admin/game-config-entries',
                body: {
                    mode: 'raw',
                    raw: '{\n  "entry_key": "level_coins",\n  "entry_value": "10"\n}',
                },
            }),
            item({
                name: 'Update game config entry',
                method: 'PATCH',
                urlPath: 'admin/game-config-entries/{{game_config_id}}',
                body: {
                    mode: 'raw',
                    raw: '{\n  "entry_key": "level_coins",\n  "entry_value": "25"\n}',
                },
            }),
            item({
                name: 'Delete game config entry',
                method: 'DELETE',
                urlPath: 'admin/game-config-entries/{{game_config_id}}',
            }),
        ],
    },
    {
        name: 'Admin — Users',
        item: [
            item({ name: 'List users', method: 'GET', urlPath: 'admin/users' }),
            item({
                name: 'Create user',
                method: 'POST',
                urlPath: 'admin/users',
                body: {
                    mode: 'raw',
                    raw: '{\n  "name": "New Admin",\n  "email": "newadmin@example.com",\n  "password": "password",\n  "password_confirmation": "password",\n  "is_admin": true\n}',
                },
            }),
            item({ name: 'Show user', method: 'GET', urlPath: 'admin/users/{{admin_user_id}}' }),
            item({
                name: 'Update user',
                method: 'PATCH',
                urlPath: 'admin/users/{{admin_user_id}}',
                body: {
                    mode: 'raw',
                    raw: '{\n  "name": "Updated",\n  "email": "updated@example.com",\n  "is_admin": true\n}',
                },
            }),
            item({ name: 'Delete user', method: 'DELETE', urlPath: 'admin/users/{{admin_user_id}}' }),
        ],
    },
    {
        name: 'Admin — Settings',
        item: [
            item({ name: 'Get Stripe settings', method: 'GET', urlPath: 'admin/settings/stripe' }),
            item({
                name: 'Update Stripe settings',
                method: 'PUT',
                urlPath: 'admin/settings/stripe',
                body: {
                    mode: 'raw',
                    raw: '{\n  "stripe_publishable_key": "pk_test_...",\n  "stripe_secret_key": "sk_test_...",\n  "stripe_webhook_secret": "whsec_..."\n}',
                },
            }),
        ],
    },
];

const collection = {
    info: {
        _postman_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'GameAppBackend API',
        description:
            'All routes from routes/api.php (Laravel default prefix: /api).\n\n**Sanctum (SPA / cookie):** For browser-style auth, call `GET /sanctum/csrf-cookie` on the same origin first, then send `X-XSRF-TOKEN` from the `XSRF-TOKEN` cookie and `Accept: application/json`.\n\n**Token (mobile / Bearer):** Use `Authorization: Bearer {{token}}` after login/register when using token abilities.\n\n**Admin routes** require `auth:sanctum` + `admin` middleware (user must be admin).\n\n**Ads vs banners:** Interstitial ads (`ad_assets`) use `POST /api/analytics/ad-event` with `adAssetId`. Banners use `POST /api/banners/{id}/click` and `POST /api/banners/{id}/impression` only.\n\n**Regenerate this file:** `npm run postman:generate`',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
        { key: 'base_url', value: 'http://127.0.0.1:8000' },
        { key: 'token', value: '' },
        { key: 'asset_id', value: '' },
        { key: 'rule_id', value: '' },
        { key: 'campaign_id', value: '' },
        { key: 'advertiser_id', value: '' },
        { key: 'banner_id', value: '' },
        { key: 'plan_id', value: '' },
        { key: 'level_rule_id', value: '' },
        { key: 'public_banner_id', value: '' },
        { key: 'level_number', value: '1' },
        { key: 'level_bg_image_id', value: '' },
        { key: 'game_config_id', value: '' },
        { key: 'admin_user_id', value: '' },
    ],
    auth: {
        type: 'bearer',
        bearer: [{ key: 'token', value: '{{token}}', type: 'string' }],
    },
    item: folders,
};

writeFileSync(outPath, `${JSON.stringify(collection, null, '\t')}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
