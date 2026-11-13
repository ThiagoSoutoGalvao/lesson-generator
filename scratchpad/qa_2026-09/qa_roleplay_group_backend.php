<?php
// 2026-11-13: role-play group mode. (1) Without group the prompt is byte-identical to HEAD before the change, at every
// level. (2) With group the prompt asks for role_c and says both A and B are students. (3) role_c is kept only in group
// mode, and a card without it still works. Http::fake — no API calls.
require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
// The service as it was before group mode (commit 646f463), renamed, to compare prompts against.
$head = __DIR__ . "/_ClaudeService_head.php";
if (! is_file($head)) file_put_contents($head, preg_replace("/^class ClaudeService\b/m", "class ClaudeServiceHead", shell_exec("git -C " . escapeshellarg(__DIR__ . "/../..") . " show 646f463:app/Services/ClaudeService.php")));
require $head;
use Illuminate\Support\Facades\Http;
use App\Services\ClaudeService;
use App\Services\LanguageLevel;

$ok = 0; $n = 0;
function check($name, $cond, $extra = '') { global $ok, $n; $n++; if ($cond) $ok++; echo ($cond ? 'PASS' : 'FAIL') . "  $name" . ($extra ? "  — $extra" : '') . "\n"; }
function call($obj, $method, ...$args) { $m = new ReflectionMethod($obj, $method); $m->setAccessible(true); return $m->invoke($obj, ...$args); }

$new = app(ClaudeService::class);
$old = app(App\Services\ClaudeServiceHead::class);
foreach ([null, 'A1', 'A2', 'B1', 'B2'] as $lvl) {
    $lv = LanguageLevel::from($lvl);
    check('no group: prompt byte-identical at ' . ($lvl ?? 'default'), call($new, 'buildRolePlayPrompt', 'SRC', 'TASK', $lv) === call($old, 'buildRolePlayPrompt', 'SRC', 'TASK', $lv));
}
$g = call($new, 'buildRolePlayPrompt', 'SRC', 'TASK', LanguageLevel::from('A2'), true);
check('group: asks for role_c', str_contains($g, '"role_c"'));
check('group: both A and B are students', str_contains($g, 'Role A and role B are BOTH played by students'));
check('group: no "role B by the teacher" line', ! str_contains($g, 'role B by the teacher'));

$reply = ['topic' => 'First day', 'targets' => ['Nice to meet you'], 'cards' => [
    ['situation' => 'Your first day at Nordia Foods.', 'role_a' => ['name' => 'New employee', 'brief' => 'You start today.'], 'role_b' => ['name' => 'Manager', 'brief' => 'You welcome them.'], 'role_c' => ['name' => 'Colleague', 'brief' => 'You join to say hello.']],
    ['situation' => 'Coffee break.', 'role_a' => ['name' => 'A', 'brief' => 'You ask.'], 'role_b' => ['name' => 'B', 'brief' => 'You answer.']],
]];
Http::fake(['*' => Http::response(['content' => [['type' => 'text', 'text' => json_encode($reply)]]], 200)]);
$withGroup = $new->generateRolePlay('SRC', 'TASK', 'A2', true);
check('group: role_c kept', ($withGroup['cards'][0]['role_c']['name'] ?? null) === 'Colleague');
check('group: a card without role_c still kept, without it', count($withGroup['cards']) === 2 && ! isset($withGroup['cards'][1]['role_c']));
$noGroup = $new->generateRolePlay('SRC', 'TASK', 'A2');
check('no group: role_c dropped', ! isset($noGroup['cards'][0]['role_c']));
$sent = collect(Http::recorded())->map(fn ($p) => $p[0]->data()['messages'][0]['content'] ?? '')->all();
check('group flag reached the prompt sent to Claude', str_contains($sent[0] ?? '', '"role_c"') && ! str_contains($sent[1] ?? '', '"role_c"'));
echo "\n$ok/$n passed\n";
