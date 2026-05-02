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
        $parser   = new Parser();
        $pdf      = $parser->parseFile($fullPath);

        $pagesText = [];
        foreach ($pdf->getPages() as $page) {
            $raw   = $page->getText();
            $clean = iconv('UTF-8', 'UTF-8//IGNORE', $raw);
            $pagesText[] = $clean !== false ? $clean : '';
        }

        $fullText = implode("\n\n", $pagesText);

        $document = Document::create([
            'original_name'  => $file->getClientOriginalName(),
            'stored_path'    => $path,
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

    public function index()
    {
        return Document::select('id', 'original_name', 'page_count', 'created_at')
            ->orderByDesc('created_at')
            ->get();
    }
}
