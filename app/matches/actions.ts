"use server";

import { refresh } from "next/cache";

import type { MatchSide } from "@/lib/listing";
import {
  completeMatch,
  declineMatch,
  isMatchId,
  markMatchAsContacted,
} from "@/services/matches";

export type MatchActionResult = { ok: boolean };

function isSide(value: unknown): value is MatchSide {
  return value === "buyer" || value === "seller";
}

function describeError(error: unknown) {
  if (error && typeof error === "object") {
    const { code, message, details, hint } = error as Record<string, unknown>;
    return JSON.stringify({ code, message, details, hint });
  }

  return String(error);
}

export async function startContact(
  matchId: string,
): Promise<MatchActionResult> {
  if (!isMatchId(matchId)) return { ok: false };

  try {
    await markMatchAsContacted(matchId);
  } catch (error) {
    console.error("Erro ao registrar contato", describeError(error));
    return { ok: false };
  }

  refresh();
  return { ok: true };
}

export async function rejectMatch(matchId: string): Promise<MatchActionResult> {
  if (!isMatchId(matchId)) return { ok: false };

  try {
    await declineMatch(matchId);
  } catch (error) {
    console.error("Erro ao recusar match", describeError(error));
    return { ok: false };
  }

  refresh();
  return { ok: true };
}

export async function confirmDeal(
  matchId: string,
  side: MatchSide,
): Promise<MatchActionResult> {
  if (!isMatchId(matchId) || !isSide(side)) return { ok: false };

  try {
    const completed = await completeMatch(matchId, side);
    if (!completed) return { ok: false };
  } catch (error) {
    console.error("Erro ao concluir match", describeError(error));
    return { ok: false };
  }

  refresh();
  return { ok: true };
}
