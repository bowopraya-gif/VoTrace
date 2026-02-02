<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines are used during authentication for various
    | messages that we need to display to the user. You are free to modify
    | these language lines according to your application's requirements.
    |
    */

    // Login - Case Specific
    'email_not_found' => 'No account found with this email address.',
    'username_not_found' => 'No account found with this username.',
    'password_incorrect' => 'Incorrect password. Please try again.',
    
    // Rate Limiting
    'throttle' => 'Too many login attempts. Please wait :seconds seconds before trying again.',

    // Registration
    'email_taken' => 'This email address is already registered.',
    'username_taken' => 'This username is already taken.',
    
    // Verification
    'email_not_verified' => 'Please verify your email address before logging in.',
    'otp_invalid' => 'The verification code you entered is incorrect.',
    'otp_expired' => 'The verification code has expired. Please request a new one.',
    
    // Password Reset
    'password_reset_sent' => 'We have sent a password reset link to your email.',
    'password_reset_failed' => 'Unable to send password reset link. Please try again.',
    'password_reset_invalid_token' => 'This password reset link is invalid or has expired.',
    'password_reset_success' => 'Your password has been successfully reset.',
    
    // General (fallback)
    'failed' => 'Incorrect email/username or password. Please try again.',
    'password' => 'The password you entered is incorrect.',

];
