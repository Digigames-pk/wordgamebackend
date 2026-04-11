<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ad_analytics_events', function (Blueprint $table) {
            $table->unsignedInteger('watched_duration_ms')->nullable()->after('session_id');
            $table->string('placement', 32)->nullable()->after('watched_duration_ms');
        });
    }

    public function down(): void
    {
        Schema::table('ad_analytics_events', function (Blueprint $table) {
            $table->dropColumn(['watched_duration_ms', 'placement']);
        });
    }
};
