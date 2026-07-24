import { NextResponse } from "next/server";
import { CommandError } from "@/lib/supabase-admin";
import {
  handleConfirmAward, handleConfirmFixtures, handleCreateActivityFixture, handleCreateMatch, handleDeleteActivityFixture, handleDeleteActivityResult, handleDeleteManualPointsAdjustment,
  handleDeleteSubmission,
  handleEditMatchEvent, handleEndInnings, handleEndMatch, handleRecordCricketDelivery, handleRecordFieldSportEvent,
  handleRecordThrowballRally,
  handleRefreshProjections, handleResolveShootoutToss, handleSaveActivityResult, handleSaveManualPointsAdjustment, handleSavePlayer, handleSaveSportPlacement, handleSaveTeam, handleSaveTeamBonus, handleSaveTournamentSettings, handleSelectCricketBowler,
  handleSelectNextBatter, handleSetPlacementPoints, handleSetToss, handleStartActivityFixture, handleStartInnings, handleStartMatch,
  handleStartShootout,
  handleUndoLastEvent, handleUpdateMatch, handleDeleteMatch,
  handleVerifyArrival,
  handleVerifyEarlyBird,
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
    console.error("Command error:", error instanceof Error ? error.message : "Unknown error", error instanceof Error ? error.stack : "");
    return NextResponse.json({ error: { message: "An unexpected server error occurred.", status: "INTERNAL" } }, { status: 500 });
  }
}

async function dispatch(command: string, data: Record<string, unknown>): Promise<unknown> {
  switch (command) {
    case "saveTournamentSettings": return handleSaveTournamentSettings(data);
    case "saveTeam": return handleSaveTeam(data);
    case "savePlayer": return handleSavePlayer(data);
    case "createMatch": return handleCreateMatch(data);
    case "updateMatch": return handleUpdateMatch(data);
    case "deleteMatch": return handleDeleteMatch(data);
    case "confirmFixtures": return handleConfirmFixtures(data);
    case "setToss": return handleSetToss(data);
    case "startMatch": return handleStartMatch(data);
    case "startShootout": return handleStartShootout(data);
    case "startInnings": return handleStartInnings(data);
    case "recordCricketDelivery": return handleRecordCricketDelivery(data);
    case "selectNextBatter": return handleSelectNextBatter(data);
    case "selectCricketBowler": return handleSelectCricketBowler(data);
    case "recordFieldEvent": return handleRecordFieldSportEvent(data);
    case "resolveShootoutToss": return handleResolveShootoutToss(data);
    case "recordThrowballRally": return handleRecordThrowballRally(data);
    case "editMatchEvent": return handleEditMatchEvent(data);
    case "undoLastEvent": return handleUndoLastEvent(data);
    case "endInnings": return handleEndInnings(data);
    case "endMatch": return handleEndMatch(data);
    case "confirmAward": return handleConfirmAward(data);
    case "saveActivityResult": return handleSaveActivityResult(data);
    case "deleteActivityResult": return handleDeleteActivityResult(data);
    case "deleteActivityFixture": return handleDeleteActivityFixture(data);
    case "createActivityFixture": return handleCreateActivityFixture(data);
    case "startActivityFixture": return handleStartActivityFixture(data);
    case "saveTeamBonus": return handleSaveTeamBonus(data);
    case "saveManualPointsAdjustment": return handleSaveManualPointsAdjustment(data);
    case "deleteManualPointsAdjustment": return handleDeleteManualPointsAdjustment(data);
    case "saveSportPlacement": return handleSaveSportPlacement(data);
    case "setPlacementPoints": return handleSetPlacementPoints(data);
    case "verifyArrival": return handleVerifyArrival(data);
    case "verifyEarlyBird": return handleVerifyEarlyBird(data);
    case "deleteSubmission": return handleDeleteSubmission(data);
    case "refreshProjections": return handleRefreshProjections();
    default: throw new CommandError(400, "INVALID_ARGUMENT", `Unknown command: ${command}`);
  }
}
