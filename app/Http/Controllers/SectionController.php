<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\ClaudeService;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function detect(Request $request, ClaudeService $claude)
    {
        $request->validate([
            'document_id' => ['required', 'exists:documents,id'],
            'page_from'   => ['required', 'integer', 'min:1'],
            'page_to'     => ['required', 'integer', 'min:1'],
        ]);

        $document = Document::findOrFail($request->document_id);

        $pages = array_slice(
            $document->pages_text ?? [],
            $request->page_from - 1,
            $request->page_to - $request->page_from + 1
        );
        $text = implode("\n\n", $pages);

        if (empty(trim($text))) {
            return response()->json([
                'message' => 'No text could be extracted from the selected pages.',
            ], 422);
        }

        try {
            $sections = $claude->detectSections($text);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($sections);
    }
}
