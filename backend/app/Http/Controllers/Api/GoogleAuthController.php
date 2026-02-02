<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\UserLoggedIn;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth
     */
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle Google callback with Authorization Code
     */
    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            Log::error('Google OAuth failed: ' . $e->getMessage());
            return redirect(config('app.frontend_url') . '/login?error=google_auth_failed');
        }

        // Find existing user by google_id OR email
        $user = User::where('google_id', $googleUser->getId())
                    ->orWhere('email', $googleUser->getEmail())
                    ->first();

        if (!$user) {
            // Create new user with auto-generated username
            $user = User::create([
                'full_name' => $googleUser->getName(),
                'username' => $this->generateUniqueUsername($googleUser->getName()),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'avatar' => $this->downloadAndStoreAvatar($googleUser->getAvatar()),
                'email_verified_at' => now(), // Google emails are verified
                'password' => null, // OAuth user, no password yet
                'date_of_birth' => null, // Not provided by Google
            ]);
        } else {
            // Link Google ID if not already linked
            if (!$user->google_id) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                ]);
            }
            
            // Update avatar if user doesn't have one
            if (!$user->avatar) {
                $user->update([
                    'avatar' => $this->downloadAndStoreAvatar($googleUser->getAvatar()),
                ]);
            }
            
            // Mark email as verified if not already
            if (!$user->email_verified_at) {
                $user->update(['email_verified_at' => now()]);
            }
        }

        // Login user with web guard (Sanctum session-based)
        Auth::login($user);

        // Fire event for device tracking / new device notification
        event(new UserLoggedIn($user, $request->ip(), $request->userAgent()));

        // Redirect to frontend success page
        return redirect(config('app.frontend_url') . '/auth/google/success');
    }

    /**
     * Auto-generate unique username from full name
     * Logic: firstName + random numbers, check uniqueness
     */
    private function generateUniqueUsername(string $fullName): string
    {
        // Extract first name and clean it
        $firstName = Str::before($fullName, ' ');
        $baseName = Str::slug($firstName, '');
        $baseName = preg_replace('/[^a-z0-9_]/', '', strtolower($baseName));
        $baseName = $baseName ?: 'user';
        
        // Limit base name length
        $baseName = substr($baseName, 0, 15);

        // Generate username with random suffix
        $username = $baseName . rand(100, 999);
        
        // Keep trying until unique
        $attempts = 0;
        while (User::where('username', $username)->exists() && $attempts < 100) {
            $username = $baseName . rand(100, 9999);
            $attempts++;
        }
        
        // Fallback if still not unique (very unlikely)
        if (User::where('username', $username)->exists()) {
            $username = $baseName . '_' . Str::random(6);
        }
        
        return $username;
    }

    /**
     * Download avatar from Google and store locally
     * Returns local path or null on failure
     */
    private function downloadAndStoreAvatar(?string $url): ?string
    {
        if (!$url) return null;
        
        try {
            // Get larger avatar (Google default is small)
            $url = preg_replace('/=s\d+-c/', '=s200-c', $url);
            
            $contents = file_get_contents($url);
            if (!$contents) return null;
            
            $filename = 'avatars/' . Str::uuid() . '.jpg';
            Storage::disk('public')->put($filename, $contents);
            
            return $filename;
        } catch (\Exception $e) {
            Log::warning('Failed to download Google avatar: ' . $e->getMessage());
            return null;
        }
    }
}
