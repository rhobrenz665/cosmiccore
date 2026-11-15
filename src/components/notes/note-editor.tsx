"use client";

import { useState } from "react";
import { Eye, Focus, PencilLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_BODY_BYTES, MAX_TITLE_CODE_POINTS } from "@/lib/notes/rules";
import { MarkdownPreview } from "./markdown-preview";

export function NoteEditor({ initialTitle, initialBody }: { initialTitle: string; initialBody: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [focusMode, setFocusMode] = useState(false);

  const titleCodePoints = Array.from(title.normalize("NFC").trim()).length;
  const bodyBytes = new TextEncoder().encode(body).byteLength;
  const titleError = titleCodePoints > MAX_TITLE_CODE_POINTS || title.includes("\0");
  const bodyError = bodyBytes > MAX_BODY_BYTES || body.includes("\0");
  const changed = title !== initialTitle || body !== initialBody;

  function enterFocusMode() {
    setActiveTab("edit");
    setFocusMode(true);
  }

  return <div className={`note-editor-shell${focusMode ? " note-editor-focus" : ""}`}>
    <div className="note-editor-topline">
      <div className="note-editor-status" role="status">{changed ? "Local changes · not saved yet" : "Saved version"}</div>
      {focusMode ? <Button variant="outline" onClick={() => setFocusMode(false)}><X size={15}/> Exit focus mode</Button> : <Button variant="outline" onClick={enterFocusMode}><Focus size={15}/> Focus mode</Button>}
    </div>
    <p className="note-editor-step-notice">Changes stay in this tab and are not saved yet. Refreshing or leaving this note will discard them; autosave and conflict handling come next.</p>

    <div className="note-mobile-tabs" role="group" aria-label="Note editor view">
      <button type="button" aria-pressed={activeTab === "edit"} aria-controls="note-edit-panel" onClick={() => setActiveTab("edit")}><PencilLine size={15}/> Edit</button>
      <button type="button" aria-pressed={activeTab === "preview"} aria-controls="note-preview-panel" onClick={() => setActiveTab("preview")}><Eye size={15}/> Preview</button>
    </div>

    <div className="note-editor-grid">
      <section id="note-edit-panel" className={`note-edit-panel${activeTab === "edit" ? " is-active" : ""}`} aria-label="Edit note">
        <label className="note-title-label" htmlFor="note-title">Title</label>
        <input id="note-title" className="note-title-input" value={title} maxLength={MAX_TITLE_CODE_POINTS * 2} onChange={(event) => setTitle(event.target.value)} aria-invalid={titleError} aria-describedby={titleError ? "note-title-help note-title-error" : "note-title-help"} placeholder="Untitled"/>
        <div id="note-title-help" className="note-field-meta"><span>Leave blank to show “Untitled”</span><span>{titleCodePoints}/{MAX_TITLE_CODE_POINTS} characters</span></div>
        {titleError && <p id="note-title-error" className="note-field-error" role="alert">Title is too long or contains a character the database cannot store.</p>}

        <label className="note-title-label note-body-label" htmlFor="note-body">Markdown</label>
        <textarea id="note-body" className="note-body-input" value={body} onChange={(event) => setBody(event.target.value)} aria-invalid={bodyError} aria-describedby={bodyError ? "note-body-help note-body-error" : "note-body-help"} placeholder={'# A new idea\n\nStart writing in Markdown…'} spellCheck autoCapitalize="sentences"/>
        <div id="note-body-help" className="note-field-meta"><span>Markdown source</span><span>{bodyBytes.toLocaleString()} / {MAX_BODY_BYTES.toLocaleString()} bytes</span></div>
        {bodyError && <p id="note-body-error" className="note-field-error" role="alert">The note exceeds the 256 KiB limit or contains a character the database cannot store.</p>}
      </section>

      {!focusMode && <section id="note-preview-panel" className={`note-preview-panel${activeTab === "preview" ? " is-active" : ""}`} aria-label="Markdown preview">
        <div className="note-preview-heading"><span><Eye size={16}/> Preview</span><span>Private</span></div>
        <div className="note-preview-content"><MarkdownPreview markdown={body}/></div>
      </section>}
    </div>
  </div>;
}
