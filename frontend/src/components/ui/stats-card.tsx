// 'use client';

import { useState } from 'react';
import { AreaChart, Card } from '@tremor/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const data = [
  {
    date: 'Jan 23',
    revenue: 2340,
  },
  {
    date: 'Feb 23',
    revenue: 3110,
  },
  {
    date: 'Mar 23',
    revenue: 4643,
  },
  {
    date: 'Apr 23',
    revenue: 4650,
  },
  {
    date: 'May 23',
    revenue: 3980,
  },
  {
    date: 'Jun 23',
    revenue: 4702,
  },
  {
    date: 'Jul 23',
    revenue: 5990,
  },
  {
    date: 'Aug 23',
    revenue: 5700,
  },
  {
    date: 'Sep 23',
    revenue: 4250,
  },
  {
    date: 'Oct 23',
    revenue: 4182,
  },
  {
    date: 'Nov 23',
    revenue: 3812,
  },
  {
    date: 'Dec 23',
    revenue: 4900,
  },
];

const currencyFormatter = (number) => {
  return '$' + Intl.NumberFormat('us').format(number).toString();
};

const numberFormatter = (number) => {
  return Intl.NumberFormat('us').format(number).toString();
};

function formatChange(payload, percentageChange, absoluteChange) {
  if (!payload || isNaN(percentageChange)) {
    return '--';
  }

  const formattedPercentage = `${
    percentageChange > 0 ? '+' : ''
  }${percentageChange.toFixed(1)}%`;
  const formattedAbsolute = `${absoluteChange >= 0 ? '+' : '-'}${currencyFormatter(
    Math.abs(absoluteChange),
  )}`;

  return `${formattedPercentage} (${formattedAbsolute})`;
}

export default function StatsCard() {
  const [datas, setDatas] = useState(null);
  const payload = datas?.payload[0];

  const value = payload?.payload[payload.dataKey];

  const customTooltipIndex = 'date';

  const previousIndex = data.findIndex(
    (e) => e[customTooltipIndex] === payload?.payload?.date,
  );
  const previousValues = previousIndex > 0 ? data[previousIndex - 1] : {};

  const prev =
    payload && previousValues ? previousValues[payload.dataKey] : undefined;
  const percentageChange = ((value - prev) / prev) * 100 ?? undefined;
  const absoluteChange = value - prev ?? undefined;

  const formattedValue = payload
    ? currencyFormatter(value)
    : currencyFormatter(data[0].revenue);

  return (
      <Card className="sm:mx-auto sm:max-w-lg">
        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
          Expenses by month
        </p>
        <p className="mt-2 text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          {formattedValue}
        </p>
        <p className="mt-1 flex items-baseline justify-between">
          <span className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            On {payload ? `${payload?.payload?.date}` : `${data[0].date}`}
          </span>
          <span
            className={classNames(
              'rounded-tremor-small p-2 text-tremor-default font-medium',
              formatChange(
                payload,
                percentageChange,
                absoluteChange,
                numberFormatter,
              ) === '--'
                ? 'text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis'
                : payload && percentageChange > 0
                  ? 'text-emerald-700 dark:text-emerald-500'
                  : 'text-red-700 dark:text-red-500',
            )}
          >
            {formatChange(
              payload,
              percentageChange,
              absoluteChange,
              numberFormatter,
            )}
          </span>
        </p>
        <AreaChart
          data={data}
          index="date"
          categories={['revenue']}
          showLegend={false}
          showYAxis={false}
          showGradient={true}
          startEndOnly={true}
          className="-mb-2 mt-8 h-48"
          colors={['#628447']}
          valueFormatter={currencyFormatter}
          customTooltip={(props) => {
            if (props.active) {
              setDatas((prev) => {
                if (prev?.label === props?.label) return prev;
                return props;
              });
            } else {
              setDatas(null);
            }
            return null;
          }}
        />
      </Card>
  );
}