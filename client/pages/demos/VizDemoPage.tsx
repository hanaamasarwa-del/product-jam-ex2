import { Spinner } from "../../components";
import { BudgetChart } from "../../features/budget/BudgetChart";
import { useBudgetIncome } from "../../features/budget/hooks";

/**
 * Reading data from a public API and drawing it as a chart.
 *
 * This page and the chart are loaded only when someone opens /demos/viz,
 * so the charting library costs the rest of the app nothing.
 */
export default function VizDemoPage() {
  const budget = useBudgetIncome();

  return (
    <main>
      <p>
        <strong>What is happening in this example?</strong>
      </p>
      <ul>
        <li>We are getting data from a publicly accessible API.</li>
        <li>
          When the data is loaded, we transform it into a shape our chart
          expects.
        </li>
        <li>
          We pass the transformed data into the chart so it can render to the
          UI.
        </li>
        <li>
          We created a reusable custom chart component
          (client/features/budget/BudgetChart.tsx) instead of inlining all our
          chart code here.
        </li>
        <li>
          The charting library we are using has lots of chart types, see{" "}
          <a href="https://recharts.org" target="_blank" rel="noreferrer">
            recharts.org
          </a>
          .
        </li>
      </ul>

      <h2>Israel&apos;s 2023 Budget - Income</h2>
      {budget.isPending ? (
        <Spinner />
      ) : budget.isError ? (
        <p role="alert">Could not load the data.</p>
      ) : (
        <BudgetChart data={budget.data} />
      )}
    </main>
  );
}
