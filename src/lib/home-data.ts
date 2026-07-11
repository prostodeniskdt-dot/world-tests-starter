import "server-only";
import { db } from "@/lib/db";

export type CommunityItem = {
  id: string;
  kind: "Статья" | "Коктейль" | "Заготовка";
  title: string;
  description: string | null;
  href: string;
  imageUrl: string | null;
  createdAt: string;
};

export type CommunityLeader = {
  userId: string;
  displayName: string;
  totalPoints: number;
  testsCompleted: number;
  rank: number;
};

export type HomeData = {
  latest: CommunityItem[];
  leaders: CommunityLeader[];
};

type QueryTask<T> = {
  name: string;
  run: () => Promise<T[]>;
};

async function settleQueries<T>(tasks: QueryTask<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(tasks.map((task) => task.run()));
  return results.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`Homepage ${tasks[index].name} query failed:`, result.reason);
    return [];
  });
}

export async function getHomeData(): Promise<HomeData> {
  const latestTasks: QueryTask<CommunityItem>[] = [
    {
      name: "knowledge",
      run: async () => {
        const { rows } = await db.query(
          `SELECT id, title, slug, excerpt, cover_image_url, created_at
           FROM knowledge_articles
           WHERE is_published = true
           ORDER BY created_at DESC
           LIMIT 2`
        );
        return rows.map((row) => ({
          id: `knowledge-${row.id}`,
          kind: "Статья" as const,
          title: String(row.title),
          description: row.excerpt ? String(row.excerpt) : null,
          href: `/knowledge/${encodeURIComponent(String(row.slug))}`,
          imageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
          createdAt: String(row.created_at),
        }));
      },
    },
    {
      name: "cocktails",
      run: async () => {
        const { rows } = await db.query(
          `SELECT id, name, slug, description, image_url, created_at
           FROM cocktails
           WHERE is_published = true
           ORDER BY created_at DESC
           LIMIT 2`
        );
        return rows.map((row) => ({
          id: `cocktail-${row.id}`,
          kind: "Коктейль" as const,
          title: String(row.name),
          description: row.description ? String(row.description) : null,
          href: `/cocktails/${encodeURIComponent(String(row.slug))}`,
          imageUrl: row.image_url ? String(row.image_url) : null,
          createdAt: String(row.created_at),
        }));
      },
    },
    {
      name: "preps",
      run: async () => {
        const { rows } = await db.query(
          `SELECT id, name, slug, composition, image_url, created_at
           FROM preps
           WHERE is_published = true
           ORDER BY created_at DESC
           LIMIT 2`
        );
        return rows.map((row) => ({
          id: `prep-${row.id}`,
          kind: "Заготовка" as const,
          title: String(row.name),
          description: row.composition ? String(row.composition) : null,
          href: `/preps/${encodeURIComponent(String(row.slug))}`,
          imageUrl: row.image_url ? String(row.image_url) : null,
          createdAt: String(row.created_at),
        }));
      },
    },
  ];

  const [latest, leadersResult] = await Promise.all([
    settleQueries(latestTasks),
    db
      .query(
        `SELECT user_id, display_name, total_points, tests_completed, rank
         FROM leaderboard
         ORDER BY rank ASC
         LIMIT 3`
      )
      .catch((error) => {
        console.error("Homepage leaderboard query failed:", error);
        return { rows: [] };
      }),
  ]);

  const leaders = leadersResult.rows.map((row) => ({
    userId: String(row.user_id),
    displayName: String(row.display_name || "Участник"),
    totalPoints: Number(row.total_points) || 0,
    testsCompleted: Number(row.tests_completed) || 0,
    rank: Number(row.rank) || 0,
  }));

  return {
    latest: latest
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 6),
    leaders,
  };
}
