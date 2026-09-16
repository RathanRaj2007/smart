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
    try {
      whisperRes = await fetch(targetEndpoint, {
        method: "POST",
        body: outboundData,
      });
    } catch (netErr) {
      console.warn("Local Whisper service connection error:", netErr);
      return NextResponse.json(
        { error: "Local Whisper transcription service is unavailable. Please type your answer manually." },
        { status: 503 }
      );
    }

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      console.error("Local Whisper service returned error:", whisperRes.status, errText);
      return NextResponse.json(
        { error: "Transcription failed on local service. Please type your answer manually." },
        { status: 502 }
      );
    }

    const data = await whisperRes.json();
    const transcriptText = (data.text || "").trim();

    return NextResponse.json({
      text: transcriptText,
      transcript: transcriptText,
      duration: data.duration,
    });
  } catch (error: unknown) {
    console.error("Transcription route error:", error);
    return NextResponse.json(
      { error: "Internal transcription server error. You can type your answer manually." },
      { status: 500 }
    );
  }
}
