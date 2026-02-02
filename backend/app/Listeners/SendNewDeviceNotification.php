<?php

namespace App\Listeners;

use App\Events\UserLoggedIn;
use App\Mail\NewDeviceLoginAlert;
use App\Services\LoginAttemptService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Jenssegers\Agent\Agent;
use Stevebauman\Location\Facades\Location;

class SendNewDeviceNotification implements ShouldQueue
{
    public function __construct(
        private LoginAttemptService $loginAttemptService
    ) {}

    public function handle(UserLoggedIn $event): void
    {
        $user = $event->user;
        $ipAddress = $event->ipAddress;
        $userAgent = $event->userAgent;

        Log::info('SendNewDeviceNotification: Processing login', [
            'user_id' => $user->id,
            'ip' => $ipAddress,
            'user_agent' => substr($userAgent, 0, 50) . '...'
        ]);

        // Check if this is a new device
        if ($this->loginAttemptService->isNewDeviceByData($user, $ipAddress, $userAgent)) {
            Log::info('SendNewDeviceNotification: NEW DEVICE DETECTED!', [
                'user_id' => $user->id,
            ]);

            // Parse device info
            $agent = new Agent();
            $agent->setUserAgent($userAgent);

            $browser = $agent->browser();
            $browserVersion = $agent->version($browser);
            $platform = $agent->platform();
            $platformVersion = $agent->version($platform);

            // Get location
            $locationLabel = 'Unknown Location';
            try {
                $position = Location::get($ipAddress);
                if ($position) {
                    $locationLabel = $position->cityName && $position->countryName 
                        ? "{$position->cityName}, {$position->countryName}"
                        : ($position->countryName ?? 'Unknown Location');
                }
            } catch (\Exception $e) {
                Log::warning('Location lookup failed', ['error' => $e->getMessage()]);
            }

            // Send email notification
            try {
                Mail::to($user->email)->send(new NewDeviceLoginAlert(
                    user: $user,
                    browser: $browserVersion ? "{$browser} {$browserVersion}" : $browser,
                    platform: $platformVersion ? "{$platform} {$platformVersion}" : $platform,
                    location: $locationLabel,
                    ipAddress: $ipAddress,
                    loginTime: now(),
                ));
                
                Log::info('SendNewDeviceNotification: Email sent successfully', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            } catch (\Exception $e) {
                Log::error('SendNewDeviceNotification: Email failed', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
        } else {
            Log::info('SendNewDeviceNotification: Known device, no email sent', [
                'user_id' => $user->id,
            ]);
        }
    }
}
