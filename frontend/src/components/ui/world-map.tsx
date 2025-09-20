'use client';

import { useState, useEffect } from 'react';
import WorldMap from "react-svg-worldmap";

interface CountryData {
  country: string;
  value: number;
}

interface CountryTotal {
  country: string;
  countryCode: string;
  total: string;
}

interface GraphQLResponse {
  data: {
    totalsByCountry: CountryTotal[];
  };
}

const COUNTRIES_QUERY = `
  query countries {
    totalsByCountry {
      country
      countryCode
      total
    }
  }
`;

export default function WorldMapComponent() {
  const [data, setData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/graphql/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: COUNTRIES_QUERY,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch country data');
        }

        const result: GraphQLResponse = await response.json();
        
        if (result.data?.totalsByCountry) {
          const transformedData = result.data.totalsByCountry.map(item => ({
            country: item.countryCode,
            value: parseFloat(item.total)
          }));
          setData(transformedData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCountryData();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4">
        <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">Country Activity</h3>
        <div className="w-full flex justify-center items-center h-64">
          <div className="text-gray-500">Loading country data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4">
        <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">Country Activity</h3>
        <div className="w-full flex justify-center items-center h-64">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Country Activity</h3>
      <div className="w-full overflow-visible flex justify-center">
        <WorldMap 
          color="green" 
          value-suffix=" CHF" 
          size="xxl" 
          data={data}
          richInteraction={true}
          tooltipTextFunction={() => ""}
        />
      </div>
    </div>
  );
}