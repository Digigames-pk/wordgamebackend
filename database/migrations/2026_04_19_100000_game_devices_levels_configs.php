<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_states', function (Blueprint $table) {
            $table->id();
            $table->string('device_id')->unique();
            $table->unsignedInteger('last_level')->default(1);
            $table->unsignedBigInteger('coins')->default(0);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('device_id_key')->nullable()->after('stripe_customer_id')->constrained('device_states')->nullOnDelete();
            $table->unsignedBigInteger('coins_earned')->default(0)->after('device_id_key');
        });

        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->unsignedInteger('coins')->default(0)->after('removes_ads');
        });

        Schema::create('game_levels', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('level_number')->unique();
            $table->string('name');
            $table->string('theme')->default('generic');
            $table->string('difficulty')->default('Easy');
            $table->json('letters');
            $table->json('words');
            $table->json('grid_words');
            $table->json('grid_layout');
            $table->string('background_color', 32)->nullable();
            $table->string('accent_color', 32)->nullable();
            $table->text('background_image')->nullable();
            $table->string('grid_style')->default('circle');
            $table->unsignedInteger('reward')->default(0);
            $table->boolean('is_procedurally_generated')->default(false);
            $table->unsignedSmallInteger('procedural_tier')->nullable();
            $table->timestamps();
        });

        Schema::create('level_background_images', function (Blueprint $table) {
            $table->id();
            $table->text('image_url');
            $table->string('title')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('game_config_entries', function (Blueprint $table) {
            $table->id();
            $table->string('entry_key')->unique();
            $table->text('entry_value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_config_entries');
        Schema::dropIfExists('level_background_images');
        Schema::dropIfExists('game_levels');

        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn('coins');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('device_id_key');
            $table->dropColumn('coins_earned');
        });

        Schema::dropIfExists('device_states');
    }
};
