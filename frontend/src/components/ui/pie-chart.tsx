"use client";

import { useState, useEffect } from 'react';
import { Card, DonutChart, List, ListItem } from "@tremor/react";

import { cn } from "@/lib/utils";

export interface ExpenseCategory {
  name: string;
  amount: number;
  share: string;
  color: string;
}

const TOTAL_CATEGORY_QUERY = `
  query totalCategory {
    totalsByCategory {
      category
      total
    }
  }
`;

const colors = ["bg-green-600", "bg-green-500", "bg-green-400", "bg-green-300", "bg-green-200", "bg-green-100"];

export const currencyFormatter = (value: number) => {
  return `CHF ${Intl.NumberFormat("us").format(value)}`;
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
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: TOTAL_CATEGORY_QUERY,
          }),
        });
        
        const result = await response.json();
        
        if (result.data?.totalsByCategory) {
          const totalSum = result.data.totalsByCategory.reduce((sum: number, item: any) => sum + parseFloat(item.total), 0);
          
          const transformedData = result.data.totalsByCategory.map((item: any, index: number) => {
            const amount = parseFloat(item.total);
            const share = ((amount / totalSum) * 100).toFixed(1) + '%';
            return {
              name: item.category,
              amount: amount,
              share: share,
              color: colors[index % colors.length],
            };
          });
          setExpenseCategories(transformedData);
        }
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  if (loading) {
    return (
      <Card className={cn("w-full sm:max-w-lg sm:mx-auto", cardClassName)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-80 bg-gray-300 rounded"></div>
        </div>
      </Card>
    );
  }

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
      <div className={cn("mt-2 no-scrollbar", listWrapperClassName)}>
        <List className={cn("mt-2", listClassName)}>
          {expenseCategories.map((item) => (
            <ListItem key={item.name} className="items-start gap-4">
              <div className="flex min-w-0 items-center gap-2.5 truncate">
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
              <div className="ml-auto flex flex-col items-end gap-1 text-right sm:flex-row sm:items-center sm:gap-2">
                <span className="font-medium tabular-nums text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {currencyFormatter(item.amount)}
                </span>
                <span className="hidden rounded-tremor-small bg-tremor-background-subtle px-1.5 py-0.5 text-tremor-label font-medium tabular-nums text-tremor-content-emphasis dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-emphasis sm:inline-flex">
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
