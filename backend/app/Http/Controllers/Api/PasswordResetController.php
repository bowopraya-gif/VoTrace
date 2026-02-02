<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PasswordResetController extends Controller
{
    /**
     * Send password reset link to email.
     * Rate limited: 3 attempts per minute per email.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower($request->email);
        $throttleKey = 'password-reset:' . $email;

        // Rate limiting: 3 attempts per 5 minutes
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => "Too many reset attempts. Please wait {$seconds} seconds.",
            ], 429);
        }

        RateLimiter::hit($throttleKey, 300); // 5 minute decay

        // Find user - return error if not found
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'No account found with this email address.',
            ], 404);
        }

        // Generate secure token
        $token = Str::random(64);

        // Delete any existing tokens for this user
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Store new token (hashed)
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Build reset URL
        $resetUrl = config('app.frontend_url') . '/reset-password?' . http_build_query([
            'token' => $token,
            'email' => $email,
        ]);

        // Send email
        try {
            Mail::to($user->email)->send(new PasswordResetMail($user, $resetUrl));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Password reset email failed: ' . $e->getMessage());
            return response()->json([
                'message' => trans('auth.password_reset_failed'),
            ], 500);
        }

        return response()->json([
            'message' => trans('auth.password_reset_sent'),
        ]);
    }

    /**
     * Reset password using token.
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(12)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        $email = strtolower($request->email);

        // Find token record
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (!$record) {
            return response()->json([
                'message' => trans('auth.password_reset_invalid_token'),
            ], 400);
        }

        // Check if token matches
        if (!Hash::check($request->token, $record->token)) {
            return response()->json([
                'message' => trans('auth.password_reset_invalid_token'),
            ], 400);
        }

        // Check if token is expired (1 hour)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'message' => 'This password reset link has expired. Please request a new one.',
            ], 400);
        }

        // Find user
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the used token
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Revoke all existing tokens (force re-login on all devices)
        $user->tokens()->delete();

        return response()->json([
            'message' => trans('auth.password_reset_success'),
        ]);
    }
}
