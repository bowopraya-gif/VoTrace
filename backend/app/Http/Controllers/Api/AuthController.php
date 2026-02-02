<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Events\UserLoggedIn;
use App\Mail\OTPVerification;
use App\Models\User;
use App\Services\LoginAttemptService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private LoginAttemptService $loginAttemptService
    ) {}

    public function register(Request $request)
    {
        $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'min:3', 'max:20', 'unique:users', 'regex:/^[a-zA-Z0-9_]+$/'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
            'date_of_birth' => ['required', 'date', 'before:-13 years'],
            'password' => [
                'required',
                'confirmed',
                Password::min(12)
                    ->mixedCase()       // Uppercase + lowercase
                    ->numbers()         // At least one number
                    ->symbols()         // At least one special character
                    ->uncompromised(),  // Check against breached passwords
            ],
        ], [
            'username.regex' => 'The username may only contain letters, numbers, and underscores.',
            'date_of_birth.before' => 'You must be at least 13 years old to register.',
            'password.min' => 'Password must be at least 12 characters.',
        ]);

        $otp = rand(100000, 999999);

        $user = User::create([
            'full_name' => $request->full_name,
            'username' => $request->username,
            'email' => $request->email,
            'date_of_birth' => $request->date_of_birth,
            'password' => Hash::make($request->password),
            'verification_code' => $otp,
            'verification_code_expires_at' => now()->addMinutes(60),
        ]);

        // Send OTP Email
        try {
            Mail::to($user->email)->send(new OTPVerification($user, $otp));
        } catch (\Exception $e) {
            Log::error('OTP Mail Failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Registration successful. Please verify your email.',
            'email' => $user->email,
        ]);
    }

    /**
     * Handle login request with built-in rate limiting via LoginRequest.
     */
    public function login(LoginRequest $request)
    {
        // 1. Authenticate (rate limiting handled by LoginRequest)
        $request->authenticate();

        $user = Auth::user();

        // 2. Check email verification
        if (!$user->email_verified_at) {
            Auth::logout();
            return response()->json([
                'message' => 'Email not verified.',
                'requires_verification' => true,
                'email' => $user->email
            ], 403);
        }

        // 3. Regenerate session (prevent session fixation)
        $request->session()->regenerate();

        // 4. Create token with appropriate expiration
        // Remember me logic: 30 days vs 1 day
        $tokenExpiration = $request->boolean('remember') 
            ? now()->addDays(30)
            : now()->addDay();

        $token = $user->createToken('auth_token', ['*'], $tokenExpiration)->plainTextToken;

        // 5. Log successful attempt & dispatch event for device notification
        try {
            $this->loginAttemptService->logSuccess($request, $user);
            event(new UserLoggedIn($user, $request->ip(), $request->userAgent()));
        } catch (\Exception $e) {
            Log::warning('Login logging failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if ($user->verification_code !== $request->otp) {
            return response()->json(['message' => 'Invalid OTP.'], 400);
        }

        if ($user->verification_code_expires_at && now()->gt($user->verification_code_expires_at)) {
            return response()->json(['message' => 'OTP has expired.'], 400);
        }

        $user->email_verified_at = now();
        $user->verification_code = null;
        $user->verification_code_expires_at = null;
        $user->save();

        // Auto login after verification
        Auth::login($user);
        $request->session()->regenerate();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Log this login too
        try {
            $this->loginAttemptService->logSuccess($request, $user);
            event(new UserLoggedIn($user, $request->ip(), $request->userAgent()));
        } catch (\Exception $e) {}

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => $user,
            'token' => $token,
        ]);
    }
    
    public function resendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        
        $user = User::where('email', $request->email)->first();
        
        if (!$user) return response()->json(['message' => 'User not found'], 404);
        if ($user->email_verified_at) return response()->json(['message' => 'Already verified'], 400);
        
        $otp = rand(100000, 999999);
        $user->verification_code = $otp;
        $user->verification_code_expires_at = now()->addMinutes(60);
        $user->save();
        
        try {
            Mail::to($user->email)->send(new OTPVerification($user, $otp));
        } catch (\Exception $e) { }
        
        return response()->json(['message' => 'OTP resent successfully']);
    }

    public function checkUsername(Request $request)
    {
        $request->validate(['username' => 'required|string|min:3']);
        $exists = User::where('username', $request->username)->exists();
        return response()->json(['available' => !$exists]);
    }

    public function checkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $exists = User::where('email', $request->email)->exists();
        return response()->json(['available' => !$exists]);
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            
            // 1. Revoke access tokens (API/Mobile)
            if ($user && $user->currentAccessToken() instanceof \Laravel\Sanctum\PersonalAccessToken) {
                $user->currentAccessToken()->delete();
            }

            // 2. Web Guard Logout (Clears Remember Me & Session)
            // We call this unconditionally to ensure any web session is killed
            Auth::guard('web')->logout();

            // 3. Flush & Invalidate Session
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            // 4. Return response with cookie clearing instructions
            // We explicitly clear the session cookie and XSRF token
            $cookieName = config('session.cookie');
            
            return response()
                ->json(['message' => 'Logged out successfully.'])
                ->withCookie(cookie()->forget($cookieName))
                ->withCookie(cookie()->forget('XSRF-TOKEN'));
                
        } catch (\Exception $e) {
            Log::error('Logout failed: ' . $e->getMessage());
            
            return response()
                ->json(['message' => 'Logged out with errors.'])
                ->withCookie(cookie()->forget(config('session.cookie')))
                ->withCookie(cookie()->forget('XSRF-TOKEN'));
        }
    }

    public function logoutAll(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user) {
                // Revoke all tokens
                $user->tokens()->delete();
            }
            
            if (Auth::guard('web')->check()) {
                Auth::guard('web')->logout();
            }
            
            if ($request->hasSession()) {
                $request->session()->flush();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
            
            return response()
                ->json(['message' => 'Logged out from all devices successfully.'])
                ->withCookie(cookie()->forget(config('session.cookie')))
                ->withCookie(cookie()->forget('XSRF-TOKEN'));
                
        } catch (\Exception $e) {
            Log::error('Logout all failed: ' . $e->getMessage());
            return response()
                ->json(['message' => 'Logged out from all devices with errors.'])
                ->withCookie(cookie()->forget(config('session.cookie')))
                ->withCookie(cookie()->forget('XSRF-TOKEN'));
        }
    }

    public function user(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'id' => $user->id,
            'full_name' => $user->full_name,
            'username' => $user->username,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url 
                ? \Illuminate\Support\Facades\Storage::disk('public')->url($user->avatar_url) 
                : null,
            'date_of_birth' => $user->date_of_birth,
            'english_level' => $user->english_level,
            'account_status' => $user->account_status,
            'role' => $user->role,
            'email_verified_at' => $user->email_verified_at,
        ]);
    }
}
