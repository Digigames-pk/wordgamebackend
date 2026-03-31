<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class AppSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, ?string $default = null): ?string
    {
        $row = static::query()->where('key', $key)->first();

        return $row?->value ?? $default;
    }

    public static function getEncrypted(string $key, ?string $envFallback = null): ?string
    {
        $raw = static::get($key);
        if ($raw !== null && $raw !== '') {
            try {
                return Crypt::decryptString($raw);
            } catch (\Throwable) {
                return $raw;
            }
        }

        return $envFallback;
    }

    public static function setEncrypted(string $key, ?string $plain): void
    {
        if ($plain === null || $plain === '') {
            static::query()->where('key', $key)->delete();

            return;
        }

        static::updateOrCreate(
            ['key' => $key],
            ['value' => Crypt::encryptString($plain)]
        );
    }

    public static function setPlain(string $key, ?string $value): void
    {
        if ($value === null || $value === '') {
            static::query()->where('key', $key)->delete();

            return;
        }

        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
