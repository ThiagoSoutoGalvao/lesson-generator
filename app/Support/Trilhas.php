<?php

namespace App\Support;

/**
 * The courses ("trilhas") the app knows, as stored in `activities.trilha`, `users.trilha` and
 * `trilha_lesson_briefs.trilha`. The one server-side list — keep it in step with `TRILHAS` in
 * resources/js/lib/trilhas.js (labels, lesson counts and tables of contents live there).
 *
 * Lights / Glow / Radiant are Aurora's general courses; FirstSteps / EverydayBusiness / TakeTheLead
 * are the three Aurora Business modules (AuroraBusiness.md, 2026-11-10).
 */
final class Trilhas
{
    public const NAMES = ['Lights', 'Glow', 'Radiant', 'FirstSteps', 'EverydayBusiness', 'TakeTheLead'];

    /** The Aurora Business modules (TRILHAS[…].program === 'business' on the client). */
    public const BUSINESS = ['FirstSteps', 'EverydayBusiness', 'TakeTheLead'];

    /** For an `in:` validation rule: "Lights,Glow,…". */
    public static function rule(): string
    {
        return 'in:' . implode(',', self::NAMES);
    }

    /** The stored name for what someone typed ("firststeps", "First Steps" → "FirstSteps"), or null. */
    public static function match(?string $typed): ?string
    {
        $key = strtolower(str_replace([' ', '-', '_'], '', (string) $typed));
        foreach (self::NAMES as $name) {
            if (strtolower($name) === $key) {
                return $name;
            }
        }
        return null;
    }
}
