<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Services\Stripe\StripeSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppSettingsController extends Controller
{
    public function stripeKeys(): JsonResponse
    {
        $publishable = AppSetting::get(StripeSettings::KEY_PUBLISHABLE)
            ?: config('services.stripe.key');
        $secretMasked = $this->mask(AppSetting::getEncrypted(StripeSettings::KEY_SECRET, config('services.stripe.secret')));
        $webhookMasked = $this->mask(AppSetting::getEncrypted(StripeSettings::KEY_WEBHOOK, config('services.stripe.webhook_secret')));

        return response()->json([
            'stripe_publishable_key' => $publishable,
            'stripe_secret_key_set' => $secretMasked !== null,
            'stripe_secret_key_preview' => $secretMasked,
            'stripe_webhook_secret_set' => $webhookMasked !== null,
            'stripe_webhook_secret_preview' => $webhookMasked,
            'webhook_url' => url('/api/stripe/webhook'),
        ]);
    }

    public function updateStripeKeys(Request $request): JsonResponse
    {
        $data = $request->validate([
            'stripe_publishable_key' => ['nullable', 'string', 'max:500'],
            'stripe_secret_key' => ['nullable', 'string', 'max:500'],
            'stripe_webhook_secret' => ['nullable', 'string', 'max:500'],
        ]);

        if (array_key_exists('stripe_publishable_key', $data)) {
            AppSetting::setPlain(StripeSettings::KEY_PUBLISHABLE, $data['stripe_publishable_key']);
        }
        if (! empty($data['stripe_secret_key'])) {
            AppSetting::setEncrypted(StripeSettings::KEY_SECRET, $data['stripe_secret_key']);
        }
        if (! empty($data['stripe_webhook_secret'])) {
            AppSetting::setEncrypted(StripeSettings::KEY_WEBHOOK, $data['stripe_webhook_secret']);
        }

        return $this->stripeKeys();
    }

    protected function mask(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return '****'.substr($value, -4);
    }
}
