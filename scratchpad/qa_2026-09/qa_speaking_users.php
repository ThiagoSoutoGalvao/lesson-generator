<?php
// QA helper for qa_useit.mjs: a temporary teacher AND a student that belongs to them (teacher_id),
// plus a student of some OTHER teacher for the ownership check. `cleanup <teacherEmail>` deletes all
// three and everything they saved. `create FirstSteps` makes the students First Steps ones (default Radiant). Only ever touches qa-useit-* accounts.
require 'C:/Users/thiag/Herd/lesson-generator/vendor/autoload.php';
$app = require 'C:/Users/thiag/Herd/lesson-generator/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$action = $argv[1] ?? 'create';
$pw = 'qa-useit-pass-9';

if ($action === 'create') {
    $stamp = time();
    $make = function (string $email, string $name, string $role, ?int $teacherId) use ($pw) {
        $u = new User();
        $u->name = $name; $u->email = $email; $u->password = Hash::make($pw); $u->role = $role;
        if ($role === 'student') { $u->trilha = $GLOBALS['argv'][2] ?? 'Radiant'; $u->teacher_id = $teacherId; $u->is_active = true; }
        $u->save();
        return $u;
    };
    $teacher = $make("qa-useit-teacher-$stamp@aurora.test", 'QA Teacher', 'teacher', null);
    $other   = $make("qa-useit-other-$stamp@aurora.test", 'QA Other Teacher', 'teacher', null);
    $student = $make("qa-useit-student-$stamp@aurora.test", 'Marina QA', 'student', $teacher->id);
    $foreign = $make("qa-useit-foreign-$stamp@aurora.test", 'Not Yours', 'student', $other->id);
    echo json_encode([
        'teacher' => ['id' => $teacher->id, 'email' => $teacher->email],
        'student' => ['id' => $student->id, 'email' => $student->email, 'name' => $student->name],
        'foreign' => ['id' => $foreign->id],
        'password' => $pw,
    ]);
} else {
    $stamp = preg_replace('/^qa-useit-teacher-(\d+)@aurora\.test$/', '$1', $argv[2] ?? '');
    $users = User::where('email', 'like', "qa-useit-%-$stamp@aurora.test")->get();
    $acts = App\Models\Activity::whereIn('user_id', $users->pluck('id'))->delete();
    $atts = App\Models\ActivityAttempt::whereIn('student_id', $users->pluck('id'))->delete();
    $n = User::whereIn('id', $users->pluck('id'))->delete();
    echo "deleted users: $n, activities: $acts, attempts: $atts";
}
