"use client";

import WorldMap from "react-svg-worldmap";

interface CountryData {
  country: string;
  value: number;
}

interface WorldMapProps {
  data: CountryData[];
  isLoading?: boolean;
  error?: string | null;
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  className?: string;
  title?: string;
  titleAlignment?: "left" | "center" | "right";
}

export default function WorldMapComponent({
  data,
  isLoading = false,
  error = null,
  size = "xxl",
  className,
  title = "Country Activity",
  titleAlignment = "center",
}: WorldMapProps) {
  const containerClass = className ?? "w-full max-w-6xl mx-auto px-4";
  const titleAlignmentClass =
    titleAlignment === "left"
      ? "text-left"
      : titleAlignment === "right"
        ? "text-right"
        : "text-center";

  if (isLoading) {
    return (
      <div className={containerClass}>
        <h3
          className={`text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong ${titleAlignmentClass}`}
        >
          {title}
        </h3>
        <div className="w-full flex justify-center items-center h-64">
          <div className="text-gray-500">Loading country data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        <h3
          className={`text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong ${titleAlignmentClass}`}
        >
          {title}
        </h3>
        <div className="w-full flex justify-center items-center h-64">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={containerClass}>
        <h3
          className={`text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong ${titleAlignmentClass}`}
        >
          {title}
        </h3>
        <div className="w-full flex justify-center items-center h-64">
          <div className="text-gray-500">
            No country spending data available.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <h3
        className={`text-xl font-semibold text-gray-800 mb-4 ${titleAlignmentClass}`}
      >
        {title}
      </h3>
      <div className="w-full overflow-visible flex justify-center">
        <WorldMap
          color="green"
          value-suffix=" CHF"
          size={size}
          data={data}
          richInteraction={true}
          tooltipTextFunction={() => ""}
        />
      </div>
    </div>
  );
}
