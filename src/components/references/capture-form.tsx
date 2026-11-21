"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { createReferenceAction, updateReferenceAction } from "@/app/(workspace)/references/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Choice = { id: string; displayName: string };
type Feedback = Extract<Awaited<ReturnType<typeof createReferenceAction>>, { ok: false }>;
const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring aria-invalid:border-destructive";

type SavedReference = {
  id: string; revision: number; url: string; title: string; description: string;
  collectionId: string | null; tagIds: string[];
};

export function ReferenceCaptureForm({ collections, tags, first, reference }: {
  collections: Choice[]; tags: Choice[]; first?: boolean; reference?: SavedReference;
}) {
  const router = useRouter();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const request = useRef<{ id: string; payload: string } | null>(null);
  const inFlight = useRef(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>();
  const [url, setUrl] = useState(reference?.url ?? "");
  const [title, setTitle] = useState(reference?.title ?? "");
  const [description, setDescription] = useState(reference?.description ?? "");
  const [collectionId, setCollectionId] = useState(reference?.collectionId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(reference?.tagIds ?? []);
  const [expectedRevision, setExpectedRevision] = useState(reference?.revision);
  const uncertain = feedback?.retrySameRequest === true;

  function openForm(next: boolean) {
    if (inFlight.current || uncertain) return;
    if (next && reference && !feedback) {
      setUrl(reference.url);
      setTitle(reference.title);
      setDescription(reference.description);
      setCollectionId(reference.collectionId ?? "");
      setTagIds(reference.tagIds);
      setExpectedRevision(reference.revision);
    }
    setOpen(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFeedback(undefined);
    const fields = { url, title, description, collectionId: collectionId || null, tagIds: [...tagIds].sort() };
    const payload = JSON.stringify(fields);

    try {
      if (request.current?.payload !== payload) request.current = { id: crypto.randomUUID(), payload };
      const input = { ...fields, mutationId: request.current.id };
      const result = reference
        ? await updateReferenceAction({ ...input, referenceId: reference.id, expectedRevision: expectedRevision! })
        : await createReferenceAction(input);
      if (!result.ok) {
        setFeedback(result);
        if (!result.retrySameRequest) request.current = null;
        return;
      }
      request.current = null;
      setUrl("");
      setTitle("");
      setDescription("");
      setCollectionId("");
      setTagIds([]);
      setOpen(false);
      if (reference) router.refresh();
      else router.push(`/references/${result.referenceId}`);
    } catch {
      setFeedback({ ok: false, message: "The save could not be confirmed. Retry to check whether it completed.", retrySameRequest: true });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={openForm}>
      <SheetTrigger render={<Button ref={trigger} size="lg" />}>
        {reference ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}{reference ? "Edit reference" : first ? "Save your first reference" : "Add reference"}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        initialFocus={urlInput}
        finalFocus={trigger}
        className="max-h-[90dvh] overflow-y-auto rounded-t-2xl p-5 motion-reduce:transition-none sm:top-1/2 sm:data-[side=bottom]:right-auto sm:data-[side=bottom]:bottom-auto sm:data-[side=bottom]:left-1/2 sm:w-[min(36rem,calc(100vw-3rem))] sm:-translate-1/2 sm:data-[side=bottom]:data-starting-style:-translate-y-1/2 sm:data-[side=bottom]:data-ending-style:-translate-y-1/2 sm:rounded-2xl sm:border sm:p-6"
      >
        <div>
          <SheetTitle className="text-xl">{reference ? "Edit reference" : "Add reference"}</SheetTitle>
          <SheetDescription>{reference ? "Update the address, description, or organization." : "Save a web address and the context you want to remember."}</SheetDescription>
        </div>
        <form onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={busy || uncertain} className="min-w-0 space-y-4">
            <label className="block space-y-1.5">
              <span className="font-medium">Website URL</span>
              <input ref={urlInput} className={inputClass} type="text" inputMode="url" autoComplete="url" required placeholder="https://example.com" value={url} onChange={(event) => setUrl(event.target.value)} aria-invalid={feedback?.field === "url"} aria-describedby={feedback?.field === "url" ? id : undefined} />
            </label>
            <label className="block space-y-1.5">
              <span className="font-medium">Title</span>
              <input className={inputClass} required value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={feedback?.field === "title"} aria-describedby={feedback?.field === "title" ? id : undefined} />
            </label>
            <label className="block space-y-1.5">
              <span className="font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></span>
              <textarea className={inputClass} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={feedback?.field === "description"} aria-describedby={feedback?.field === "description" ? id : undefined} />
            </label>
            {collections.length > 0 && (
              <label className="block space-y-1.5">
                <span className="font-medium">Collection</span>
                <select className={inputClass} value={collectionId} onChange={(event) => setCollectionId(event.target.value)} aria-invalid={feedback?.field === "collectionId"} aria-describedby={feedback?.field === "collectionId" ? id : undefined}>
                  <option value="">No collection</option>
                  {collections.map((choice) => <option key={choice.id} value={choice.id}>{choice.displayName}</option>)}
                </select>
              </label>
            )}
            {tags.length > 0 && (
              <fieldset className="min-w-0" aria-describedby={feedback?.field === "tagIds" ? id : undefined}>
                <legend className="mb-1.5 font-medium">Tags <span className="font-normal text-muted-foreground">(up to 20)</span></legend>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto p-1">
                  {tags.map((tag) => {
                    const checked = tagIds.includes(tag.id);
                    return <label key={tag.id} className="flex min-w-0 items-center gap-2 rounded-md border border-border px-2.5 py-1.5 break-all">
                      <input type="checkbox" checked={checked} disabled={!checked && tagIds.length >= 20} onChange={(event) => {
                        setTagIds(event.target.checked ? [...tagIds, tag.id] : tagIds.filter((value) => value !== tag.id));
                      }} />{tag.displayName}
                    </label>;
                  })}
                </div>
              </fieldset>
            )}
          </fieldset>
          {feedback && <div id={id} role="alert" className="mt-4 rounded-lg border border-destructive/40 p-3">
            <p>{feedback.message}</p>
            {feedback.conflict && reference && (
              <div className="mt-2 space-y-2">
                <Link className="text-primary underline" href={`/references/${reference.id}`} target="_blank" prefetch={false}>Review saved reference in a new tab</Link>
                {reference.revision === expectedRevision ? (
                  <Button type="button" variant="outline" onClick={() => router.refresh()}>Check latest revision</Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => {
                    setExpectedRevision(reference.revision);
                    setFeedback(undefined);
                  }}>Keep editing my draft using the latest revision</Button>
                )}
              </div>
            )}
            {feedback.existingReferenceId && <Link className="mt-1 inline-block text-primary underline" href={`/references/${feedback.existingReferenceId}`} prefetch={false}>Open saved reference</Link>}
          </div>}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button type="button" size="lg" variant="outline" disabled={busy || uncertain} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="lg" disabled={busy || !!feedback?.conflict}>{busy ? "Saving…" : uncertain ? "Retry save" : "Save reference"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
