import { useQuery } from "@tanstack/react-query";

/*
 * Data for the chart demo, from Israel's open budget site (obudget.org).
 *
 * This is the one place the app calls `fetch` directly. That is fine here:
 * it is somebody ELSE's public API, needs no key, and allows browsers to
 * call it. For our own server, always use api() from client/lib/api.ts.
 * If an external API needs a secret key, the call belongs in server/
 * instead, so the key never reaches the browser.
 */

export type BudgetRow = { name: string; amount: number };

/** One row as obudget.org sends it. Only the fields we read. */
type RawRow = {
  code: string;
  func_cls_title_2: string[];
  net_allocated: number;
};

const QUERY =
  "SELECT code, func_cls_title_2, net_allocated FROM raw_budget " +
  "WHERE code LIKE 'C8%' AND length(code)=4 AND year=2023";

const BUDGET_URL = `https://next.obudget.org/api/query?query=${encodeURIComponent(QUERY)}`;

/** The 2023 state budget's income, by category. */
export function useBudgetIncome() {
  return useQuery({
    queryKey: ["budget", "income", 2023],
    queryFn: async (): Promise<BudgetRow[]> => {
      const response = await fetch(BUDGET_URL);
      if (!response.ok) throw new Error(`obudget: ${response.status}`);
      const body = (await response.json()) as { rows: RawRow[] };

      // Reshape into exactly what the chart wants: a name and a number.
      return body.rows.map((row) => ({
        name: row.func_cls_title_2[0] ?? row.code,
        amount: row.net_allocated,
      }));
    },
    // Last year's budget is not going to change while you look at it.
    staleTime: Infinity,
  });
}

/** 7309000000 -> "7.3B ₪" */
export function formatShekels(value: number): string {
  const n = Math.abs(value);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B ₪`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M ₪`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K ₪`;
  return `${n} ₪`;
}
