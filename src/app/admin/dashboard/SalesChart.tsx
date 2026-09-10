"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LuTrendingUp as TrendingUp } from 'react-icons/lu';

export default function SalesChart({ chartdata }: { chartdata: { name: string; sales: number }[] }) {
  const hasData = Array.isArray(chartdata) && chartdata.length > 0;

  return (
    <article className="dashboard-card sales-chart-card">
      <div className="dashboard-card-header">
        <div className="chart-title-group">
          <span><TrendingUp /></span>
          <h3>Sales Trend</h3>
        </div>
      </div>

      <div className="dashboard-chart">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartdata} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 5" stroke="#dedced" vertical={false} />
              <XAxis dataKey="name" stroke="#7c879c" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#7c879c" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ stroke: "#c4b5fd", strokeDasharray: "4 4" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #ede9fe",
                  borderRadius: "8px",
                  boxShadow: "0 12px 28px rgba(67, 56, 202, 0.12)",
                  color: "#1e1b4b",
                }}
                itemStyle={{ color: "#6d28d9" }}
              />
              <Area type="monotone" dataKey="sales" stroke="#7c3aed" fill="url(#salesArea)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="dashboard-empty-state">No chart data available</p>
        )}
      </div>
    </article>
  );
}
