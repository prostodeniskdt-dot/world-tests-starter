import { NextRequest, NextResponse } from "next/server";
import {
  getPairingsForIngredient,
  getRandomPairing,
  getAllMainIngredients,
  getIngredientsByCategory,
  type FlavorPairingCategory,
} from "@/lib/flavor-pairings";

const VALID_CATEGORIES: FlavorPairingCategory[] = [
  "fruits",
  "herbs_spices",
  "other",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ingredient = searchParams.get("ingredient");
    const random = searchParams.get("random");
    const list = searchParams.get("list");
    const category = searchParams.get("category");

    // Список всех основных ингредиентов
    if (list === "1") {
      const ingredients = await getAllMainIngredients();
      return NextResponse.json({ ok: true, ingredients });
    }

    // Ингредиенты по категории
    if (category && VALID_CATEGORIES.includes(category as FlavorPairingCategory)) {
      const ingredients = await getIngredientsByCategory(
        category as FlavorPairingCategory
      );
      return NextResponse.json({ ok: true, ingredients });
    }

    // Случайный ингредиент
    if (random === "1") {
      const result = await getRandomPairing();
      if (!result) {
        return NextResponse.json(
          { ok: false, error: "Данные не найдены" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, ...result });
    }

    // Сочетания для ингредиента
    if (ingredient) {
      const result = await getPairingsForIngredient(ingredient);
      if (!result) {
        return NextResponse.json(
          { ok: false, error: "Ингредиент не найден" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json(
      { ok: false, error: "Укажите ingredient, random=1, list=1 или category" },
      { status: 400 }
    );
  } catch (err) {
    console.error("flavor-pairings API error:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
