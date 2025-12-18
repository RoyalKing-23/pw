"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/app/components/AdminLayout";
import { 
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  Users,
  Layers
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { day: '01', thisMonth: 4, lastMonth: 3 },
  { day: '02', thisMonth: 6, lastMonth: 5 },
  { day: '03', thisMonth: 7, lastMonth: 6 },
  { day: '04', thisMonth: 5, lastMonth: 4 },
  { day: '05', thisMonth: 8, lastMonth: 7 },
  { day: '06', thisMonth: 6, lastMonth: 5 },
  { day: '07', thisMonth: 9, lastMonth: 8 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/adminDashboard", {
      credentials: "include", // ensures cookies are sent
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setStats(data);
        setLoading(false);
        setAuthChecked(true);
      })
      .catch(() => {
        setError("Unauthorized");
        router.replace("/admin/login");
      });
  }, [router]);

  // Prevent rendering until auth check is done
  if (!authChecked && !error) return null;
  if (error) return null;

  return (
    <AdminLayout activePage="dashboard">
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your platform.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <StatCard 
            icon={<CheckCircle className="w-6 h-6 text-green-500" />}
            label="Total Users"
            value={stats?.userCount || 0}
            change="+8 users"
            changeType="positive"
          />
          <StatCard 
            icon={<Clock className="w-6 h-6 text-blue-500" />}
            label="Total Batches"
            value={stats?.batchCount || 0}
            change="+3 batches"
            changeType="positive"
          />
          <StatCard 
            icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
            label="Active Sessions"
            value="93%"
            change="+12%"
            changeType="positive"
          />
        </div>

        {/* Performance Chart */}
        <Card className="p-4 lg:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Performance Overview</h2>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-auto">
              <option>01-07 May</option>
            </select>
          </div>
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="thisMonth" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="lastMonth" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, label, value, change, changeType }: { 
  icon: React.ReactNode; 
  label: string; 
  value: React.ReactNode; 
  change?: string;
  changeType?: 'positive' | 'negative';
}) {
  return (
    <Card className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        {icon}
        <span className="text-xl lg:text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {change && (
        <div className={`text-sm ${
          changeType === 'positive' ? 'text-green-600' : 'text-red-600'
        }`}>
          {change}
        </div>
      )}
    </Card>
  );
} 