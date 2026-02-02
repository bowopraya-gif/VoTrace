<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Progressive lockout durations in seconds.
     * 1st: 1 min, 2nd: 2 min, 3rd: 5 min, 4th: 15 min, 5th+: 30 min
     */
    private const LOCKOUT_DURATIONS = [60, 120, 300, 900, 1800];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // Determine login type (email or username)
        $loginType = filter_var($this->input('login'), FILTER_VALIDATE_EMAIL) 
            ? 'email' 
            : 'username';

        // 1. Check if user exists
        $user = User::where($loginType, $this->input('login'))->first();

        if (!$user) {
            $this->handleFailedAttempt();
            
            // Specific message for user not found
            $message = $loginType === 'email' 
                ? trans('auth.email_not_found')
                : trans('auth.username_not_found');
            
            throw ValidationException::withMessages([
                'login' => $message,
            ]);
        }

        // 2. Check if password matches
        if (!Hash::check($this->input('password'), $user->password)) {
            $this->handleFailedAttempt();
            
            throw ValidationException::withMessages([
                'password' => trans('auth.password_incorrect'),
            ]);
        }

        // 3. Actually login the user
        Auth::login($user, $this->boolean('remember'));

        // Success - clear rate limiter and reset lockout count
        RateLimiter::clear($this->throttleKey());
        $this->resetLockoutCount();
    }

    /**
     * Handle failed login attempt - hit rate limiter and log.
     */
    private function handleFailedAttempt(): void
    {
        $lockoutCount = $this->getLockoutCount();
        $decaySeconds = $this->getDecaySeconds($lockoutCount);
        
        RateLimiter::hit($this->throttleKey(), $decaySeconds);
        
        Log::info('Login Failed. Rate Limit Hit.', [
            'key' => $this->throttleKey(),
            'attempts' => RateLimiter::attempts($this->throttleKey()),
            'lockout_count' => $lockoutCount,
            'decay_seconds' => $decaySeconds,
            'ip' => $this->ip()
        ]);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        $key = $this->throttleKey();
        $attempts = RateLimiter::attempts($key);
        
        Log::info('Checking Rate Limit', ['key' => $key, 'attempts' => $attempts]);

        if (!RateLimiter::tooManyAttempts($key, 5)) {
            return;
        }

        // Increment lockout count for progressive lockout
        $this->incrementLockoutCount();
        
        Log::warning('Rate Limit Exceeded - Lockout Applied', [
            'key' => $key,
            'lockout_count' => $this->getLockoutCount()
        ]);

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($key);

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('login')) . '|' . $this->ip());
    }

    /**
     * Get the lockout count cache key.
     */
    private function lockoutCountKey(): string
    {
        return 'lockout_count:' . $this->throttleKey();
    }

    /**
     * Get current lockout count.
     */
    private function getLockoutCount(): int
    {
        return (int) Cache::get($this->lockoutCountKey(), 0);
    }

    /**
     * Increment lockout count.
     */
    private function incrementLockoutCount(): void
    {
        $key = $this->lockoutCountKey();
        $count = $this->getLockoutCount() + 1;
        Cache::put($key, $count, now()->addHours(24));
    }

    /**
     * Reset lockout count after successful login.
     */
    private function resetLockoutCount(): void
    {
        Cache::forget($this->lockoutCountKey());
    }

    /**
     * Get decay seconds based on lockout count (progressive).
     */
    private function getDecaySeconds(int $lockoutCount): int
    {
        $index = min($lockoutCount, count(self::LOCKOUT_DURATIONS) - 1);
        return self::LOCKOUT_DURATIONS[$index];
    }
}
