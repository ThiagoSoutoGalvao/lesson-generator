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
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:204800'],
        ]);

        $file = $request->file('pdf');
        $path = $file->store('documents', 'local');

        $fullPath = Storage::path($path);
        $parser = new Parser();
        $pdf = $parser->parseFile($fullPath);
        $text = $pdf->getText();

        $document = Document::create([
            'original_name' => $file->getClientOriginalName(),
            'stored_path'   => $path,
            'extracted_text' => $text,
        ]);

        return response()->json([
            'id'            => $document->id,
            'original_name' => $document->original_name,
            'preview'       => mb_substr($text, 0, 500),
            'char_count'    => mb_strlen($text),
        ], 201);
    }

    public function index()
    {
        $documents = Document::select('id', 'original_name', 'created_at')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($documents);
    }
}
