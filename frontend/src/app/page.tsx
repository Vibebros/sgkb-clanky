'use client';
import { useState, useEffect } from 'react';
import StatsCard from "@/components/ui/stats-card";
import PieChart from "@/components/ui/pie-chart";
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

export default function Home() {
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);

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
        
        const result = await response.json();
        
        if (result.data?.totalsByCountry) {
          const transformedData = result.data.totalsByCountry.map(item => ({
            country: item.countryCode.toLowerCase(),
            value: parseFloat(item.total)
          }));
          setCountryData(transformedData);
        }
      } catch (error) {
        console.error('Error fetching country data:', error);
        // Fallback to sample data
        setCountryData([
          { country: "ch", value: 29752.5 },
          { country: "dk", value: 21152.64 },
          { country: "de", value: 11275.44 },
          { country: "no", value: 9558.40 },
          { country: "se", value: 7949.94 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryData();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen pt-8 pb-16">
      <div className="text-2xl font-bold text-gray-900 text-left w-full pl-12 pb-10">Welcome back, John!</div>
      <StatsCard />
      <PieChart />
      <div className="mt-8 w-full px-8 mb-16">
        <WorldMap data={countryData} />
      </div>
    </div>
  );
}
