<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\ClaudeService;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function generate(Request $request, ClaudeService $claude)
    {
        $request->validate([
            'document_id' => ['required', 'exists:documents,id'],
            'prompt'      => ['required', 'string', 'max:1000'],
        ]);

        $document = Document::findOrFail($request->document_id);
        $text = $claude->generate($document->extracted_text, $request->prompt);

        return response()->json(['response' => $text]);
    }
}
