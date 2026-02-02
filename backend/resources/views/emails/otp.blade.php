<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0A56C8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .code { font-size: 32px; font-weight: bold; color: #0A56C8; letter-spacing: 5px; text-align: center; margin: 20px 0; background: #fff; padding: 15px; border-radius: 4px; border: 1px dashed #0A56C8; }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VoTrack Verification</h1>
        </div>
        <div class="content">
            <p>Hello {{ $user->full_name }},</p>
            <p>Thank you for registering with VoTrack. Please use the following One-Time Password (OTP) to verify your email address:</p>
            
            <div class="code">{{ $otp }}</div>
            
            <p>This code will expire in 60 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} VoTrack. All rights reserved.
        </div>
    </div>
</body>
</html>
