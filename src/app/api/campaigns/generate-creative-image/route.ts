import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/src/lib/auth/session';
import { rateLimit } from '@/src/lib/rate-limit';

const IMAGE_RATE_LIMIT = { limit: 12, windowMs: 60_000 };

type Body = {
  title?: string;
  brief?: string;
  objective?: string;
  country?: string;
};

const buildImagePrompt = (body: Body, maxBrief = 400): string => {
  const title = String(body.title || 'Product promotion').trim().slice(0, 120);
  const brief = String(body.brief || '').trim().slice(0, maxBrief);
  const objective = String(body.objective || 'sales').trim();
  const country = String(body.country || '').trim();
  return [
    'Professional high-quality advertising creative, square 1:1, clean modern layout,',
    'suitable for Meta, TikTok and display ads.',
    'No text overlays unless subtle brand feel; photorealistic or premium product photography style.',
    `Campaign theme: ${title}.`,
    brief ? `Context: ${brief}` : '',
    `Marketing objective: ${objective}.`,
    country ? `Target region vibe: ${country}.` : '',
    'Vibrant but trustworthy, high conversion aesthetic.',
  ]
    .filter(Boolean)
    .join(' ');
};

const POLLINATIONS_MAX_URL_CHARS = 1900;

async function fetchPollinationsWithPrompt(prompt: string): Promise<Response> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now() % 1_000_000}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);
  try {
    return await fetch(url, { redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function tryGeminiImage(apiKey: string, prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  const models = [
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp-image-generation',
  ];
  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Generate a single advertising image: ${prompt}` }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    });
    if (!res.ok) continue;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
    };
    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const p of parts) {
      const d = p.inlineData?.data;
      if (d && typeof d === 'string') {
        return { base64: d, mimeType: p.inlineData?.mimeType || 'image/png' };
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    const rl = rateLimit(`creative-img:${user.id}`, IMAGE_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many image generations. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
    }

    let prompt = buildImagePrompt(body);
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      try {
        const gem = await tryGeminiImage(geminiKey, prompt);
        if (gem) {
          return NextResponse.json({
            success: true,
            source: 'gemini',
            imageBase64: gem.base64,
            mimeType: gem.mimeType,
          });
        }
      } catch (e) {
        console.warn('[generate-creative-image] Gemini image failed:', e);
      }
    }

    let imgRes: Response | null = null;
    const promptVariants = [
      prompt,
      buildImagePrompt(body, 120),
      `Professional ad image 1:1, ${String(body.title || 'product').trim().slice(0, 80)}, clean modern, no text overlay`,
    ];
    for (const p of promptVariants) {
      const urlLen =
        `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true&seed=0`.length;
      if (urlLen > POLLINATIONS_MAX_URL_CHARS) continue;
      imgRes = await fetchPollinationsWithPrompt(p);
      if (imgRes.ok) break;
    }
    if (!imgRes?.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Image generation failed. Set GEMINI_API_KEY on the server for best quality, or try again later.',
        },
        { status: 502 }
      );
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const mime = imgRes.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    return NextResponse.json({
      success: true,
      source: 'pollinations',
      imageBase64: buf.toString('base64'),
      mimeType: mime,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : 'Image generation failed.',
      },
      { status: 500 }
    );
  }
}
