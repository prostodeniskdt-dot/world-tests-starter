import { NextRequest, NextResponse } from "next/server";
import { getPairingsForIngredient } from "@/lib/flavor-pairings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];

    if (ingredients.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Передайте массив ingredients" },
        { status: 400 }
      );
    }

    const pairings: Record<string, { pairedIngredients: string[] }> = {};
    for (const ing of ingredients) {
      const name = String(ing).trim();
      if (!name) continue;
      const result = await getPairingsForIngredient(name);
      pairings[name] = {
        pairedIngredients: result?.pairedIngredients ?? [],
      };
    }

    return NextResponse.json({ ok: true, pairings });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
