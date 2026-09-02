<?php

namespace App\Http\Controllers;

use App\Models\TrilhaLessonBrief;
use Illuminate\Http\Request;

class TrilhaLessonBriefController extends Controller
{
    public function index()
    {
        return TrilhaLessonBrief::where('user_id', auth()->id())->get();
    }

    public function upsert(Request $request)
    {
        $data = $request->validate([
            'trilha'          => ['required', 'string', 'in:Lights,Glow,Radiant'],
            'trilha_lesson'   => ['required', 'integer', 'min:1', 'max:20'],
            'target_language' => ['nullable', 'string', 'max:5000'],
            'vocabulary'      => ['nullable', 'string', 'max:5000'],
            'level_notes'     => ['nullable', 'string', 'max:5000'],
            'source'          => ['nullable', 'string', 'max:2000'],
            'updated_by'      => ['nullable', 'string', 'max:100'],
        ]);

        $brief = TrilhaLessonBrief::updateOrCreate(
            [
                'user_id'       => auth()->id(),
                'trilha'        => $data['trilha'],
                'trilha_lesson' => $data['trilha_lesson'],
            ],
            $data,
        );

        return response()->json($brief);
    }
}
