<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameConfigEntry extends Model
{
    protected $table = 'game_config_entries';

    protected $fillable = [
        'entry_key',
        'entry_value',
    ];

    public static function mapAll(): array
    {
        return static::query()
            ->orderBy('entry_key')
            ->pluck('entry_value', 'entry_key')
            ->map(fn (?string $v) => self::coerceValue($v))
            ->all();
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $row = static::query()->where('entry_key', $key)->value('entry_value');

        return $row === null ? $default : self::coerceValue($row);
    }

    protected static function coerceValue(?string $v): mixed
    {
        if ($v === null) {
            return null;
        }
        if (is_numeric($v)) {
            return str_contains($v, '.') ? (float) $v : (int) $v;
        }

        return $v;
    }
}
