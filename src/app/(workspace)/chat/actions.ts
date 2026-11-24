"use server";

import { redirect } from "next/navigation";
import { deleteChat, saveQuestion } from "@/lib/chat/history";

export async function submitChatQuestion(form: FormData) {
  const id = String(form.get("conversationId") ?? "");
  const submission = String(form.get("submissionId") ?? "");
  const question = String(form.get("question") ?? "").trim();
  const saved = await saveQuestion(id, submission, question, form.get("create") === "true");
  redirect(saved ? `/chat?id=${id}` : "/chat?error=save");
}

export async function removeChat(form: FormData) {
  await deleteChat(String(form.get("conversationId") ?? ""));
  redirect("/chat");
}
