import { NextResponse } from "next/server";
import { CommandError } from "@/lib/firebase-admin";
import {
  handleBootstrap, handleConfirmAward, handleConfirmFixtures, handleCreateMatch,
  handleEditMatchEvent, handleEndInnings, handleEndMatch, handleRecordCricketDelivery, handleRecordFieldSportEvent,
  handleRefreshProjections, handleSavePlayer, handleSaveTeam, handleSaveTournamentSettings, handleSelectCricketBowler,
  handleSelectNextBatter, handleSetLineup, handleSetPlacementPoints, handleSetToss, handleStartInnings, handleStartMatch,
  handleUndoLastEvent, handleUpdateMatch,
} from "@/lib/command-handlers";

export async function POST(request: Request) {
  try {
    const { command, data } = await request.json() as { command: string; data?: Record<string, unknown> };
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: { message: "Command is required.", status: "INVALID_ARGUMENT" } }, { status: 400 });
    }
    const result = await dispatch(command, data ?? {});
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof CommandError) {
      return NextResponse.json({ error: { message: error.message, status: error.code } }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Command error:", message, error instanceof Error ? error.stack : "");
    return NextResponse.json({ error: { message, status: "INTERNAL" } }, { status: 500 });
  }
}

async function dispatch(command: string, data: Record<string, unknown>): Promise<unknown> {
  switch (command) {
    case "bootstrapTournament": return handleBootstrap();
    case "saveTournamentSettings": return handleSaveTournamentSettings(data);
    case "saveTeam": return handleSaveTeam(data);
    case "savePlayer": return handleSavePlayer(data);
    case "createMatch": return handleCreateMatch(data);
    case "updateMatch": return handleUpdateMatch(data);
    case "confirmFixtures": return handleConfirmFixtures(data);
    case "setLineup": return handleSetLineup(data);
    case "setToss": return handleSetToss(data);
    case "startMatch": return handleStartMatch(data);
    case "startInnings": return handleStartInnings(data);
    case "recordCricketDelivery": return handleRecordCricketDelivery(data);
    case "selectNextBatter": return handleSelectNextBatter(data);
    case "selectCricketBowler": return handleSelectCricketBowler(data);
    case "recordFieldEvent": return handleRecordFieldSportEvent(data);
    case "editMatchEvent": return handleEditMatchEvent(data);
    case "undoLastEvent": return handleUndoLastEvent(data);
    case "endInnings": return handleEndInnings(data);
    case "endMatch": return handleEndMatch(data);
    case "confirmAward": return handleConfirmAward(data);
    case "setPlacementPoints": return handleSetPlacementPoints(data);
    case "refreshProjections": return handleRefreshProjections();
    default: throw new CommandError(400, "INVALID_ARGUMENT", `Unknown command: ${command}`);
  }
}
