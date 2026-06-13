<?php

namespace App\Console\Commands;

use App\Services\Game\ChristmasWordImporter;
use Illuminate\Console\Command;

class ImportChristmasWordsCommand extends Command
{
    protected $signature = 'game:import-christmas-words';

    protected $description = 'Import Christmas Word Quest CSV packs into level configs and manifest';

    public function handle(ChristmasWordImporter $importer): int
    {
        $basePath = base_path('wordsdata');
        $this->info('Importing Christmas words from '.$basePath.'...');

        $result = $importer->import($basePath);

        $poolsPath = config_path('procedural_word_pools.php');
        $blueprintsPath = config_path('game_level_blueprints.php');
        $manifestPath = base_path('wordsdata/christmas_word_manifest.json');

        $importer->writeProceduralWordPools($poolsPath, $result['pools_by_length']);
        $importer->writeGameLevelBlueprints($blueprintsPath, $result['level_assignments']);

        $poolCounts = [];
        foreach ($result['pools_by_length'] as $length => $pool) {
            $poolCounts[(string) $length] = count($pool);
        }

        $manifest = [
            'total_raw' => $result['total_raw'],
            'total_unique' => $result['total_unique'],
            'duplicates_removed' => $result['duplicates_removed'],
            'singular_filtered' => $result['singular_filtered'],
            'words' => $result['words'],
            'level_assignments' => $result['level_assignments'],
            'pools_by_length' => $poolCounts,
        ];

        $importer->writeManifest($manifestPath, $manifest);

        $this->info('Imported '.$result['total_unique'].' unique Christmas words.');
        $this->info('Removed '.$result['duplicates_removed'].' duplicate/singular-mismatch rows.');
        $this->info('Updated '.$poolsPath);
        $this->info('Updated '.$blueprintsPath);
        $this->info('Wrote '.$manifestPath);

        foreach ($result['level_assignments'] as $level => $words) {
            $this->line("  Level {$level}: ".implode(', ', $words));
        }

        return self::SUCCESS;
    }
}
