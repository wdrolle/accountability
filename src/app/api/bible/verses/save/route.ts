import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface agentsVerse {
  id?: string;
  agents_id: string;
  book_id: string;
  verse_id?: string;
  chapter: number;
  verse: number;
  text?: string;
  content?: string;
}

export async function POST(req: Request) {
  try {
    const rawPayload = await req.text();
    // console.log('API: Raw payload received:', rawPayload);

    let payload;
    try {
      payload = JSON.parse(rawPayload);
    } catch (e) {
      // console.error('API: Failed to parse JSON payload:', e);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // console.log('API: Parsed payload:', payload);
    
    if (!payload || !payload.verses || !Array.isArray(payload.verses)) {
      // console.log('API: Invalid payload structure:', {
      //   hasPayload: !!payload,
      //   hasVerses: !!(payload && payload.verses),
      //   isArray: !!(payload && payload.verses && Array.isArray(payload.verses))
      // });
      return NextResponse.json(
        { error: "Invalid payload structure. Expected { verses: [...] }" },
        { status: 400 }
      );
    }

    const versesArray = payload.verses as agentsVerse[];
    
    // console.log('API: Processing verses:', {
    //   count: versesArray.length,
    //   sample: versesArray[0]
    // });

    if (versesArray.length === 0) {
      return NextResponse.json(
        { error: "No verses provided" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      versesArray.map(async (verse: agentsVerse) => {
        try {
          if (!verse || typeof verse !== 'object') {
            // console.log('API: Invalid verse object:', verse);
            return null;
          }

          if (!verse.agents_id || !verse.book_id || !verse.chapter || !verse.verse || !verse.text || !verse.content) {
            // console.log('API: Skipping verse due to missing required fields:', {
            //   agents_id: !!verse.agents_id,
            //   book_id: !!verse.book_id,
            //   chapter: !!verse.chapter,
            //   verse: !!verse.verse,
            //   text: !!verse.text,
            //   content: !!verse.content,
            //   verse_data: verse
            // });
            return null;
          }

          const verse_id = verse.verse_id || `${verse.book_id}.${verse.chapter}.${verse.verse}`;
          const id = verse.id || verse_id;

          // Check if verse already exists
          const existingVerse = await prisma.agents_verses.findFirst({
            where: {
              agents_id: verse.agents_id,
              book_id: verse.book_id,
              verse_id: verse_id,
            },
          });

          if (!existingVerse) {
            // Create new verse if it doesn't exist
            const newVerse = await prisma.agents_verses.create({
              data: {
                id,
                agents_id: verse.agents_id,
                book_id: verse.book_id,
                verse_id,
                chapter: verse.chapter,
                verse: verse.verse,
                text: verse.text,
                content: verse.content
              },
            });
            // console.log('API: Created new verse:', { id: newVerse.id, verse_id: newVerse.verse_id });
            return newVerse;
          }

          // console.log('API: Verse already exists:', { id: existingVerse.id, verse_id: existingVerse.verse_id });
          return existingVerse;
        } catch (error) {
          // console.error('API: Error processing verse:', {
          //   verse,
          //   error: error instanceof Error ? error.message : String(error)
          // });
          return null;
        }
      })
    );

    const validResults = results.filter(result => result !== null);
    
    const response = { 
      success: true, 
      savedCount: validResults.length,
      totalCount: versesArray.length,
      skippedCount: versesArray.length - validResults.length,
      results: validResults.map(r => ({ id: r?.id, verse_id: r?.verse_id }))
    };

    // console.log('API: Operation complete:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    // console.error("API: Error saving verses:", error);
    return NextResponse.json(
      { error: "Failed to save verses", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 