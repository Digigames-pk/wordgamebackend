<?php

namespace App\Services\Game;

use Illuminate\Support\Str;
use RuntimeException;

class ChristmasWordImporter
{
    private const PACK_COUNT = 6;

    /** @var array<string, int> */
    private const DIFFICULTY_RANK = [
        'Easy' => 0,
        'Medium' => 1,
        'Hard' => 2,
        'Expert' => 3,
    ];

    /**
     * @return array{
     *     words: array<int, array{word: string, length: int, difficulty: string, source_pack: int, rank: int}>,
     *     pools_by_length: array<int, array<int, string>>,
     *     level_assignments: array<int, array<int, string>>,
     *     total_raw: int,
     *     total_unique: int,
     *     duplicates_removed: int,
     *     singular_filtered: int,
     * }
     */
    public function import(string $wordsDataPath): array
    {
        $rawRows = $this->readCsvRows($wordsDataPath);
        $totalRaw = count($rawRows);

        $deduped = $this->dedupeRows($rawRows);
        $duplicatesRemoved = $totalRaw - count($deduped);

        [$filtered, $singularFiltered] = $this->filterSingularLength($deduped);
        $ordered = $this->sortRows($filtered);

        $words = [];
        foreach ($ordered as $i => $row) {
            $words[] = [
                'word' => $row['word'],
                'length' => $row['length'],
                'difficulty' => $row['difficulty'],
                'source_pack' => $row['source_pack'],
                'rank' => $i + 1,
            ];
        }

        $blueprints = config('game_level_blueprints', []);
        if ($blueprints === []) {
            throw new RuntimeException('game_level_blueprints config is empty.');
        }

        [$levelAssignments, $usedWords] = $this->assignBlueprintWords($words, $blueprints);

        $poolsByLength = $this->buildPoolsByLength($words, $usedWords);

        return [
            'words' => $words,
            'pools_by_length' => $poolsByLength,
            'level_assignments' => $levelAssignments,
            'total_raw' => $totalRaw,
            'total_unique' => count($words),
            'duplicates_removed' => $duplicatesRemoved + $singularFiltered,
            'singular_filtered' => $singularFiltered,
        ];
    }

    /**
     * @return array<int, array{word: string, length: int, difficulty: string, source_pack: int, category: string}>
     */
    private function readCsvRows(string $wordsDataPath): array
    {
        $rows = [];

        for ($pack = 1; $pack <= self::PACK_COUNT; $pack++) {
            $path = rtrim($wordsDataPath, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR."Christmas_Word_Quest_Pack{$pack}.csv";
            if (! is_readable($path)) {
                throw new RuntimeException("Missing CSV: {$path}");
            }

            $handle = fopen($path, 'r');
            if ($handle === false) {
                throw new RuntimeException("Cannot open CSV: {$path}");
            }

            $header = fgetcsv($handle);
            if ($header === false) {
                fclose($handle);
                continue;
            }

            while (($data = fgetcsv($handle)) !== false) {
                if (count($data) < 4) {
                    continue;
                }

                $word = strtoupper(trim((string) $data[0]));
                if ($word === '') {
                    continue;
                }

                $rows[] = [
                    'word' => $word,
                    'category' => (string) ($data[1] ?? 'Christmas'),
                    'difficulty' => (string) ($data[2] ?? 'Medium'),
                    'length' => (int) ($data[3] ?? strlen($word)),
                    'source_pack' => $pack,
                ];
            }

            fclose($handle);
        }

        return $rows;
    }

    /**
     * @param  array<int, array{word: string, length: int, difficulty: string, source_pack: int, category: string}>  $rows
     * @return array<int, array{word: string, length: int, difficulty: string, source_pack: int, category: string}>
     */
    private function dedupeRows(array $rows): array
    {
        $byWord = [];

        foreach ($rows as $row) {
            $key = strtolower($row['word']);
            if (! isset($byWord[$key])) {
                $byWord[$key] = $row;

                continue;
            }

            $existing = $byWord[$key];
            if ($this->rowSortKey($row) < $this->rowSortKey($existing)) {
                $byWord[$key] = $row;
            }
        }

        return array_values($byWord);
    }

    /**
     * @param  array{word: string, length: int, difficulty: string, source_pack: int, category: string}  $row
     * @return array{int, int, int, string}
     */
    private function rowSortKey(array $row): array
    {
        return [
            $row['source_pack'],
            self::DIFFICULTY_RANK[$row['difficulty']] ?? 99,
            $row['length'],
            $row['word'],
        ];
    }

    /**
     * @param  array<int, array{word: string, length: int, difficulty: string, source_pack: int, category: string}>  $rows
     * @return array{0: array<int, array{word: string, length: int, difficulty: string, source_pack: int, category: string}>, 1: int}
     */
    private function filterSingularLength(array $rows): array
    {
        $filtered = [];
        $removed = 0;

        foreach ($rows as $row) {
            $singular = strtoupper(Str::singular($row['word']));
            if (strlen($singular) !== $row['length']) {
                $removed++;

                continue;
            }

            $row['word'] = $singular;
            $filtered[] = $row;
        }

        return [$filtered, $removed];
    }

    /**
     * @param  array<int, array{word: string, length: int, difficulty: string, source_pack: int, category: string}>  $rows
     * @return array<int, array{word: string, length: int, difficulty: string, source_pack: int, category: string}>
     */
    private function sortRows(array $rows): array
    {
        usort($rows, function (array $a, array $b): int {
            return $this->rowSortKey($a) <=> $this->rowSortKey($b);
        });

        return $rows;
    }

    /**
     * @param  array<int, array{word: string, length: int, difficulty: string, source_pack: int, rank: int}>  $orderedWords
     * @param  array<int, array<string, mixed>>  $blueprints
     * @return array{0: array<int, array<int, string>>, 1: array<string, true>}
     */
    private function assignBlueprintWords(array $orderedWords, array $blueprints): array
    {
        $candidatesByLength = [];
        foreach ($orderedWords as $entry) {
            $candidatesByLength[$entry['length']][] = $entry['word'];
        }

        $levelAssignments = [];
        $usedWords = [];

        foreach ($blueprints as $index => $blueprint) {
            $levelNumber = $index + 1;
            [$slotOrder, $slotLengths, $constraints] = $this->blueprintCrosswordMeta($blueprint);

            $assignment = $this->solveCrossword($slotOrder, $slotLengths, $constraints, $candidatesByLength, $usedWords);
            if ($assignment === null) {
                $assignment = $this->solveCrossword($slotOrder, $slotLengths, $constraints, $candidatesByLength, []);
            }
            if ($assignment === null) {
                throw new RuntimeException("No Christmas word set found for blueprint level {$levelNumber}.");
            }

            foreach ($assignment as $word) {
                $usedWords[$word] = true;
            }

            $levelAssignments[$levelNumber] = $assignment;
        }

        return [$levelAssignments, $usedWords];
    }

    /**
     * @param  array<string, mixed>  $blueprint
     * @return array{0: array<int, int>, 1: array<int, int>, 2: array<int, array{int, int, int, int}>}
     */
    private function blueprintCrosswordMeta(array $blueprint): array
    {
        $templateWords = array_map(
            static fn (mixed $w): string => strtoupper((string) $w),
            $blueprint['words'] ?? [],
        );
        $slotLengths = array_map(static fn (string $w): int => strlen($w), $templateWords);
        $constraints = $this->buildCrossConstraints($blueprint['grid_layout'] ?? [], $slotLengths);
        $slotOrder = $this->slotOrderByConstraints($slotLengths, $constraints);

        return [$slotOrder, $slotLengths, $constraints];
    }

    /**
     * @param  array<int, int>  $slotLengths
     * @param  array<int, array{int, int, int, int}>  $constraints
     * @return array<int, int>
     */
    private function slotOrderByConstraints(array $slotLengths, array $constraints): array
    {
        $degrees = array_fill(0, count($slotLengths), 0);
        foreach ($constraints as [$slotA, , $slotB]) {
            $degrees[$slotA]++;
            $degrees[$slotB]++;
        }

        $order = array_keys($slotLengths);
        usort($order, function (int $a, int $b) use ($degrees, $slotLengths): int {
            if ($degrees[$a] !== $degrees[$b]) {
                return $degrees[$b] <=> $degrees[$a];
            }

            return $slotLengths[$b] <=> $slotLengths[$a];
        });

        return $order;
    }

    /**
     * @param  array<int, mixed>  $gridLayout
     * @param  array<int, int>  $slotLengths
     * @return array<int, array<int, array{slot: int, index: int}>>
     */
    private function buildCrossConstraints(array $gridLayout, array $slotLengths): array
    {
        /** @var array<string, array<int, array{slot: int, index: int}>> $cells */
        $cells = [];

        foreach ($gridLayout as $slot => $item) {
            if (! is_array($item)) {
                continue;
            }

            $row = (int) ($item['row'] ?? 0);
            $col = (int) ($item['col'] ?? 0);
            $direction = (string) ($item['direction'] ?? 'h');
            $length = $slotLengths[$slot] ?? 0;

            for ($i = 0; $i < $length; $i++) {
                $r = $direction === 'h' ? $row : $row + $i;
                $c = $direction === 'h' ? $col + $i : $col;
                $key = "{$r}:{$c}";
                $cells[$key][] = ['slot' => $slot, 'index' => $i];
            }
        }

        $constraints = [];
        foreach ($cells as $entries) {
            if (count($entries) < 2) {
                continue;
            }
            for ($i = 0; $i < count($entries); $i++) {
                for ($j = $i + 1; $j < count($entries); $j++) {
                    $a = $entries[$i];
                    $b = $entries[$j];
                    if ($a['slot'] === $b['slot']) {
                        continue;
                    }
                    $constraints[] = [$a['slot'], $a['index'], $b['slot'], $b['index']];
                }
            }
        }

        return $constraints;
    }

    /**
     * @param  array<int, int>  $slotOrder
     * @param  array<int, int>  $slotLengths
     * @param  array<int, array{int, int, int, int}>  $constraints
     * @param  array<int, array<int, string>>  $candidatesByLength
     * @param  array<string, true>  $usedWords
     * @return array<int, string>|null
     */
    private function solveCrossword(
        array $slotOrder,
        array $slotLengths,
        array $constraints,
        array $candidatesByLength,
        array $usedWords,
    ): ?array {
        $slotCount = count($slotLengths);
        /** @var array<int, string|null> $assignment */
        $assignment = array_fill(0, $slotCount, null);

        if ($this->backtrackCrossword($slotOrder, 0, $slotLengths, $constraints, $candidatesByLength, $assignment, $usedWords)) {
            return array_map(static fn (?string $w): string => (string) $w, $assignment);
        }

        return null;
    }

    /**
     * @param  array<int, int>  $slotOrder
     * @param  array<int, int>  $slotLengths
     * @param  array<int, array{int, int, int, int}>  $constraints
     * @param  array<int, array<int, string>>  $candidatesByLength
     * @param  array<int, string|null>  $assignment
     * @param  array<string, true>  $usedWords
     */
    private function backtrackCrossword(
        array $slotOrder,
        int $orderIndex,
        array $slotLengths,
        array $constraints,
        array $candidatesByLength,
        array &$assignment,
        array $usedWords,
    ): bool {
        if ($orderIndex >= count($slotOrder)) {
            return true;
        }

        $slot = $slotOrder[$orderIndex];
        $length = $slotLengths[$slot];
        $candidates = $candidatesByLength[$length] ?? [];

        foreach ($candidates as $candidate) {
            if (isset($usedWords[$candidate])) {
                continue;
            }

            if (in_array($candidate, $assignment, true)) {
                continue;
            }

            $assignment[$slot] = $candidate;

            if (! $this->satisfiesConstraints($assignment, $constraints)) {
                $assignment[$slot] = null;

                continue;
            }

            if ($this->backtrackCrossword($slotOrder, $orderIndex + 1, $slotLengths, $constraints, $candidatesByLength, $assignment, $usedWords)) {
                return true;
            }

            $assignment[$slot] = null;
        }

        return false;
    }

    /**
     * @param  array<int, string|null>  $assignment
     * @param  array<int, array{int, int, int, int}>  $constraints
     */
    private function satisfiesConstraints(array $assignment, array $constraints): bool
    {
        foreach ($constraints as [$slotA, $indexA, $slotB, $indexB]) {
            $wordA = $assignment[$slotA] ?? null;
            $wordB = $assignment[$slotB] ?? null;

            if ($wordA === null || $wordB === null) {
                continue;
            }

            if ($wordA[$indexA] !== $wordB[$indexB]) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<int, array{word: string, length: int, difficulty: string, source_pack: int, rank: int}>  $orderedWords
     * @param  array<string, true>  $blueprintUsed
     * @return array<int, array<int, string>>
     */
    private function buildPoolsByLength(array $orderedWords, array $blueprintUsed): array
    {
        $pools = [];

        foreach ($orderedWords as $entry) {
            $word = $entry['word'];
            if (isset($blueprintUsed[$word])) {
                continue;
            }

            $pools[$entry['length']][] = $word;
        }

        ksort($pools);

        return $pools;
    }

    /**
     * @param  array<int, array{word: string, length: int, difficulty: string, source_pack: int, rank: int}>  $words
     * @param  array<int, array<int, string>>  $levelAssignments
     * @param  array<int, array<int, string>>  $poolsByLength
     */
    public function writeProceduralWordPools(string $path, array $poolsByLength): void
    {
        $lines = [
            '<?php',
            '',
            '/**',
            ' * Christmas Word Quest vocabulary for procedural levels (11+).',
            ' * Generated by `php artisan game:import-christmas-words`. Ordered easy → hard within each length.',
            ' */',
            'return [',
        ];

        foreach ($poolsByLength as $length => $pool) {
            $lines[] = "    {$length} => ".$this->exportShortArray($pool).',';
        }

        $lines[] = '];';
        $lines[] = '';

        file_put_contents($path, implode("\n", $lines));
    }

    /**
     * @param  array<int, array<int, string>>  $levelAssignments
     */
    public function writeGameLevelBlueprints(string $path, array $levelAssignments): void
    {
        $blueprints = config('game_level_blueprints', []);

        $resolver = app(LevelNameResolver::class);

        foreach ($blueprints as $index => &$blueprint) {
            $levelNumber = $index + 1;
            $words = $levelAssignments[$levelNumber] ?? [];
            $blueprint['name'] = $resolver->forLevel($levelNumber);
            $blueprint['words'] = $words;
            $blueprint['grid_words'] = $words;
            $blueprint['letters'] = $this->lettersFromWords($words);
            $blueprint['grid_layout'] = $this->remapGridLayout($blueprint['grid_layout'] ?? [], $words);
        }
        unset($blueprint);

        $content = "<?php\n\n/**\n * Authoritative puzzle blueprints (levels 1–10 mirror the mobile LEVELS array).\n * Procedural levels (11+) reuse this geometry but substitute Christmas words from config/procedural_word_pools.php.\n * Generated by `php artisan game:import-christmas-words`.\n */\nreturn ".$this->exportArray($blueprints, 0).";\n";

        file_put_contents($path, $content);
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    public function writeManifest(string $path, array $manifest): void
    {
        $json = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new RuntimeException('Failed to encode Christmas word manifest.');
        }

        file_put_contents($path, $json."\n");
    }

    /**
     * @param  array<int, string>  $words
     * @return array<int, string>
     */
    public function lettersFromWords(array $words): array
    {
        $maxPerLetter = [];
        foreach ($words as $word) {
            $counts = array_count_values(str_split($word));
            foreach ($counts as $letter => $cnt) {
                $maxPerLetter[$letter] = max($maxPerLetter[$letter] ?? 0, $cnt);
            }
        }
        ksort($maxPerLetter);
        $letters = [];
        foreach ($maxPerLetter as $letter => $cnt) {
            for ($j = 0; $j < $cnt; $j++) {
                $letters[] = $letter;
            }
        }

        return $letters;
    }

    /**
     * @param  array<int, mixed>  $gridLayout
     * @param  array<int, string>  $wordsInOrder
     * @return array<int, array<string, mixed>>
     */
    private function remapGridLayout(array $gridLayout, array $wordsInOrder): array
    {
        $i = 0;

        return array_map(function (mixed $row) use (&$i, $wordsInOrder): array {
            $item = is_array($row) ? $row : [];
            if (isset($item['word'], $wordsInOrder[$i])) {
                $item['word'] = $wordsInOrder[$i];
                $i++;
            }

            return $item;
        }, $gridLayout);
    }

    /**
     * @param  array<int, string>  $values
     */
    private function exportShortArray(array $values): string
    {
        if ($values === []) {
            return '[]';
        }

        $chunks = array_chunk($values, 12);
        $lines = ['['];
        foreach ($chunks as $chunk) {
            $encoded = array_map(static fn (string $w): string => "'".addslashes($w)."'", $chunk);
            $lines[] = '        '.implode(', ', $encoded).',';
        }
        $lines[] = '    ]';

        return implode("\n", $lines);
    }

    /**
     * @param  mixed  $value
     */
    private function exportArray(mixed $value, int $depth): string
    {
        $indent = str_repeat('    ', $depth + 1);

        if (! is_array($value)) {
            return var_export($value, true);
        }

        if ($value === []) {
            return '[]';
        }

        $isList = array_is_list($value);
        $lines = ['['];

        foreach ($value as $key => $item) {
            $keyPart = $isList ? '' : var_export($key, true).' => ';
            if (is_array($item)) {
                $lines[] = $indent.$keyPart.$this->exportArray($item, $depth + 1).',';
            } elseif (is_string($item)) {
                $lines[] = $indent.$keyPart."'".addslashes($item)."',";
            } else {
                $lines[] = $indent.$keyPart.var_export($item, true).',';
            }
        }

        $lines[] = str_repeat('    ', $depth).']';

        return implode("\n", $lines);
    }
}
