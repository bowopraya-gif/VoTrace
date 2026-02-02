<?php

namespace App\Mail;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewDeviceLoginAlert extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $browser,
        public string $platform,
        public string $location,
        public string $ipAddress,
        public Carbon $loginTime,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🔐 New Device Login Detected - VoTrack',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.auth.new-device-login',
            with: [
                'userName' => $this->user->full_name ?? $this->user->username,
                'browser' => $this->browser,
                'platform' => $this->platform,
                'location' => $this->location,
                'ipAddress' => $this->ipAddress,
                'loginTime' => $this->loginTime->format('d M Y, H:i'),
                'secureAccountUrl' => config('app.frontend_url') . '/settings/security',
            ],
        );
    }
}
