<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ContactMessageAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'messages' => ContactMessage::query()
                ->with('user:id,name,email')
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = ContactMessage::query()->findOrFail($id);

        $data = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['new', 'read', 'archived'])],
        ]);

        $row->update($data);

        return response()->json(['message' => $row->fresh()->load('user:id,name,email')]);
    }

    public function destroy(string $id): JsonResponse
    {
        ContactMessage::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }
}
