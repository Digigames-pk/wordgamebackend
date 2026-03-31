<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('advertisers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ad_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('owner_type')->default('global');
            $table->foreignUuid('advertiser_id')->nullable()->constrained('advertisers')->nullOnDelete();
            $table->string('name');
            $table->string('type');
            $table->string('format')->default('audio');
            $table->string('placement_type')->default('all');
            $table->text('asset_url');
            $table->text('video_url')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->string('aspect_ratio')->nullable()->default('16:9');
            $table->unsignedInteger('duration_sec')->default(0);
            $table->unsignedBigInteger('max_file_size')->nullable();
            $table->unsignedInteger('skip_after_sec')->nullable()->default(5);
            $table->boolean('is_skippable')->default(true);
            $table->text('click_through_url')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status')->default('pending');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('impression_count')->default(0);
            $table->unsignedInteger('click_count')->default(0);
            $table->unsignedInteger('completion_count')->default(0);
            $table->unsignedInteger('frequency_per_hour')->nullable();
            $table->unsignedInteger('frequency_per_listener')->nullable();
            $table->unsignedInteger('frequency_per_show')->nullable();
            $table->unsignedInteger('duration_limit')->nullable();
            $table->json('time_slots')->nullable();
            $table->string('banner_position')->nullable();
            $table->string('banner_size')->nullable();
            $table->text('external_ad_code')->nullable();
            $table->json('display_timing')->nullable();
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->unsignedInteger('max_impressions')->nullable();
            $table->unsignedInteger('max_clicks')->nullable();
            $table->text('vast_tag_url')->nullable();
            $table->text('vmap_tag_url')->nullable();
            $table->unsignedTinyInteger('weight')->default(5);
            $table->json('geo_countries')->nullable();
            $table->json('geo_states')->nullable();
            $table->json('geo_cities')->nullable();
            $table->json('geo_exclude_countries')->nullable();
            $table->json('geo_exclude_states')->nullable();
            $table->json('geo_exclude_cities')->nullable();
            $table->unsignedInteger('cpm')->default(0);
            $table->unsignedInteger('cpc')->default(0);
            $table->unsignedBigInteger('total_revenue')->default(0);
            $table->unsignedInteger('plays_in_current_hour')->default(0);
            $table->timestamp('last_hour_reset')->nullable();
            $table->unsignedInteger('plays_in_current_show')->default(0);
            $table->string('current_show_id')->nullable();
            $table->timestamps();
        });

        Schema::create('ad_analytics_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ad_asset_id')->constrained('ad_assets')->cascadeOnDelete();
            $table->string('event_type');
            $table->string('country')->nullable();
            $table->string('country_code')->nullable();
            $table->string('region')->nullable();
            $table->string('city')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->string('session_id')->nullable();
            $table->string('client_ip')->nullable();
            $table->timestamp('recorded_at')->useCurrent();
            $table->index(['ad_asset_id', 'recorded_at']);
        });

        Schema::create('ad_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedInteger('frequency_per_hour');
            $table->json('allowed_hours')->nullable();
            $table->json('targeting')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });

        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->unsignedInteger('budget')->nullable();
            $table->unsignedInteger('impressions')->default(0);
            $table->unsignedInteger('clicks')->default(0);
            $table->string('status')->default('draft');
            $table->json('target_languages')->nullable();
            $table->timestamps();
        });

        Schema::create('banner_ads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('image_url');
            $table->text('link_url')->nullable();
            $table->string('alt_text')->nullable();
            $table->string('name')->nullable();
            $table->string('position')->default('bottom');
            $table->string('size')->default('medium');
            $table->unsignedTinyInteger('weight')->default(5);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_platform_default')->default(false);
            $table->unsignedInteger('click_count')->default(0);
            $table->unsignedInteger('impression_count')->default(0);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->unsignedInteger('max_impressions')->nullable();
            $table->unsignedInteger('max_clicks')->nullable();
            $table->unsignedInteger('cpm')->default(0);
            $table->unsignedInteger('cpc')->default(0);
            $table->timestamps();
        });

        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('interval')->default('month');
            $table->unsignedInteger('amount');
            $table->string('currency', 3)->default('usd');
            $table->boolean('removes_ads')->default(true);
            $table->boolean('is_active')->default(true);
            $table->string('stripe_product_id')->nullable();
            $table->string('stripe_price_id')->nullable();
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->string('stripe_customer_id')->nullable();
            $table->string('stripe_subscription_id')->nullable()->index();
            $table->string('status')->default('incomplete');
            $table->timestamp('current_period_end')->nullable();
            $table->timestamps();
        });

        Schema::create('game_level_ad_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('level_from');
            $table->unsignedInteger('level_to')->nullable();
            $table->unsignedInteger('ads_after_level_complete')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_level_ad_rules');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('banner_ads');
        Schema::dropIfExists('ad_campaigns');
        Schema::dropIfExists('ad_rules');
        Schema::dropIfExists('ad_analytics_events');
        Schema::dropIfExists('ad_assets');
        Schema::dropIfExists('advertisers');
        Schema::dropIfExists('app_settings');
    }
};
