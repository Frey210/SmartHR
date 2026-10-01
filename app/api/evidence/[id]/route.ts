import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const evidence = await db.workEvidence.findFirst({
    where: { id, deletedAt: null },
    include: { attendanceSession: { select: { employeeId: true } } },
  });
  if (!evidence || (user.role !== "ADMIN" && evidence.attendanceSession.employeeId !== user.id)) {
    return new Response("Not found", { status: 404 });
  }

  const storageRoot = path.resolve(process.cwd(), "storage");
  const filePath = path.resolve(storageRoot, evidence.objectKey);
  if (!filePath.startsWith(storageRoot + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const file = await readFile(filePath);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": evidence.mimeType,
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${encodeURIComponent(evidence.originalFilename)}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
