"use client";

import { useEffect, useState } from "react";
import { Plus, RotateCw, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mutateOrganizationAction } from "@/app/(workspace)/notes/actions";
import { MAX_ORGANIZATION_NAME_CODE_POINTS } from "@/lib/notes/rules";

export type OrganizationOption = { id: string; displayName: string };
type Kind = "collection" | "tag";
type Action = "create" | "rename" | "delete";
type Request = { kind: Kind; action: Action; mutationId: string; id?: string; name?: string; noteId: string };

export function OrganizationManager({ noteId, collections, tags, onChanged }: {
  noteId: string;
  collections: OrganizationOption[];
  tags: OrganizationOption[];
  onChanged: (kind: Kind, action: Action, id: string, displayName?: string, noteRevision?: number) => void;
}) {
  const [kind, setKind] = useState<Kind>("collection");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ kind: Kind; id: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [pending, setPending] = useState<Request | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!pending) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [pending]);

  async function perform(request: Request) {
    setPending(request);
    setBusy(true);
    setMessage("");
    let result: Awaited<ReturnType<typeof mutateOrganizationAction>>;
    try {
      result = await mutateOrganizationAction(request);
    } catch {
      setBusy(false);
      setMessage("The result could not be confirmed. Retry this same operation to check safely.");
      return;
    }
    setBusy(false);
    if (result.ok) {
      setPending(null);
      onChanged(request.kind, request.action, result.id, result.displayName, result.noteRevision);
      setEditing(null);
      setName("");
      setMessage(request.action === "delete" ? `Deleted. ${result.affectedCount ?? 0} notes were updated.` : "Saved.");
      return;
    }
    setMessage(`${result.message}${result.code === "DEPENDENCY_UNAVAILABLE" ? " Retry using the same request." : ""}`);
    if (result.code !== "DEPENDENCY_UNAVAILABLE") setPending(null);
  }

  function beginCreate() {
    void perform({ kind, action: "create", name, noteId, mutationId: crypto.randomUUID() });
  }

  function beginRename(resourceKind: Kind, item: OrganizationOption) {
    setEditing({ kind: resourceKind, id: item.id });
    setEditName(item.displayName);
    setMessage("");
  }

  function saveRename() {
    if (!editing) return;
    void perform({ kind: editing.kind, action: "rename", id: editing.id, name: editName, noteId, mutationId: crypto.randomUUID() });
  }

  function deleteResource(resourceKind: Kind, item: OrganizationOption) {
    if (!window.confirm(`Delete “${item.displayName}”? Notes will remain and lose this ${resourceKind}.`)) return;
    void perform({ kind: resourceKind, action: "delete", id: item.id, noteId, mutationId: crypto.randomUUID() });
  }

  const disabled = busy || pending !== null;
  const nameLength = Array.from(name.normalize("NFC").trim()).length;
  const editNameLength = Array.from(editName.normalize("NFC").trim()).length;
  const rows = (resourceKind: Kind, items: OrganizationOption[]) => <ul className="organization-list">
    {items.map((item) => <li key={item.id}>
      {editing?.kind === resourceKind && editing.id === item.id
        ? <><div className="organization-edit-input"><input aria-label={`Rename ${resourceKind}`} value={editName} maxLength={MAX_ORGANIZATION_NAME_CODE_POINTS * 2} onChange={(event) => setEditName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveRename(); if (event.key === "Escape") setEditing(null); }}/><small>{editNameLength}/{MAX_ORGANIZATION_NAME_CODE_POINTS}</small></div><Button size="sm" disabled={disabled || editNameLength < 1 || editNameLength > MAX_ORGANIZATION_NAME_CODE_POINTS} onClick={saveRename}>Save</Button><Button size="sm" variant="ghost" disabled={disabled} onClick={() => setEditing(null)}>Cancel</Button></>
        : <><span>{item.displayName}</span><div><Button size="sm" variant="ghost" disabled={disabled} onClick={() => beginRename(resourceKind, item)}>Rename</Button><Button size="icon-sm" variant="ghost" aria-label={`Delete ${item.displayName}`} disabled={disabled} onClick={() => deleteResource(resourceKind, item)}><Trash2 size={14}/></Button></div></>}
    </li>)}
    {!items.length && <li className="organization-empty">No {resourceKind}s yet.</li>}
  </ul>;

  return <details className="organization-manager">
    <summary><Tag size={15}/> Manage collections and tags</summary>
    <div className="organization-manager-content">
      <div className="organization-create-row">
        <select aria-label="Organization type" value={kind} disabled={disabled} onChange={(event) => setKind(event.target.value as Kind)}>
          <option value="collection">Collection</option><option value="tag">Tag</option>
        </select>
        <div className="organization-name-input"><input aria-label={`New ${kind} name`} value={name} maxLength={MAX_ORGANIZATION_NAME_CODE_POINTS * 2} placeholder={`New ${kind} name`} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") beginCreate(); }} disabled={disabled}/><small>{nameLength}/{MAX_ORGANIZATION_NAME_CODE_POINTS}</small></div>
        <Button size="sm" onClick={beginCreate} disabled={disabled || nameLength < 1 || nameLength > MAX_ORGANIZATION_NAME_CODE_POINTS}><Plus size={14}/> Add</Button>
      </div>
      <div className="organization-columns">
        <section><h3>Collections · {collections.length}/50</h3>{rows("collection", collections)}</section>
        <section><h3>Tags · {tags.length}/100</h3>{rows("tag", tags)}</section>
      </div>
      {pending && !busy && <Button variant="outline" size="sm" onClick={() => { void perform(pending); }}><RotateCw size={14}/> Retry pending {pending.action}</Button>}
      {message && <p className="organization-message" role="status">{message}</p>}
    </div>
  </details>;
}
