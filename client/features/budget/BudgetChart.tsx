import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DIRECTION } from "../../lib/config";
import { formatShekels, type BudgetRow } from "./hooks";

/**
 * A bar chart of the budget, drawn with Recharts (https://recharts.org).
 * Recharts has many more chart types - swap BarChart for LineChart, PieChart
 * and so on, with the same data.
 *
 * Colours are passed as var(--...) so the chart follows tokens.css like
 * everything else. In a right-to-left app the bars run right to left too.
 */
export function BudgetChart({ data }: { data: BudgetRow[] }) {
  const rtl = DIRECTION === "rtl";

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="name" reversed={rtl} />
        <YAxis
          orientation={rtl ? "right" : "left"}
          tickFormatter={formatShekels}
          width={80}
        />
        <Tooltip
          formatter={(value) => formatShekels(Number(value))}
          cursor={{ fill: "var(--color-surface-hover)" }}
        />
        <Bar
          dataKey="amount"
          name="Amount"
          fill="var(--color-accent)"
          activeBar={{ fill: "var(--color-accent-hover)" }}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
