<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_level_ad_rules', function (Blueprint $table) {
            $table->unsignedSmallInteger('level_interval')
                ->default(1)
                ->after('level_to')
                ->comment('Show ads when level number is divisible by this value (1 = every level in range)');
        });
    }

    public function down(): void
    {
        Schema::table('game_level_ad_rules', function (Blueprint $table) {
            $table->dropColumn('level_interval');
        });
    }
};
