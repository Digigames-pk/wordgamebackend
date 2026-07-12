<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('device_states', function (Blueprint $table) {
            $table->foreignId('subscription_plan_id')
                ->nullable()
                ->after('coins')
                ->constrained('subscription_plans')
                ->nullOnDelete();
            $table->string('iap_product_id')->nullable()->after('subscription_plan_id');
            $table->string('iap_transaction_id')->nullable()->unique()->after('iap_product_id');
            $table->string('iap_platform', 16)->nullable()->after('iap_transaction_id');
            $table->timestamp('iap_purchased_at')->nullable()->after('iap_platform');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('iap_product_id')->nullable()->after('stripe_subscription_id');
            $table->string('iap_transaction_id')->nullable()->unique()->after('iap_product_id');
            $table->string('platform', 16)->nullable()->after('iap_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['iap_product_id', 'iap_transaction_id', 'platform']);
        });

        Schema::table('device_states', function (Blueprint $table) {
            $table->dropConstrainedForeignId('subscription_plan_id');
            $table->dropColumn(['iap_product_id', 'iap_transaction_id', 'iap_platform', 'iap_purchased_at']);
        });
    }
};
