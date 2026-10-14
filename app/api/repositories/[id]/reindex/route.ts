import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api";
import { startIngestion } from "@/lib/ingestion/runner";
import { prisma } from "@/services/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    const { id } = await params;

    const repository = await prisma.repository.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!repository) {
      throw new ApiError(404, "NOT_FOUND", "Repository not found.");
    }

    const { jobId, alreadyRunning } = await startIngestion(repository.id, user.id);

    return NextResponse.json({ jobId, alreadyRunning }, { status: 202 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
