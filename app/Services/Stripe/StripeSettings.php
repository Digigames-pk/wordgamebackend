<?php

namespace App\Services\Stripe;

use App\Models\AppSetting;

class StripeSettings
{
    public const KEY_SECRET = 'stripe_secret_key';

    public const KEY_PUBLISHABLE = 'stripe_publishable_key';

    public const KEY_WEBHOOK = 'stripe_webhook_secret';

    public function secretKey(): ?string
    {
        return AppSetting::getEncrypted(self::KEY_SECRET, config('services.stripe.secret'));
    }

    public function publishableKey(): ?string
    {
        $v = AppSetting::get(self::KEY_PUBLISHABLE);

        return $v ?: config('services.stripe.key');
    }

    public function webhookSecret(): ?string
    {
        return AppSetting::getEncrypted(self::KEY_WEBHOOK, config('services.stripe.webhook_secret'));
    }

    public function configured(): bool
    {
        return $this->secretKey() !== null && $this->secretKey() !== '';
    }
}
