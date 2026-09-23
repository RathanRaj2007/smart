import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.json({});
    const session = await getAppSession(req as unknown as Request, res as unknown as Response);

    if (!session?.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = (formData.get("audio") || formData.get("file")) as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file too large (max 10MB)" }, { status: 400 });
    }

    const whisperUrl = process.env.WHISPER_SERVICE_URL || "http://127.0.0.1:8000";
    const targetEndpoint = `${whisperUrl.replace(/\/$/, "")}/transcribe`;

    // Forward uploaded audio file to local Python Whisper service
    const outboundData = new FormData();
    outboundData.append("file", file, file.name || "recording.webm");

    let whisperRes: Response;
    let transcriptText = "";

    try {
      whisperRes = await fetch(targetEndpoint, {
        method: "POST",
        body: outboundData,
      });

      if (!whisperRes.ok) {
        const errText = await whisperRes.text();
        console.error("Local Whisper service returned error:", whisperRes.status, errText);
        throw new Error(`Local service returned HTTP ${whisperRes.status}`);
      }

      const data = await whisperRes.json();
      transcriptText = (data.text || "").trim();
    } catch (netErr) {
      console.warn("Local Whisper service connection error, trying cloud fallback:", netErr);
      
      // Attempt fallback transcription using Gemini if API key is set
      const fallbackText = await fallbackTranscription(file);
      if (fallbackText) {
        transcriptText = fallbackText;
      } else {
        return NextResponse.json(
          { error: "Local Whisper transcription service is unavailable. Please start backend/whisper/app.py or type your answer manually." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({
      text: transcriptText,
      transcript: transcriptText,
    });
  } catch (error: unknown) {
    console.error("Transcription route error:", error);
    return NextResponse.json(
      { error: "Internal transcription server error. You can type your answer manually." },
      { status: 500 }
    );
  }
}

import { getGenAI } from "@/lib/llm/gemini";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _transcribeModel: any = null;

function getTranscribeModel() {
  if (!_transcribeModel) {
    const genAI = getGenAI();
    _transcribeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return _transcribeModel;
}

async function fallbackTranscription(file: File): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const model = getTranscribeModel();

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");
    const rawMime = file.type || "audio/webm";
    const mimeType = rawMime.split(";")[0] || "audio/webm";

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      "Transcribe the spoken audio accurately. Output only the verbatim transcribed text, without any conversational prefix or commentary.",
    ]);

    const text = result.response.text()?.trim();
    if (text) {
      console.log("[Transcribe API] Fallback to Gemini successful");
      return text;
    }
  } catch (err) {
    console.warn("[Transcribe API] Gemini fallback failed:", err);
  }
  return null;
}
