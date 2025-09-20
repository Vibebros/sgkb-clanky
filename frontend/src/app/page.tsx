'use client';
import StatsCard from "@/components/ui/stats-card";
import PieChart from "@/components/ui/pie-chart";

export default function Home() {
  return (
    <div className="flex flex-col items-center h-screen pt-8">

      <div className="text-2xl font-bold text-gray-900 text-left w-full pl-12 pb-10">Welcome back, John!</div>
     <StatsCard />
     <PieChart />

      Pie diagram

      laender map
    </div>
  );
}
