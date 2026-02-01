'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Eye, 
  FileText, 
  TrendingUp,
  Filter,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface AnalyticsStats {
  totalVisits: number;
  liveUsers: number;
  totalQuizAttempts: number;
  filter: string;
}

interface ChartData {
  label: string;
  value: number;
}

type ChartView = 'day' | 'month';
type ChartType = 'visits' | 'quiz-attempts';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalVisits: 0,
    liveUsers: 0,
    totalQuizAttempts: 0,
    filter: 'all',
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Chart state
  const [chartView, setChartView] = useState<ChartView>('day');
  const [chartType, setChartType] = useState<ChartType>('visits');
  const [chartYear, setChartYear] = useState(new Date().getFullYear().toString());
  const [chartMonth, setChartMonth] = useState((new Date().getMonth() + 1).toString());
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [filter]);

  useEffect(() => {
    fetchChartData();
  }, [chartView, chartType, chartYear, chartMonth]);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await api.get(`/analytics/stats?filter=${filter}`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      const endpoint = chartType === 'visits' 
        ? '/analytics/chart/visits' 
        : '/analytics/chart/quiz-attempts';
      
      const params = new URLSearchParams({
        view: chartView,
        year: chartYear,
        ...(chartView === 'day' ? { month: chartMonth } : {}),
      });

      const response = await api.get(`${endpoint}?${params}`);
      setChartData(response.data.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchChartData();
  };

  const statCards = [
    {
      title: 'Total Visits',
      value: stats.totalVisits,
      icon: Eye,
      description: 'Website visits',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Live Users',
      value: stats.liveUsers,
      icon: Users,
      description: 'Last 30 minutes',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
      isLive: true,
    },
    {
      title: 'Quiz Attempts',
      value: stats.totalQuizAttempts,
      icon: FileText,
      description: 'Total attempts',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  const currentYear = new Date().getFullYear();
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate max value for chart scaling
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Analytics</h1>
          <p className="text-muted-foreground mt-2">Monitor your platform performance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </Select>
            <span className="text-sm text-muted-foreground">
              Note: Live Users always shows last 30 minutes
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                    {stat.isLive && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-500">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live
                      </span>
                    )}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-light">{stat.value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chart Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={chartView === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartView('day')}
              >
                Day Wise
              </Button>
              <Button
                variant={chartView === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartView('month')}
              >
                Month Wise
              </Button>
            </div>

            {/* Year Selector - native select so dropdown options render; default current year (2026) */}
            <select
              value={chartYear}
              onChange={(e) => setChartYear(e.target.value)}
              className="flex h-10 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Select year"
            >
              <option value={String(currentYear)}>{currentYear}</option>
              <option value={String(currentYear - 1)}>{currentYear - 1}</option>
            </select>

            {/* Month Selector (only for day view) */}
            {chartView === 'day' && (
              <Select
                value={chartMonth}
                onChange={(e) => setChartMonth(e.target.value)}
                className="w-[140px]"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart Type Selector */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-medium">Analytics Charts</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={chartType === 'visits' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('visits')}
                >
                  Total Visits
                </Button>
                <Button
                  variant={chartType === 'quiz-attempts' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('quiz-attempts')}
                >
                  Quiz Attempts
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bar Chart */}
                <div className="space-y-3">
                  {chartData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No data available for the selected period
                    </div>
                  ) : (
                    chartData.map((item, index) => {
                      const percentage = (item.value / maxValue) * 100;
                      return (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="space-y-1"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium">
                              {item.label}
                            </span>
                            <span className="font-semibold">{item.value}</span>
                          </div>
                          <div className="h-8 bg-muted rounded-lg overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: index * 0.02 }}
                              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-lg flex items-center justify-end pr-3"
                            >
                              {item.value > 0 && (
                                <span className="text-xs font-medium text-primary-foreground">
                                  {item.value}
                                </span>
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Summary */}
                {chartData.length > 0 && (
                  <div className="pt-4 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total {chartType === 'visits' ? 'Visits' : 'Quiz Attempts'}:
                    </span>
                    <span className="text-lg font-semibold">
                      {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
