"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import * as XLSX from "xlsx";

import { importProductsAction, type ImportProductsActionResult } from "@/actions/import-products-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { productImportRowSchema, type ProductImportDraftRow } from "@/lib/validation/product-import";
import { mapOrderMode, mapUnit, normalizeProductCode } from "@/lib/utils/product-import";

interface PreviewRow {
  rowNumber: number;
  draft: ProductImportDraftRow;
  normalizedCode: string;
  errors: string[];
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getValueByHeader(row: Record<string, unknown>, headerName: string): unknown {
  const expected = normalizeHeader(headerName);

  for (const [key, value] of Object.entries(row)) {
    if (normalizeHeader(key) === expected) {
      return value;
    }
  }

  return "";
}

function toDraftRow(rawRow: Record<string, unknown>): ProductImportDraftRow {
  return {
    code: String(getValueByHeader(rawRow, "code") ?? ""),
    name: String(getValueByHeader(rawRow, "name") ?? ""),
    category: String(getValueByHeader(rawRow, "category") ?? ""),
    unitsPerBox: getValueByHeader(rawRow, "unitsPerBox") as number | string,
    unitsPerPack: getValueByHeader(rawRow, "unitsPerPack") as number | string,
    unit: String(getValueByHeader(rawRow, "unit") ?? ""),
    consumptionRate: getValueByHeader(rawRow, "consumptionRate") as number | string,
    orderMode: String(getValueByHeader(rawRow, "orderMode") ?? ""),
    orderStep: getValueByHeader(rawRow, "orderStep") as number | string,
  };
}

export function ProductsImportForm() {
  const { toast } = useToast();
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [report, setReport] = useState<ImportProductsActionResult | null>(null);
  const [isImporting, startImportTransition] = useTransition();

  const previewStats = useMemo(() => {
    const withErrors = previewRows.filter((row) => row.errors.length > 0).length;
    const valid = previewRows.length - withErrors;

    return {
      total: previewRows.length,
      valid,
      invalid: withErrors,
    };
  }, [previewRows]);

  const parseFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("Файл не содержит листов");
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

    if (rawRows.length === 0) {
      throw new Error("Файл пустой");
    }

    const rows: PreviewRow[] = rawRows.map((rawRow, index) => {
      const draft = toDraftRow(rawRow);
      const errors: string[] = [];

      const parsed = productImportRowSchema.safeParse(draft);

      if (!parsed.success) {
        errors.push(parsed.error.issues[0]?.message ?? "Ошибка валидации строки");
      } else {
        if (!mapUnit(parsed.data.unit)) {
          errors.push("Неверная единица измерения (unit)");
        }

        if (!mapOrderMode(parsed.data.orderMode)) {
          errors.push("Неверный режим заказа (orderMode)");
        }
      }

      return {
        rowNumber: index + 2,
        draft,
        normalizedCode: normalizeProductCode(draft.code),
        errors,
      };
    });

    const duplicatesCount = new Map<string, number>();

    for (const row of rows) {
      if (!row.normalizedCode) {
        continue;
      }

      duplicatesCount.set(row.normalizedCode, (duplicatesCount.get(row.normalizedCode) ?? 0) + 1);
    }

    for (const row of rows) {
      if (row.normalizedCode && (duplicatesCount.get(row.normalizedCode) ?? 0) > 1) {
        row.errors.push("Дубликат code в файле");
      }
    }

    return rows;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setReport(null);

    try {
      const rows = await parseFile(file);
      setPreviewRows(rows);
      setFileName(file.name);
      toast({
        type: "success",
        title: "Файл загружен",
        description: `Строк для предпросмотра: ${rows.length}`,
      });
    } catch (error) {
      setPreviewRows([]);
      setFileName("");
      toast({
        type: "error",
        title: "Ошибка чтения файла",
        description: error instanceof Error ? error.message : "Не удалось распарсить xlsx-файл",
      });
    }
  };

  const handleImport = () => {
    if (previewRows.length === 0) {
      toast({
        type: "error",
        title: "Нет данных для импорта",
      });
      return;
    }

    startImportTransition(async () => {
      const result = await importProductsAction(previewRows.map((row) => row.draft));
      setReport(result);

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Импорт завершён" : "Импорт завершён с ошибками",
        description: `Добавлено: ${result.added}, Обновлено: ${result.updated}, Пропущено: ${result.skipped}`,
      });
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Импорт справочника товаров из Excel</CardTitle>
          <CardDescription>
            Поддерживается формат .xlsx с колонками: code, name, category, unitsPerBox, unitsPerPack, unit,
            consumptionRate, orderMode, orderStep.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block rounded-lg border border-[var(--bk-border)] bg-white px-3 py-2 text-sm"
            />
            <Button type="button" onClick={handleImport} loading={isImporting}>
              Импортировать
            </Button>
          </div>
          {fileName ? <p className="text-sm text-[var(--bk-text-muted)]">Файл: {fileName}</p> : null}
          {previewRows.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-3">
              <p className="rounded-lg bg-[var(--bk-surface)] px-3 py-2 text-sm">Всего строк: {previewStats.total}</p>
              <p className="rounded-lg bg-[var(--bk-success-soft)] px-3 py-2 text-sm">Валидных: {previewStats.valid}</p>
              <p className="rounded-lg bg-[var(--bk-danger-soft)] px-3 py-2 text-sm">С ошибками: {previewStats.invalid}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {report ? (
        <Card>
          <CardHeader>
            <CardTitle>Отчёт по импорту</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              <p className="rounded-lg bg-[var(--bk-success-soft)] px-3 py-2 text-sm">Добавлено: {report.added}</p>
              <p className="rounded-lg bg-[var(--bk-surface)] px-3 py-2 text-sm">Обновлено: {report.updated}</p>
              <p className="rounded-lg bg-[var(--bk-warning-soft)] px-3 py-2 text-sm">Пропущено: {report.skipped}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {previewRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Предпросмотр перед импортом</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[65vh] overflow-auto rounded-2xl border border-[var(--bk-border)] bg-white">
              <table className="min-w-[1280px] w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--bk-surface)]">
                  <tr>
                    <th className="px-3 py-2 text-left">Строка</th>
                    <th className="px-3 py-2 text-left">code</th>
                    <th className="px-3 py-2 text-left">name</th>
                    <th className="px-3 py-2 text-left">category</th>
                    <th className="px-3 py-2 text-right">unitsPerBox</th>
                    <th className="px-3 py-2 text-right">unitsPerPack</th>
                    <th className="px-3 py-2 text-left">unit</th>
                    <th className="px-3 py-2 text-right">consumptionRate</th>
                    <th className="px-3 py-2 text-left">orderMode</th>
                    <th className="px-3 py-2 text-right">orderStep</th>
                    <th className="px-3 py-2 text-left">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.normalizedCode}`} className="border-t border-[var(--bk-border)]">
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.draft.code}</td>
                      <td className="px-3 py-2">{row.draft.name}</td>
                      <td className="px-3 py-2">{row.draft.category}</td>
                      <td className="px-3 py-2 text-right">{String(row.draft.unitsPerBox)}</td>
                      <td className="px-3 py-2 text-right">{String(row.draft.unitsPerPack)}</td>
                      <td className="px-3 py-2">{row.draft.unit}</td>
                      <td className="px-3 py-2 text-right">{String(row.draft.consumptionRate)}</td>
                      <td className="px-3 py-2">{row.draft.orderMode}</td>
                      <td className="px-3 py-2 text-right">{String(row.draft.orderStep)}</td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 ? (
                          <span className="text-xs font-semibold text-[var(--bk-danger)]">{row.errors.join("; ")}</span>
                        ) : (
                          <span className="text-xs font-semibold text-[var(--bk-success)]">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
