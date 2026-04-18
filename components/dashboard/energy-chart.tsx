"use client";

import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SolarPoint } from "@/lib/mock-solar-data";

type EnergyChartProps = {
  points: SolarPoint[];
};

export function EnergyChart({ points }: EnergyChartProps) {
  const formatTooltipValue = (
    value: string | number | readonly (string | number)[] | undefined
  ) => {
    if (value === undefined) {
      return "0.0 kW";
    }

    const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value);
    return `${numericValue.toFixed(1)} kW`;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="generationFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="timestamp"
            minTickGap={24}
            tickFormatter={(value: string) => format(parseISO(value), "HH:mm")}
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            axisLine={false}
            tickFormatter={(value: number) => `${value} kW`}
            tickLine={false}
            tickMargin={12}
            width={56}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid var(--color-border)",
              borderRadius: "1rem",
              background: "var(--color-card)",
              color: "var(--color-card-foreground)",
            }}
            formatter={(value, name) => [
              formatTooltipValue(value),
              name === "generationKw" ? "Generacion real" : "Meta esperada",
            ]}
            labelFormatter={(value) => format(parseISO(String(value)), "HH:mm")}
          />
          <Area
            animationDuration={700}
            dataKey="targetKw"
            fill="transparent"
            name="targetKw"
            stroke="var(--color-chart-2)"
            strokeDasharray="6 6"
            strokeWidth={2}
            type="monotone"
          />
          <Area
            animationDuration={900}
            dataKey="generationKw"
            fill="url(#generationFill)"
            name="generationKw"
            stroke="var(--color-chart-1)"
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
