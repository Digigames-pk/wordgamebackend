<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Aws\S3\S3Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdUploadController extends Controller
{
    public function presigned(Request $request): JsonResponse
    {
        $data = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
            'contentType' => ['required', 'string', 'max:255'],
        ]);

        $resolved = $this->resolveAdUploadDisk();
        if ($resolved === null) {
            return response()->json([
                'error' => 'Storage not configured. Set WAS_* (Wasabi) or AWS_* (S3) in .env.',
            ], 500);
        }

        ['config' => $disk, 'publicBase' => $publicBase] = $resolved;

        $isVideo = str_starts_with($data['contentType'], 'video/');
        $isAudio = str_starts_with($data['contentType'], 'audio/');
        $folder = $isVideo ? 'ad-videos' : ($isAudio ? 'ad-audio' : 'ad-images');
        $safe = preg_replace('/[^a-zA-Z0-9.-]/', '_', $data['filename']);
        $objectKey = $folder.'/global/'.time().'-'.$safe;

        $s3Config = [
            'version' => 'latest',
            'region' => $disk['region'],
            'credentials' => [
                'key' => $disk['key'],
                'secret' => $disk['secret'],
            ],
        ];
        if (! empty($disk['endpoint'])) {
            $s3Config['endpoint'] = $disk['endpoint'];
            $s3Config['use_path_style_endpoint'] = (bool) ($disk['use_path_style_endpoint'] ?? false);
        }

        $client = new S3Client($s3Config);
        // public-read so the returned publicUrl works anonymously in browsers / mobile players
        $cmd = $client->getCommand('PutObject', [
            'Bucket' => $disk['bucket'],
            'Key' => $objectKey,
            'ContentType' => $data['contentType'],
            'ACL' => 'public-read',
        ]);

        $req = $client->createPresignedRequest($cmd, '+1 hour');
        $uploadUrl = (string) $req->getUri();

        $publicUrl = rtrim((string) $publicBase, '/').'/'.$objectKey;

        return response()->json([
            'uploadUrl' => $uploadUrl,
            'publicUrl' => $publicUrl,
            'key' => $objectKey,
            'maxUploadBytes' => 209_715_200,
        ]);
    }

    /**
     * Prefer Wasabi when configured; otherwise AWS S3-compatible config.
     *
     * @return array{config: array<string, mixed>, publicBase: string}|null
     */
    protected function resolveAdUploadDisk(): ?array
    {
        $wasabi = config('filesystems.disks.wasabi');
        if ($this->diskIsConfigured($wasabi)) {
            $publicBase = filled($wasabi['url'] ?? null)
                ? (string) $wasabi['url']
                : $this->defaultWasabiPublicBase($wasabi);

            return ['config' => $wasabi, 'publicBase' => $publicBase];
        }

        $s3 = config('filesystems.disks.s3');
        if ($this->diskIsConfigured($s3)) {
            $endpoint = $s3['endpoint'] ?? null;
            $region = $s3['region'] ?? 'us-east-1';
            $bucket = $s3['bucket'];
            $publicBase = $s3['url'] ?? ($endpoint
                ? rtrim((string) $endpoint, '/').'/'.$bucket
                : 'https://'.$bucket.'.s3.'.$region.'.amazonaws.com');

            return ['config' => $s3, 'publicBase' => $publicBase];
        }

        return null;
    }

    /**
     * @param  array<string, mixed>|null  $disk
     */
    protected function diskIsConfigured(?array $disk): bool
    {
        if ($disk === null) {
            return false;
        }

        return filled($disk['bucket'] ?? null)
            && filled($disk['key'] ?? null)
            && filled($disk['secret'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $wasabi
     */
    protected function defaultWasabiPublicBase(array $wasabi): string
    {
        $bucket = $wasabi['bucket'];
        $region = $wasabi['region'] ?? 'us-east-1';

        return 'https://'.$bucket.'.s3.'.$region.'.wasabisys.com';
    }
}
