"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { answerChatQuestion, deleteChat, saveQuestion } from "@/lib/chat/history";

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


export async function requestChatAnswer(form: FormData) {
  const id = String(form.get("conversationId") ?? "");
  const turn = String(form.get("turnId") ?? "");
  let status = "unavailable";
  try {
    if (form.get("groqConsent") === "on") status = await answerChatQuestion(id, turn) ?? "unavailable";
  } catch (error) {
    unstable_rethrow(error);
  }
  redirect(`/chat?${new URLSearchParams({ id, status })}`);
}
