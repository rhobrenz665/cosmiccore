"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Focus, PencilLine, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveNoteAction } from "@/app/(workspace)/notes/actions";
import { MAX_BODY_BYTES, MAX_TITLE_CODE_POINTS } from "@/lib/notes/rules";
import { MarkdownPreview } from "./markdown-preview";

type Draft = { title: string; body: string };
type SaveRequest = Draft & { noteId: string; expectedRevision: number; mutationId: string };
type ConflictVersion = Draft & { revision: number; updatedAt: string };
type SaveState =
  | { kind: "saved" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "error"; message: string }
  | { kind: "conflict"; latest: ConflictVersion };

function canonicalDraft(draft: Draft): Draft {
  return { title: draft.title.normalize("NFC").trim(), body: draft.body };
}

function sameDraft(left: Draft, right: Draft) {
  const a = canonicalDraft(left);
  const b = canonicalDraft(right);
  return a.title === b.title && a.body === b.body;
}

export function NoteEditor({ noteId, initialTitle, initialBody, initialRevision }: { noteId: string; initialTitle: string; initialBody: string; initialRevision: number }) {
  const [draft, setDraft] = useState<Draft>({ title: initialTitle, body: initialBody });
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [focusMode, setFocusMode] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "saved" });
  const draftRef = useRef(draft);
  const acknowledgedRef = useRef<Draft>(canonicalDraft(draft));
  const revisionRef = useRef(initialRevision);
  const retryRequestRef = useRef<SaveRequest | null>(null);
  const inFlightRef = useRef(false);
  const conflictRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titleCodePoints = Array.from(draft.title.normalize("NFC").trim()).length;
  const bodyBytes = new TextEncoder().encode(draft.body).byteLength;
  const titleError = titleCodePoints > MAX_TITLE_CODE_POINTS || draft.title.includes("\0");
  const bodyError = bodyBytes > MAX_BODY_BYTES || draft.body.includes("\0");
  const changed = !sameDraft(draft, acknowledgedRef.current);

  const updateDraft = useCallback((next: Draft) => {
    draftRef.current = next;
    setDraft(next);
    if (!conflictRef.current) setSaveState(inFlightRef.current ? { kind: "saving" } : { kind: "dirty" });
  }, []);

  const pumpSave = useCallback(async () => {
    if (inFlightRef.current || conflictRef.current) return;
    const raw = draftRef.current;
    let request = retryRequestRef.current;
    if (!request) {
      if (titleCodePointCount(raw.title) > MAX_TITLE_CODE_POINTS || raw.title.includes("\0") || new TextEncoder().encode(raw.body).byteLength > MAX_BODY_BYTES || raw.body.includes("\0")) {
        setSaveState({ kind: "error", message: "Fix the highlighted fields before saving." });
        return;
      }
      if (sameDraft(raw, acknowledgedRef.current)) {
        setSaveState({ kind: "saved" });
        return;
      }
      const normalized = canonicalDraft(raw);
      request = {
        ...normalized,
        noteId,
        expectedRevision: revisionRef.current,
        mutationId: crypto.randomUUID(),
      };
    }

    inFlightRef.current = true;
    setSaveState({ kind: "saving" });
    const result = await saveNoteAction(request).catch(() => ({
      ok: false as const, code: "DEPENDENCY_UNAVAILABLE", message: "Save could not be confirmed. Retry to safely check whether it completed.",
    }));
    inFlightRef.current = false;

    if (!result.ok && result.code === "CONFLICT") {
      retryRequestRef.current = null;
      conflictRef.current = true;
      setSaveState({ kind: "conflict", latest: result.latest });
      return;
    }
    if (!result.ok) {
      retryRequestRef.current = request;
      setSaveState({ kind: "error", message: result.message });
      return;
    }

    retryRequestRef.current = null;
    revisionRef.current = result.revision;
    acknowledgedRef.current = { title: request.title, body: request.body };
    if (sameDraft(draftRef.current, acknowledgedRef.current)) {
      setSaveState({ kind: "saved" });
    } else {
      setSaveState({ kind: "dirty" });
      // Edits made during this request are saved only after its revision is
      // acknowledged, so the next request uses the new expected revision.
      void pumpSave();
    }
  }, [noteId]);

  useEffect(() => {
    if (conflictRef.current) return;
    if (!changed && !retryRequestRef.current) {
      setSaveState({ kind: "saved" });
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void pumpSave(); }, 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [draft, changed, pumpSave]);

  useEffect(() => {
    if (saveState.kind === "saved") return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [saveState.kind]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function useServerVersion() {
    if (saveState.kind !== "conflict") return;
    if (changed && !window.confirm("Discard your local changes and use the latest saved version?")) return;
    const latest = saveState.latest;
    const next = { title: latest.title, body: latest.body };
    conflictRef.current = false;
    retryRequestRef.current = null;
    revisionRef.current = latest.revision;
    acknowledgedRef.current = canonicalDraft(next);
    updateDraft(next);
    setSaveState({ kind: "saved" });
  }

  function saveMyVersion() {
    if (saveState.kind !== "conflict") return;
    if (!window.confirm("Save your local text over the latest saved version? This replaces its title and body.")) return;
    revisionRef.current = saveState.latest.revision;
    conflictRef.current = false;
    setSaveState({ kind: "dirty" });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void pumpSave(); }, 0);
  }

  function enterFocusMode() {
    setActiveTab("edit");
    setFocusMode(true);
  }

  const statusText = saveState.kind === "saved" ? "Saved" : saveState.kind === "dirty" ? "Unsaved changes" : saveState.kind === "saving" ? "Saving…" : saveState.kind === "conflict" ? "Conflict needs your choice" : "Save needs attention";

  return <div className={`note-editor-shell${focusMode ? " note-editor-focus" : ""}`}>
    <div className="note-editor-topline">
      <div className={`note-editor-status note-save-${saveState.kind}`} role="status" aria-live="polite">{statusText}</div>
      {focusMode ? <Button variant="outline" onClick={() => setFocusMode(false)}><X size={15}/> Exit focus mode</Button> : <Button variant="outline" onClick={enterFocusMode}><Focus size={15}/> Focus mode</Button>}
    </div>
    <p className="note-editor-step-notice">Your note saves automatically after a short pause. Keep this tab open until the status says Saved.</p>

    {saveState.kind === "error" && <div className="note-save-error" role="alert"><span>{saveState.message} Your draft is still here.</span>{retryRequestRef.current && <Button variant="outline" onClick={() => { void pumpSave(); }}><RotateCw size={14}/> Retry save</Button>}</div>}
    {saveState.kind === "conflict" && <section className="note-conflict-card" aria-labelledby="note-conflict-title">
      <div><h2 id="note-conflict-title">This note changed in another tab</h2><p>Your local text is preserved. The latest saved version is shown below.</p></div>
      <div className="note-conflict-preview"><strong>Latest saved version · revision {saveState.latest.revision}</strong><div className="note-conflict-title-preview">{saveState.latest.title || "Untitled"}</div><MarkdownPreview markdown={saveState.latest.body}/></div>
      <div className="note-conflict-actions"><Button variant="outline" onClick={useServerVersion}>Use server version</Button><Button onClick={saveMyVersion}>Save my version over it</Button></div>
    </section>}

    <div className="note-mobile-tabs" role="group" aria-label="Note editor view">
      <button type="button" aria-pressed={activeTab === "edit"} aria-controls="note-edit-panel" onClick={() => setActiveTab("edit")}><PencilLine size={15}/> Edit</button>
      <button type="button" aria-pressed={activeTab === "preview"} aria-controls="note-preview-panel" onClick={() => setActiveTab("preview")}><Eye size={15}/> Preview</button>
    </div>

    <div className="note-editor-grid">
      <section id="note-edit-panel" className={`note-edit-panel${activeTab === "edit" ? " is-active" : ""}`} aria-label="Edit note">
        <label className="note-title-label" htmlFor="note-title">Title</label>
        <input id="note-title" className="note-title-input" value={draft.title} maxLength={MAX_TITLE_CODE_POINTS * 2} onChange={(event) => updateDraft({ ...draftRef.current, title: event.target.value })} aria-invalid={titleError} aria-describedby={titleError ? "note-title-help note-title-error" : "note-title-help"} placeholder="Untitled"/>
        <div id="note-title-help" className="note-field-meta"><span>Leave blank to show “Untitled”</span><span>{titleCodePoints}/{MAX_TITLE_CODE_POINTS} characters</span></div>
        {titleError && <p id="note-title-error" className="note-field-error" role="alert">Title is too long or contains a character the database cannot store.</p>}

        <label className="note-title-label note-body-label" htmlFor="note-body">Markdown</label>
        <textarea id="note-body" className="note-body-input" value={draft.body} onChange={(event) => updateDraft({ ...draftRef.current, body: event.target.value })} aria-invalid={bodyError} aria-describedby={bodyError ? "note-body-help note-body-error" : "note-body-help"} placeholder={'# A new idea\n\nStart writing in Markdown…'} spellCheck autoCapitalize="sentences"/>
        <div id="note-body-help" className="note-field-meta"><span>Markdown source</span><span>{bodyBytes.toLocaleString()} / {MAX_BODY_BYTES.toLocaleString()} bytes</span></div>
        {bodyError && <p id="note-body-error" className="note-field-error" role="alert">The note exceeds the 256 KiB limit or contains a character the database cannot store.</p>}
      </section>

      {!focusMode && <section id="note-preview-panel" className={`note-preview-panel${activeTab === "preview" ? " is-active" : ""}`} aria-label="Markdown preview">
        <div className="note-preview-heading"><span><Eye size={16}/> Preview</span><span>Private</span></div>
        <div className="note-preview-content"><MarkdownPreview markdown={draft.body}/></div>
      </section>}
    </div>
  </div>;
}

function titleCodePointCount(title: string) {
  return Array.from(title.normalize("NFC").trim()).length;
}
