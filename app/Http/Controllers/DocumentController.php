<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;

class DocumentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:512000'],
        ]);

        $file = $request->file('pdf');
        $path = $file->store('documents', 'local');

        $fullPath = Storage::path($path);

        try {
            $parser = new Parser();
            $pdf    = $parser->parseFile($fullPath);

            $pagesText = [];
            foreach ($pdf->getPages() as $page) {
                $raw   = $page->getText();
                $clean = iconv('UTF-8', 'UTF-8//IGNORE', $raw);
                $pagesText[] = $clean !== false ? $clean : '';
            }
        } catch (\Exception $e) {
            Storage::delete($path);
            return response()->json([
                'message' => 'Could not read this PDF. The file may be corrupted or password-protected.',
            ], 422);
        }

        $fullText = implode("\n\n", $pagesText);

        $document = Document::create([
            'user_id'        => auth()->id(),
            'original_name'  => $file->getClientOriginalName(),
            'stored_path'    => $path,
            'source_type'    => 'pdf',
            'status'         => 'ready',
            'extracted_text' => $fullText,
            'pages_text'     => $pagesText,
            'page_count'     => count($pagesText),
        ]);

        return response()->json([
            'id'            => $document->id,
            'original_name' => $document->original_name,
            'page_count'    => $document->page_count,
            'preview'       => mb_substr($fullText, 0, 500),
            'char_count'    => mb_strlen($fullText),
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $request->validate([
            'extracted_text' => ['required', 'string'],
        ]);

        $document = Document::findOrFail($id);
        $document->update(['extracted_text' => $request->extracted_text]);

        return response()->json(['ok' => true]);
    }

    public function index()
    {
        return Document::select('id', 'original_name', 'source_type', 'page_count', 'created_at')
            ->where('user_id', auth()->id())
            ->where('status', 'ready')
            ->orderByDesc('created_at')
            ->get();
    }
}
