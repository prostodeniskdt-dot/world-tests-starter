import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  try {
    // Получаем данные и общее количество за один запрос не получится красиво,
    // поэтому делаем два запроса
    const [dataResult, countResult] = await Promise.all([
      db.query(
        `SELECT * FROM leaderboard ORDER BY rank ASC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.query(`SELECT COUNT(*) AS count FROM leaderboard`),
    ]);

    const data = dataResult.rows;
    const count = parseInt(countResult.rows[0]?.count || "0", 10);
    const totalPages = count ? Math.ceil(count / limit) : 1;

    return NextResponse.json({
      ok: true,
      rows: data ?? [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
