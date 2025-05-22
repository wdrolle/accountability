'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Badge,
  Tabs
} from '@heroui/react';
import { BarChart3, Users, Activity, Clock } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type PerformanceMetric = {
  id: string;
  metric: string;
  value: string;
  status: 'success' | 'warning' | 'danger';
  change: string;
};

type UserEngagement = {
  id: string;
  metric: string;
  today: number;
  weekly: number;
  monthly: number;
  trend: 'up' | 'down' | 'stable';
};

export default function AnalyticsPage() {
  const [selectedTab, setSelectedTab] = useState('performance');

  const performanceMetrics: PerformanceMetric[] = [
    {
      id: '1',
      metric: 'Average Response Time',
      value: '120ms',
      status: 'success',
      change: '-10%'
    },
    {
      id: '2',
      metric: 'Error Rate',
      value: '0.5%',
      status: 'success',
      change: '-0.2%'
    },
    {
      id: '3',
      metric: 'CPU Usage',
      value: '65%',
      status: 'warning',
      change: '+5%'
    },
    {
      id: '4',
      metric: 'Memory Usage',
      value: '75%',
      status: 'warning',
      change: '+8%'
    }
  ];

  const engagementMetrics: UserEngagement[] = [
    {
      id: '1',
      metric: 'Active Users',
      today: 1250,
      weekly: 8500,
      monthly: 32000,
      trend: 'up'
    },
    {
      id: '2',
      metric: 'Message Deliveries',
      today: 5600,
      weekly: 38500,
      monthly: 156000,
      trend: 'up'
    },
    {
      id: '3',
      metric: 'Failed Deliveries',
      today: 12,
      weekly: 85,
      monthly: 320,
      trend: 'down'
    },
    {
      id: '4',
      metric: 'Average Session Duration',
      today: 8,
      weekly: 7.5,
      monthly: 7.8,
      trend: 'stable'
    }
  ];

  const getStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTrendColor = (trend: UserEngagement['trend']) => {
    switch (trend) {
      case 'up':
        return 'success';
      case 'down':
        return 'danger';
      case 'stable':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getTrendIcon = (trend: UserEngagement['trend']) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  return (
    <>
      <Breadcrumb 
        pageTitle="Analytics" 
        items={[
          { label: 'Admin Console', href: '/admin-console' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              Monitor system performance and user engagement metrics
            </p>
          </div>

          <Tabs 
            items={[
              {
                id: 'performance',
                label: (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>Performance</span>
                  </div>
                ),
                content: (
                  <Card className="bg-white dark:bg-[#18181b]">
                    <div className="flex gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                      <BarChart3 className="w-6 h-6" />
                      <div className="flex flex-col">
                        <p className="text-lg font-semibold text-black dark:text-white">System Performance</p>
                        <p className="text-small text-default-500">Real-time system metrics</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <Table>
                        <thead>
                          <tr>
                            <th>METRIC</th>
                            <th>VALUE</th>
                            <th>STATUS</th>
                            <th>CHANGE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performanceMetrics.map((metric) => (
                            <tr key={metric.id}>
                              <td>{metric.metric}</td>
                              <td>
                                <span className="font-semibold">{metric.value}</span>
                              </td>
                              <td>
                                <Badge
                                  color={getStatusColor(metric.status)}
                                >
                                  {metric.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td>
                                <span className={metric.change.startsWith('-') ? 'text-success' : 'text-danger'}>
                                  {metric.change}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                )
              },
              {
                id: 'engagement',
                label: (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>User Engagement</span>
                  </div>
                ),
                content: (
                  <Card className="bg-white dark:bg-[#18181b]">
                    <div className="flex gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                      <Users className="w-6 h-6" />
                      <div className="flex flex-col">
                        <p className="text-lg font-semibold text-black dark:text-white">User Engagement</p>
                        <p className="text-small text-default-500">User activity metrics</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <Table>
                        <thead>
                          <tr>
                            <th>METRIC</th>
                            <th>TODAY</th>
                            <th>THIS WEEK</th>
                            <th>THIS MONTH</th>
                            <th>TREND</th>
                          </tr>
                        </thead>
                        <tbody>
                          {engagementMetrics.map((metric) => (
                            <tr key={metric.id}>
                              <td>{metric.metric}</td>
                              <td>{metric.today.toLocaleString()}</td>
                              <td>{metric.weekly.toLocaleString()}</td>
                              <td>{metric.monthly.toLocaleString()}</td>
                              <td>
                                <Badge
                                  color={getTrendColor(metric.trend)}
                                  className="flex items-center gap-1"
                                >
                                  <span>{getTrendIcon(metric.trend)}</span>
                                  {metric.trend.toUpperCase()}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card>
                )
              }
            ]}
            selectedKey={selectedTab}
            onSelectionChange={key => setSelectedTab(key as string)}
          />
        </div>
      </div>
    </>
  );
} 