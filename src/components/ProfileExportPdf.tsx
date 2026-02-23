"use client";

import { useCallback } from "react";
import { FileDown } from "lucide-react";

type Attempt = {
  id: string;
  test_id: string;
  test_title: string;
  score_percent: number;
  points_awarded: number;
  created_at: string;
};

type ProfileExportPdfProps = {
  attempts: Attempt[];
  userName: string;
};

export function ProfileExportPdf({ attempts, userName }: ProfileExportPdfProps) {
  const handleExport = useCallback(async () => {
    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    const pdfFonts = await import("pdfmake/build/vfs_fonts");
    const fonts = pdfFonts.default;
    if (typeof pdfMake.addVirtualFileSystem === "function") {
      pdfMake.addVirtualFileSystem(fonts);
    } else if (fonts?.pdfMake?.vfs) {
      pdfMake.vfs = fonts.pdfMake.vfs;
    }

    const body = attempts.map((a) => [
      new Date(a.created_at).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      a.test_title,
      `${a.score_percent}%`,
      `+${a.points_awarded}`,
    ]);

    const doc = {
      pageSize: "A4",
      defaultStyle: { font: "Roboto", fontSize: 10 },
      content: [
        { text: "История попыток", style: "header", fontSize: 16 },
        { text: userName || "Пользователь", fontSize: 12, margin: [0, 0, 0, 8] },
        {
          text: `Экспорт: ${new Date().toLocaleDateString("ru-RU")}`,
          fontSize: 9,
          color: "#666",
          margin: [0, 0, 0, 12],
        },
        {
          table: {
            headerRows: 1,
            widths: [90, "*", 50, 50],
            body: [
              [
                { text: "Дата", style: "tableHeader" },
                { text: "Тест", style: "tableHeader" },
                { text: "Результат", style: "tableHeader" },
                { text: "Очки", style: "tableHeader" },
              ],
              ...body.map((row) => row.map((cell) => ({ text: String(cell) }))),
            ],
          },
          layout: "lightHorizontalLines",
        },
      ],
      styles: {
        header: { bold: true },
        tableHeader: { bold: true, fillColor: "#f5f5f5" },
      },
    };

    pdfMake.createPdf(doc).download("history-attempts.pdf");
  }, [attempts, userName]);

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      <FileDown className="h-4 w-4" />
      Экспорт PDF
    </button>
  );
}
