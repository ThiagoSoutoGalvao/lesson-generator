<?php

namespace App\Support;

/**
 * Normalises what a person types (or pastes) into an email / password field.
 *
 * Laravel's TrimStrings never touches password fields, so a space — or a
 * non-breaking / zero-width character that came along with a paste from a chat
 * app — used to be hashed into the password itself. The student then typed the
 * password without it and got "credentials don't match".
 */
class Credentials
{
    /** Whitespace, every Unicode space separator (incl. NBSP), and zero-width characters. */
    private const EDGE = '/^[\s\p{Z}\x{200B}-\x{200D}\x{2060}\x{FEFF}]+|[\s\p{Z}\x{200B}-\x{200D}\x{2060}\x{FEFF}]+$/u';

    public static function password(?string $value): string
    {
        $value = (string) $value;

        return preg_replace(self::EDGE, '', $value) ?? $value;
    }

    public static function email(?string $value): string
    {
        return mb_strtolower(self::password($value));
    }
}
