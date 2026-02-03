<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0A56C8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background-color: #0A56C8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
        .link { color: #0A56C8; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hello {{ $userName }},</p>
            <p>We received a request to reset your password for your VoTrace account.</p>
            
            <div style="text-align: center;">
                <a href="{{ $resetUrl }}" class="button">Reset Password</a>
            </div>
            
            <p>This link will expire in <strong>{{ $expiresIn }}</strong>.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

            <h3>Security Tips:</h3>
            <ul>
                <li>Never share your password with anyone</li>
                <li>Use a unique password for each account</li>
                <li>Enable two-factor authentication when available</li>
            </ul>

            <p style="margin-top: 30px; font-size: 13px;">
                If the button above doesn't work, copy and paste this URL into your browser:<br>
                <a href="{{ $resetUrl }}" class="link">{{ $resetUrl }}</a>
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} VoTrace. All rights reserved.
        </div>
    </div>
</body>
</html>
