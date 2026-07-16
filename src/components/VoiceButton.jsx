"use client";

import { useRef, useState, useCallback } from "react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const REALTIME_URL =
  "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview";

// ─── State configs ────────────────────────────────────────────────────────────

const STATE_CONFIG = {
  idle: {
    icon:  Mic,
    label: "Voice Mode",
    style: {
      background: "var(--bg-subtle)",
      border:     "1px solid var(--border-medium)",
      color:      "var(--text-secondary)",
    },
  },
  connecting: {
    icon:  Loader2,
    label: "Connecting…",
    style: {
      background: "var(--bg-subtle)",
      border:     "1px solid var(--border)",
      color:      "var(--text-muted)",
    },
  },
  live: {
    icon:  MicOff,
    label: "End Call",
    style: {
      background: "var(--red-dim)",
      border:     "1px solid var(--red-border)",
      color:      "var(--red-text)",
    },
  },
  error: {
    icon:  AlertCircle,
    label: "Retry",
    style: {
      background: "var(--red-dim)",
      border:     "1px solid var(--red-border)",
      color:      "var(--red-text)",
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * "Voice Mode" button using OpenAI Realtime API over WebRTC.
 */
export default function VoiceButton({ customerId, sessionId }) {
  const [voiceState, setVoiceState] = useState("idle");
  const [errorMsg,   setErrorMsg]   = useState(null);

  const pcRef       = useRef(null);
  const dcRef       = useRef(null);
  const micTrackRef = useRef(null);
  const audioElRef  = useRef(null);

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    micTrackRef.current?.stop();
    micTrackRef.current = null;

    try { dcRef.current?.close(); } catch {}
    dcRef.current = null;

    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;

    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
  }, []);

  // ── Tool call handler ────────────────────────────────────────────────────────

  const handleDCMessage = useCallback(
    async (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type !== "response.function_call_arguments.done") return;

      const { call_id, name: toolName, arguments: argsStr } = msg;

      let parsedArgs = {};
      try { parsedArgs = JSON.parse(argsStr ?? "{}"); } catch { parsedArgs = {}; }

      let toolResult;
      try {
        const execRes = await fetch("/api/agent/tool-exec", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ sessionId, toolName, args: parsedArgs }),
        });
        const data = await execRes.json();
        toolResult = execRes.ok ? data.result : { error: data.error };
      } catch (err) {
        toolResult = { error: err?.message ?? "Tool execution failed." };
      }

      const dc = dcRef.current;
      if (dc?.readyState === "open") {
        dc.send(JSON.stringify({
          type: "conversation.item.create",
          item: { type: "function_call_output", call_id, output: JSON.stringify(toolResult) },
        }));
        dc.send(JSON.stringify({ type: "response.create" }));
      }
    },
    [sessionId]
  );

  // ── Start session ────────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    setVoiceState("connecting");
    setErrorMsg(null);

    try {
      const tokenRes = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Token fetch failed (${tokenRes.status})`);
      }
      const sessionData  = await tokenRes.json();
      const ephemeralKey = sessionData?.client_secret?.value;
      if (!ephemeralKey) throw new Error("No ephemeral key in session response.");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const micTrack = stream.getAudioTracks()[0];
      micTrackRef.current = micTrack;
      pc.addTrack(micTrack, stream);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen    = () => setVoiceState("live");
      dc.onclose   = () => { if (pcRef.current) { cleanup(); setVoiceState("idle"); } };
      dc.onmessage = handleDCMessage;

      pc.ontrack = (event) => {
        if (audioElRef.current && event.streams[0]) {
          audioElRef.current.srcObject = event.streams[0];
          audioElRef.current.play().catch(() => {});
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(REALTIME_URL, {
        method:  "POST",
        headers: { Authorization: `Bearer ${ephemeralKey}`, "Content-Type": "application/sdp" },
        body:    offer.sdp,
      });

      if (!sdpRes.ok) throw new Error(`SDP exchange failed: ${sdpRes.status} ${sdpRes.statusText}`);

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      const msg = err?.message ?? "Connection failed.";
      setErrorMsg(msg);
      setVoiceState("error");
      cleanup();
    }
  }, [cleanup, handleDCMessage]);

  // ── Stop session ─────────────────────────────────────────────────────────────

  const stopSession = useCallback(() => {
    cleanup();
    setVoiceState("idle");
    setErrorMsg(null);
  }, [cleanup]);

  function handleClick() {
    if (voiceState === "live" || voiceState === "connecting") {
      stopSession();
    } else {
      startSession();
    }
  }

  const cfg  = STATE_CONFIG[voiceState];
  const Icon = cfg.icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
      <button
        id="voice-btn"
        onClick={handleClick}
        disabled={voiceState === "connecting"}
        aria-label={cfg.label}
        title={voiceState === "error" && errorMsg ? errorMsg : undefined}
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          gap:            "6px",
          fontSize:       "var(--font-size-xs)",
          fontWeight:     "500",
          padding:        "6px 14px",
          borderRadius:   "var(--radius-pill)",
          cursor:         voiceState === "connecting" ? "not-allowed" : "pointer",
          transition:     "all var(--transition-fast)",
          userSelect:     "none",
          fontFamily:     "var(--font-body)",
          letterSpacing:  "0.01em",
          position:       "relative",
          overflow:       "hidden",
          ...cfg.style,
        }}
        onMouseEnter={(e) => {
          if (voiceState !== "connecting") {
            e.currentTarget.style.opacity = "0.85";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity   = "1";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <Icon
          size={12}
          style={{ flexShrink: 0, animation: voiceState === "connecting" ? "spin 1s linear infinite" : "none" }}
        />
        {cfg.label}
        {voiceState === "live" && (
          <span
            className="pulse-live"
            style={{
              width:        "6px",
              height:       "6px",
              background:   "var(--red)",
              borderRadius: "50%",
              display:      "inline-block",
              flexShrink:   0,
            }}
            aria-hidden
          />
        )}
      </button>

      {voiceState === "error" && errorMsg && (
        <p
          className="animate-fade-in"
          style={{
            fontSize:    "9px",
            color:       "var(--red-text)",
            maxWidth:    "160px",
            textAlign:   "right",
            lineHeight:  "var(--line-height-snug)",
            opacity:     0.8,
            fontFamily:  "var(--font-body)",
          }}
        >
          {errorMsg}
        </p>
      )}

      {/* Hidden audio element */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioElRef} hidden autoPlay playsInline />
    </div>
  );
}
