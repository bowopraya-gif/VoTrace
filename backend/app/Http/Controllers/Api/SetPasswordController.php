<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SetPasswordController extends Controller
{
    /**
     * Allow OAuth users to set a password for hybrid login
     */
    public function setPassword(Request $request)
    {
        $user = $request->user();

        // Only allow if user has no password (OAuth user)
        if ($user->password !== null) {
            return response()->json([
                'message' => 'You already have a password set. Please use the change password feature instead.',
            ], 400);
        }

        $request->validate([
            'password' => [
                'required',
                'confirmed',
                Password::min(12)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ], [
            'password.min' => 'Password must be at least 12 characters.',
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password set successfully. You can now login with email and password.',
        ]);
    }

    /**
     * Check if user needs to set a password (OAuth user without password)
     */
    public function checkPasswordStatus(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'has_password' => $user->password !== null,
            'has_google' => $user->google_id !== null,
        ]);
    }
}
