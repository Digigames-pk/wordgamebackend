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

        $key = env('AWS_ACCESS_KEY_ID');
        $secret = env('AWS_SECRET_ACCESS_KEY');
        $bucket = env('AWS_BUCKET');
        $region = env('AWS_DEFAULT_REGION', 'us-east-1');
        $endpoint = env('AWS_ENDPOINT');

        if (! $key || ! $secret || ! $bucket) {
            return response()->json(['error' => 'Storage not configured (set AWS_* in .env).'], 500);
        }

        $isVideo = str_starts_with($data['contentType'], 'video/');
        $isAudio = str_starts_with($data['contentType'], 'audio/');
        $folder = $isVideo ? 'ad-videos' : ($isAudio ? 'ad-audio' : 'ad-images');
        $safe = preg_replace('/[^a-zA-Z0-9.-]/', '_', $data['filename']);
        $objectKey = $folder.'/global/'.time().'-'.$safe;

        $s3Config = [
            'version' => 'latest',
            'region' => $region,
            'credentials' => [
                'key' => $key,
                'secret' => $secret,
            ],
        ];
        if ($endpoint) {
            $s3Config['endpoint'] = $endpoint;
            $s3Config['use_path_style_endpoint'] = (bool) env('AWS_USE_PATH_STYLE_ENDPOINT', true);
        }

        $client = new S3Client($s3Config);
        $cmd = $client->getCommand('PutObject', [
            'Bucket' => $bucket,
            'Key' => $objectKey,
            'ContentType' => $data['contentType'],
            'ACL' => 'public-read',
        ]);

        $req = $client->createPresignedRequest($cmd, '+1 hour');
        $uploadUrl = (string) $req->getUri();

        $publicBase = $endpoint
            ? rtrim((string) $endpoint, '/').'/'.$bucket
            : 'https://'.$bucket.'.s3.'.$region.'.amazonaws.com';

        $publicUrl = $publicBase.'/'.$objectKey;

        return response()->json([
            'uploadUrl' => $uploadUrl,
            'publicUrl' => $publicUrl,
            'key' => $objectKey,
        ]);
    }
}
