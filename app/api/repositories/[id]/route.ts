import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api";
import { getRepositoryDetail } from "@/lib/repositories";
import { prisma } from "@/services/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    const { id } = await params;

    const detail = await getRepositoryDetail(id, user.id);
    if (!detail) {
      throw new ApiError(404, "NOT_FOUND", "Repository not found.");
    }

    return NextResponse.json({ repository: detail });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
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

    await prisma.repository.delete({ where: { id: repository.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
