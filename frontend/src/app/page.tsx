"use client";
import { Card, List, ListItem } from "@tremor/react";
import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import PieChart from "@/components/ui/pie-chart";
import StatsCard from "@/components/ui/stats-card";
import WorldMap from "@/components/ui/world-map";

const COUNTRIES_QUERY = `
  query countries {
    totalsByCountry {
      country
      countryCode
      total
    }
  }
`;

interface CountryTotals {
  country: string;
  countryCode: string;
  total: number;
}

const fallbackCountries: CountryTotals[] = [
  { country: "Switzerland", countryCode: "CH", total: 29752.5 },
  { country: "Denmark", countryCode: "DK", total: 21152.64 },
  { country: "Germany", countryCode: "DE", total: 11275.44 },
  { country: "Norway", countryCode: "NO", total: 9558.4 },
  { country: "Sweden", countryCode: "SE", total: 7949.94 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 2,
  }).format(value);

export default function Home() {
  const [countryTotals, setCountryTotals] = useState<CountryTotals[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const touchStartXRef = useRef<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/graphql/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: COUNTRIES_QUERY,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch country data");
        }

        const result = await response.json();

        if (result.data?.totalsByCountry?.length) {
          const transformed = result.data.totalsByCountry.map(
            (item: {
              country: string;
              countryCode: string;
              total: string;
            }) => ({
              country: item.country,
              countryCode: item.countryCode,
              total: Number.parseFloat(item.total),
            }),
          );
          setCountryTotals(transformed);
          return;
        }

        setCountryTotals(fallbackCountries);
      } catch (error) {
        console.error("Error fetching country data:", error);
        setCountryTotals(fallbackCountries);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountryData();
  }, []);

  const mapData = useMemo(
    () =>
      countryTotals.map((item) => ({
        country: item.countryCode.toLowerCase(),
        value: item.total,
      })),
    [countryTotals],
  );

  const sortedCountryTotals = useMemo(
    () => [...countryTotals].sort((a, b) => b.total - a.total),
    [countryTotals],
  );

  const goToSlide = (target: number) => {
    setActiveSlide((prev) => {
      if (target < 0 || target > 1) return prev;
      return target;
    });
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = event.changedTouches[0].clientX;
    const delta = touchStartXRef.current - touchEndX;
    touchStartXRef.current = null;

    if (Math.abs(delta) < 40) return;

    if (delta > 0) {
      goToSlide(activeSlide + 1);
    } else {
      goToSlide(activeSlide - 1);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="space-y-8 px-6 py-8">
        <PageHeader
          title="SGKB Portal"
          subtitle="Welcome back, John! Monitor your finances and explore the latest insights."
        />
        <StatsCard />
        <Card className="w-full overflow-hidden rounded-3xl border border-gray-100 bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 px-6 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Spending insights
                </h3>
                <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => goToSlide(0)}
                    className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                      activeSlide === 0
                        ? "bg-white shadow text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Categories
                  </button>
                  <button
                    type="button"
                    onClick={() => goToSlide(1)}
                    className={`rounded-full px-4 py-1 text-sm font-medium transition ${
                      activeSlide === 1
                        ? "bg-white shadow text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Countries
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Swipe or tap to switch the detail view while keeping the
                expenses graph in sight.
              </p>
            </div>
            <div
              className="px-1 overflow-x-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                <div className="w-full flex-shrink-0 px-6 pb-6">
                  <PieChart
                    cardClassName="w-full sm:max-w-none border border-gray-100 shadow-none"
                    title="Spending by category"
                    titleClassName="text-xl font-semibold text-gray-900"
                    chartClassName="mt-4 h-56"
                    listHeaderClassName="mt-6"
                    listWrapperClassName="mt-3 pr-1 sm:max-h-56 sm:overflow-y-auto"
                    listClassName="mt-0"
                  />
                </div>
                <div className="w-full flex-shrink-0 px-6 pb-6">
                  <div className="flex flex-col gap-6">
                    <WorldMap
                      data={mapData}
                      isLoading={loadingCountries}
                      size="md"
                      className="w-full"
                      title="Country activity"
                      titleAlignment="left"
                    />
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">
                        Spending by country
                      </h4>
                      <div className="mt-3 pr-1 no-scrollbar sm:max-h-56 sm:overflow-y-auto">
                        <List>
                          {sortedCountryTotals.map((item) => (
                            <ListItem
                              key={item.countryCode}
                              className="justify-between"
                            >
                              <span>{item.country}</span>
                              <span className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                                {formatCurrency(item.total)}
                              </span>
                            </ListItem>
                          ))}
                        </List>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pb-6">
              <div className="flex items-center justify-center gap-2">
                {[0, 1].map((index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeSlide === index
                        ? "w-6 bg-green-600"
                        : "w-3 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
