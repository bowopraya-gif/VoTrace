<?php

namespace App\Services;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;
use Stevebauman\Location\Facades\Location;

class LoginAttemptService
{
    /**
     * Log a successful login attempt.
     */
    public function logSuccess(Request $request, User $user): LoginAttempt
    {
        return $this->log($request, 'success', $user);
    }

    /**
     * Log a failed login attempt.
     */
    public function logFailed(Request $request, ?string $loginIdentifier = null): LoginAttempt
    {
        return $this->log($request, 'failed', null, $loginIdentifier);
    }

    /**
     * Log a locked login attempt.
     */
    public function logLocked(Request $request, ?string $loginIdentifier = null): LoginAttempt
    {
        return $this->log($request, 'locked', null, $loginIdentifier);
    }

    /**
     * Core logging logic with device and location parsing.
     */
    private function log(
        Request $request, 
        string $status, 
        ?User $user = null, 
        ?string $loginIdentifier = null
    ): LoginAttempt {
        // Parse User Agent
        $agent = new Agent();
        $agent->setUserAgent($request->userAgent());

        // Get Device Type
        $deviceType = match (true) {
            $agent->isMobile() => 'Mobile',
            $agent->isTablet() => 'Tablet',
            $agent->isDesktop() => 'Desktop',
            default => 'Unknown',
        };

        // Get Platform (OS)
        $platform = $agent->platform();
        $platformVersion = $agent->version($platform);
        $platformFull = $platformVersion ? "{$platform} {$platformVersion}" : $platform;

        // Get Browser
        $browser = $agent->browser();
        $browserVersion = $agent->version($browser);
        $browserFull = $browserVersion ? "{$browser} {$browserVersion}" : $browser;

        // Get Location from IP
        // Note: Location might return false if IP is private (localhost)
        $locationLabel = 'Unknown';
        $city = null;
        $country = null;

        try {
            $ip = $request->ip();
            // Stevebauman Location
            if ($position = Location::get($ip)) {
                $city = $position->cityName;
                $country = $position->countryName;
                $locationLabel = ($city && $country) ? "{$city}, {$country}" : ($country ?? 'Unknown');
            }
        } catch (\Exception $e) {
            // Fallback
        }

        return LoginAttempt::create([
            'user_id' => $user?->id,
            'login_identifier' => $loginIdentifier ?? $request->input('login'),
            'ip_address' => $request->ip(),
            'user_agent_raw' => $request->userAgent(),
            'device_type' => $deviceType,
            'platform' => $platformFull,
            'browser' => $browserFull,
            'city' => $city,
            'country' => $country,
            'location' => $locationLabel,
            'status' => $status,
            'attempted_at' => now(),
        ]);
    }

    /**
     * Check if this is a new device for the user.
     */
    public function isNewDevice(User $user, Request $request): bool
    {
        return $this->isNewDeviceByData($user, $request->ip(), $request->userAgent());
    }

    /**
     * Check if this is a new device using raw data (for queued jobs).
     * Production logic: Checks IP + Browser + Platform combination.
     */
    public function isNewDeviceByData(User $user, string $ipAddress, string $userAgent): bool
    {
        $agent = new Agent();
        $agent->setUserAgent($userAgent);
        
        $browser = $agent->browser();
        $platform = $agent->platform();

        // Check if this IP + Browser + Platform combination has been used before
        $exists = LoginAttempt::where('user_id', $user->id)
            ->where('status', 'success')
            ->where('ip_address', $ipAddress)
            ->where('browser', 'like', "{$browser}%")
            ->where('platform', 'like', "{$platform}%")
            ->exists();

        \Illuminate\Support\Facades\Log::info('isNewDeviceByData check', [
            'user_id' => $user->id,
            'ip' => $ipAddress,
            'browser' => $browser,
            'platform' => $platform,
            'exists' => $exists,
            'is_new' => !$exists
        ]);

        return !$exists;
    }

    /**
     * Get recent successful logins for a user.
     */
    public function getRecentLogins(User $user, int $limit = 10)
    {
        return LoginAttempt::where('user_id', $user->id)
            ->where('status', 'success')
            ->orderBy('attempted_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
