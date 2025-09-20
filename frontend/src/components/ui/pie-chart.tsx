"use client";

import { Card, DonutChart, List, ListItem } from "@tremor/react";

import { cn } from "@/lib/utils";

export interface ExpenseCategory {
  name: string;
  amount: number;
  share: string;
  color: string;
}

export const expenseCategories: ExpenseCategory[] = [
  {
    name: "Travel",
    amount: 6730,
    share: "32.1%",
    color: "bg-green-600",
  },
  {
    name: "IT & equipment",
    amount: 4120,
    share: "19.6%",
    color: "bg-green-500",
  },
  {
    name: "Training & development",
    amount: 3920,
    share: "18.6%",
    color: "bg-green-400",
  },
  {
    name: "Office supplies",
    amount: 3210,
    share: "15.3%",
    color: "bg-green-300",
  },
  {
    name: "Communication",
    amount: 3010,
    share: "14.3%",
    color: "bg-green-200",
  },
];

export const currencyFormatter = (value: number) => {
  return `$${Intl.NumberFormat("us").format(value)}`;
};

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface PieChartProps {
  cardClassName?: string;
  chartClassName?: string;
  title?: string;
  titleClassName?: string;
  listHeaderClassName?: string;
  listWrapperClassName?: string;
  listClassName?: string;
}

export default function PieChart({
  cardClassName,
  chartClassName,
  title = "Total expenses by category",
  titleClassName,
  listHeaderClassName,
  listWrapperClassName,
  listClassName,
}: PieChartProps = {}) {
  return (
    <Card className={cn("w-full sm:max-w-lg sm:mx-auto", cardClassName)}>
      <h3
        className={cn(
          "text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong",
          titleClassName,
        )}
      >
        {title}
      </h3>
      <DonutChart
        className={cn("mt-8 h-80", chartClassName)}
        data={expenseCategories}
        category="amount"
        index="name"
        valueFormatter={currencyFormatter}
        showTooltip={true}
        customTooltip={(props) => {
          if (!props.active || !props.payload?.length) return null;
          const data = props.payload[0];
          return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
              <p className="font-medium text-gray-900">{data.name}</p>
              <p className="text-gray-600">{currencyFormatter(data.value)}</p>
            </div>
          );
        }}
        colors={["#628447", "#7ba05b", "#94bc6f", "#add883", "#c6f497"]}
      />
      <p
        className={cn(
          "mt-8 flex items-center justify-between text-tremor-label text-tremor-content dark:text-dark-tremor-content",
          listHeaderClassName,
        )}
      >
        <span>Category</span>
        <span>Amount / Share</span>
      </p>
      <div className={cn("mt-2", listWrapperClassName)}>
        <List className={cn("mt-2", listClassName)}>
          {expenseCategories.map((item) => (
            <ListItem key={item.name} className="space-x-6">
              <div className="flex items-center space-x-2.5 truncate">
                <span
                  className={classNames(
                    item.color,
                    "size-2.5 shrink-0 rounded-sm",
                  )}
                  aria-hidden={true}
                />
                <span className="truncate dark:text-dark-tremor-content-emphasis">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium tabular-nums text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {currencyFormatter(item.amount)}
                </span>
                <span className="rounded-tremor-small bg-tremor-background-subtle px-1.5 py-0.5 text-tremor-label font-medium tabular-nums text-tremor-content-emphasis dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-emphasis">
                  {item.share}
                </span>
              </div>
            </ListItem>
          ))}
        </List>
      </div>
    </Card>
  );
}
