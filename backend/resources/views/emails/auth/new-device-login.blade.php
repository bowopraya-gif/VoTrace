@component('mail::message')
# New Device Login Detected

Hi {{ $userName }},

We detected a successful login to your VoTrack account from a new device.

**Login Details:**
- **Time:** {{ $loginTime }}
- **Browser:** {{ $browser }}
- **Operating System:** {{ $platform }}
- **Location:** {{ $location }}
- **IP Address:** {{ $ipAddress }}

@component('mail::panel')
**If this was you**, you can ignore this email.

**If this wasn't you**, your account may be compromised. Please secure your account immediately.
@endcomponent

@component('mail::button', ['url' => $secureAccountUrl, 'color' => 'red'])
Secure My Account
@endcomponent

Stay safe,<br>
{{ config('app.name') }} Security Team

@component('mail::subcopy')
This is an automated security alert. You're receiving this because you have a VoTrack account associated with this email address.
@endcomponent
@endcomponent
