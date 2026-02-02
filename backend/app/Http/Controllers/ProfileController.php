<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * Get current user's profile
     */
    public function show(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'id' => $user->id,
            'full_name' => $user->full_name,
            'username' => $user->username,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url ? Storage::disk('public')->url($user->avatar_url) : null,
            'date_of_birth' => $user->date_of_birth,
            'english_level' => $user->english_level ?? 'beginner',
            'account_status' => $user->account_status ?? 'active',
            'created_at' => $user->created_at,
        ]);
    }

    /**
     * Update profile (batch update)
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'full_name' => 'sometimes|string|min:2|max:50',
            'username' => [
                'sometimes',
                'string',
                'min:3',
                'max:30',
                'alpha_dash',
                Rule::unique('users')->ignore($user->id),
            ],
            'date_of_birth' => 'sometimes|nullable|date|before_or_equal:today',
            'english_level' => 'sometimes|in:A1,A2,B1,B2,C1,C2',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $this->show($request)->original,
        ]);
    }

    /**
     * Upload avatar image
     * - Max 2MB, JPG/PNG
     * - Resize to 300x300 using native PHP GD
     * - Convert to WebP
     * - Delete old avatar
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|max:2048|mimes:jpg,jpeg,png',
        ]);

        $user = $request->user();
        $file = $request->file('avatar');

        // Delete old avatar if exists
        if ($user->avatar_url && Storage::disk('public')->exists($user->avatar_url)) {
            Storage::disk('public')->delete($user->avatar_url);
        }

        // Load image using GD
        $mime = $file->getMimeType();
        $sourcePath = $file->getPathname();
        
        switch ($mime) {
            case 'image/jpeg':
                $source = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $source = imagecreatefrompng($sourcePath);
                break;
            default:
                return response()->json(['error' => 'Unsupported image type'], 422);
        }

        // Get original dimensions
        $origWidth = imagesx($source);
        $origHeight = imagesy($source);

        // Calculate crop dimensions (center crop for square)
        $size = min($origWidth, $origHeight);
        $srcX = ($origWidth - $size) / 2;
        $srcY = ($origHeight - $size) / 2;

        // Create 300x300 thumbnail
        $thumb = imagecreatetruecolor(300, 300);
        
        // Preserve transparency for PNG
        imagealphablending($thumb, false);
        imagesavealpha($thumb, true);
        
        // Resize with resampling
        imagecopyresampled($thumb, $source, 0, 0, (int)$srcX, (int)$srcY, 300, 300, $size, $size);

        // Save as WebP to temp file
        $tempPath = sys_get_temp_dir() . '/' . Str::uuid() . '.webp';
        imagewebp($thumb, $tempPath, 90);

        // Clean up GD resources
        imagedestroy($source);
        imagedestroy($thumb);

        // Store file
        $filename = 'avatars/' . Str::uuid() . '.webp';
        Storage::disk('public')->put($filename, file_get_contents($tempPath));
        
        // Delete temp file
        unlink($tempPath);

        // Update user
        $user->update(['avatar_url' => $filename]);

        return response()->json([
            'message' => 'Avatar uploaded successfully',
            'avatar_url' => Storage::url($filename),
        ]);
    }

    /**
     * Change password (requires current password)
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|current_password',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Check username availability (for real-time validation)
     */
    public function checkUsername(Request $request)
    {
        $request->validate([
            'username' => 'required|string|min:3|max:30|alpha_dash',
        ]);

        $exists = \App\Models\User::where('username', $request->username)
            ->where('id', '!=', $request->user()->id)
            ->exists();

        return response()->json([
            'available' => !$exists,
            'username' => $request->username,
        ]);
    }

    /**
     * Request email change (send verification to new email)
     */
    public function requestEmailChange(Request $request)
    {
        $request->validate([
            'new_email' => 'required|email|unique:users,email',
        ]);

        // TODO: Generate verification token
        // TODO: Send email with verification link
        // For now, return placeholder response

        return response()->json([
            'message' => 'Verification email sent to ' . $request->new_email,
            'note' => 'Please check your new email inbox and click the verification link.',
        ]);
    }
}
