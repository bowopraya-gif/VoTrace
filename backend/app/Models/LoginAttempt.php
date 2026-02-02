<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginAttempt extends Model
{
    protected $fillable = [
        'user_id',
        'login_identifier',
        'ip_address',
        'user_agent_raw',
        'device_type',
        'platform',
        'browser',
        'city',
        'country',
        'location',
        'status',
        'attempted_at',
    ];

    protected $casts = [
        'attempted_at' => 'datetime',
    ];

    /**
     * Get the user that made this login attempt.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for successful attempts.
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope for failed attempts.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Get formatted device info for display.
     */
    public function getDeviceInfoAttribute(): string
    {
        return "{$this->browser} on {$this->platform} ({$this->device_type})";
    }

    /**
     * Get formatted location for display.
     */
    public function getLocationInfoAttribute(): string
    {
        return $this->location ?? 'Unknown Location';
    }
}
