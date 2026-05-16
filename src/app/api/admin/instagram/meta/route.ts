import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Post do Instagram';
    const thumbnail_url = $('meta[property="og:image"]').attr('content') || '';

    return NextResponse.json({ title, thumbnail_url });
  } catch (error) {
    console.error("Meta scrape error:", error);
    return NextResponse.json({ title: 'Post do Instagram', thumbnail_url: '' }, { status: 200 }); // Fallback on error
  }
}
