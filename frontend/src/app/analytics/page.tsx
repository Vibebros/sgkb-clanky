"use client";

import { AreaChart, Card } from "@tremor/react";
import { useEffect, useMemo, useState } from "react";

type MonthlyTotal = {
  month: string;
  total: number;
  percentage: number;
};

type BankTransaction = {
  accountName: string;
  textCreditor: string;
  amount: number;
  valDate: string;
  direction: number;
};

const ANALYTICS_QUERY = `
  query Analytics($startDate: Date) {
    monthlyTotals {
      month
      total
      percentage
    }
    bankTransactions(startDate: $startDate) {
      accountName
      textCreditor
      textShortCreditor
      amount
      valDate
      direction
    }
  }
`;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatMonthLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

type GraphQLMonthlyTotal = {
  month?: string | null;
  total?: number | string | null;
  percentage?: number | string | null;
};

type GraphQLTransaction = {
  accountName?: string | null;
  textCreditor?: string | null;
  textShortCreditor?: string | null;
  amount?: number | string | null;
  valDate?: string | null;
  direction?: number | string | null;
};

export default function AnalyticsPage() {
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    BankTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        const startDateFormatted = startDate.toISOString().split("T")[0];

        const response = await fetch("http://127.0.0.1:8000/graphql/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: ANALYTICS_QUERY,
            variables: { startDate: startDateFormatted },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load analytics data");
        }

        const result = await response.json();

        if (result.errors?.length) {
          throw new Error(
            result.errors[0]?.message ?? "Unexpected GraphQL error",
          );
        }

        const rawMonthly = Array.isArray(result.data?.monthlyTotals)
          ? result.data.monthlyTotals
          : [];
        const rawTransactions = Array.isArray(result.data?.bankTransactions)
          ? result.data.bankTransactions
          : [];

        const normalizedMonthly: MonthlyTotal[] = rawMonthly
          .map((item: GraphQLMonthlyTotal) => ({
            month: item?.month ?? "",
            total:
              typeof item?.total === "number"
                ? item.total
                : parseFloat(item?.total ?? "0"),
            percentage:
              typeof item?.percentage === "number"
                ? item.percentage
                : parseFloat(item?.percentage ?? "0"),
          }))
          .filter((item) => item.month && Number.isFinite(item.total));

        const normalizedTransactions: BankTransaction[] = rawTransactions
          .map((item: GraphQLTransaction) => ({
            accountName: item?.accountName ?? "—",
            textCreditor:
              item?.textCreditor?.trim() ||
              item?.textShortCreditor?.trim() ||
              "—",
            amount:
              typeof item?.amount === "number"
                ? item.amount
                : parseFloat(item?.amount ?? "0"),
            valDate: item?.valDate ?? "",
            direction:
              typeof item?.direction === "number"
                ? item.direction
                : Number(item?.direction ?? 0),
          }))
          .filter((item) => item.valDate && Number.isFinite(item.amount));

        const sortedMonthly = normalizedMonthly.sort(
          (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
        );

        const sortedTransactions = normalizedTransactions.sort(
          (a, b) =>
            new Date(b.valDate).getTime() - new Date(a.valDate).getTime(),
        );

        setMonthlyTotals(sortedMonthly);
        setRecentTransactions(sortedTransactions);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error ? fetchError.message : "Unknown error",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const chartData = useMemo(
    () =>
      monthlyTotals.map((item) => ({
        month: formatMonthLabel(item.month),
        total: item.total,
      })),
    [monthlyTotals],
  );

  const totalVolume = useMemo(
    () => monthlyTotals.reduce((sum, item) => sum + item.total, 0),
    [monthlyTotals],
  );

  const averageMonthly = useMemo(
    () => (monthlyTotals.length ? totalVolume / monthlyTotals.length : 0),
    [monthlyTotals, totalVolume],
  );

  const latestMonth = monthlyTotals.at(-1);
  const previousMonth =
    monthlyTotals.length > 1
      ? monthlyTotals[monthlyTotals.length - 2]
      : undefined;
  const monthOverMonthChange =
    latestMonth && previousMonth ? latestMonth.total - previousMonth.total : 0;
  const monthOverMonthPercentage =
    latestMonth && previousMonth && previousMonth.total !== 0
      ? (monthOverMonthChange / previousMonth.total) * 100
      : 0;

  const bestMonth = useMemo(() => {
    if (!monthlyTotals.length) return null;
    return monthlyTotals.reduce((best, item) =>
      item.total > best.total ? item : best,
    );
  }, [monthlyTotals]);

  const { totalInflow, totalOutflow, netFlow } = useMemo(() => {
    return recentTransactions.reduce(
      (acc, transaction) => {
        if (transaction.direction === 1) {
          acc.totalInflow += transaction.amount;
        } else if (transaction.direction === 2) {
          acc.totalOutflow += transaction.amount;
        }
        acc.netFlow = acc.totalInflow - acc.totalOutflow;
        return acc;
      },
      { totalInflow: 0, totalOutflow: 0, netFlow: 0 },
    );
  }, [recentTransactions]);

  const topMerchants = useMemo(() => {
    const totals = new Map<string, number>();

    recentTransactions.forEach((transaction) => {
      if (transaction.direction !== 2) return;
      const key = transaction.textCreditor || "—";
      totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
    });

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [recentTransactions]);

  const recentFive = useMemo(
    () => recentTransactions.slice(0, 5),
    [recentTransactions],
  );

  return (
    <div className="px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track volume trends, inflow vs. outflow, and top merchants from your
          recent activity.
        </p>
      </div>

      {loading && <div className="text-gray-600">Loading analytics…</div>}
      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">12-month volume</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatCurrency(totalVolume)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Avg. monthly {formatCurrency(averageMonthly)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Latest month</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {latestMonth ? formatCurrency(latestMonth.total) : "—"}
              </p>
              {latestMonth && (
                <p
                  className={`mt-1 text-xs ${monthOverMonthChange >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {monthOverMonthChange >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(monthOverMonthChange))} vs. prior
                  month
                  {latestMonth && previousMonth && (
                    <span className="ml-1">
                      ({monthOverMonthPercentage >= 0 ? "+" : ""}
                      {monthOverMonthPercentage.toFixed(1)}%)
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Net flow (90 days)</p>
              <p
                className={`mt-2 text-2xl font-semibold ${netFlow >= 0 ? "text-green-700" : "text-red-600"}`}
              >
                {formatCurrency(netFlow)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {`Inflow ${formatCurrency(totalInflow)} · Outflow ${formatCurrency(totalOutflow)}`}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Best month</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {bestMonth ? formatCurrency(bestMonth.total) : "—"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {bestMonth ? formatMonthLabel(bestMonth.month) : "No data"}
              </p>
            </div>
          </section>

          <section>
            <Card className="sm:mx-auto sm:max-w-none">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Monthly trend
                  </h2>
                  <p className="text-sm text-gray-500">
                    Rolling volume for the past periods
                  </p>
                </div>
              </div>
              <AreaChart
                className="mt-6 h-64"
                data={chartData}
                index="month"
                categories={["total"]}
                colors={["#628447"]}
                showLegend={false}
                valueFormatter={(value) => formatCurrency(value)}
                startEndOnly
                showYAxis={false}
                showGradient
              />
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Monthly breakdown
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Performance for each reporting month
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Month</th>
                      <th className="px-4 py-2 text-right">Volume</th>
                      <th className="px-4 py-2 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {monthlyTotals.map((item) => (
                      <tr key={item.month}>
                        <td className="px-4 py-2 text-gray-700">
                          {formatMonthLabel(item.month)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-500">
                          {item.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    {!monthlyTotals.length && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          No monthly data available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Top merchants (90 days)
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aggregated spend by merchant
                </p>
                <ul className="mt-4 space-y-3">
                  {topMerchants.map(([merchant, amount]) => (
                    <li
                      key={merchant}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate pr-4 text-gray-700">
                        {merchant}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(amount)}
                      </span>
                    </li>
                  ))}
                  {!topMerchants.length && (
                    <li className="text-sm text-gray-500">
                      Not enough transaction data yet.
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Latest transactions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Most recent entries in the ledger
                </p>
                <div className="mt-4 space-y-3">
                  {recentFive.map((transaction, index) => (
                    <div
                      key={`${transaction.valDate}-${index}`}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {transaction.textCreditor}
                        </span>
                        <span
                          className={`text-sm font-semibold ${transaction.direction === 1 ? "text-green-700" : "text-red-600"}`}
                        >
                          {transaction.direction === 1 ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-500">
                        <span>{transaction.accountName}</span>
                        <span>{formatDate(transaction.valDate)}</span>
                      </div>
                    </div>
                  ))}
                  {!recentFive.length && (
                    <p className="text-sm text-gray-500">
                      No transactions in the selected period.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
