'use client';

import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Button,
  Tabs,
  Tab,
  Progress
} from '@nextui-org/react';
import { Database, HardDrive, Activity, Clock, AlertTriangle } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type TableMetric = {
  id: string;
  name: string;
  rowCount: number;
  size: string;
  lastBackup: string;
  status: 'healthy' | 'warning' | 'critical';
};

type QueryMetric = {
  id: string;
  query: string;
  duration: number;
  timestamp: string;
  status: 'success' | 'failed';
};

type BackupInfo = {
  id: string;
  filename: string;
  size: string;
  createdAt: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'in_progress' | 'failed';
};

export default function DatabasePage() {
  const [selectedTab, setSelectedTab] = useState('metrics');

  const tableMetrics: TableMetric[] = [
    {
      id: '1',
      name: 'users',
      rowCount: 15420,
      size: '256 MB',
      lastBackup: '2024-01-21T00:00:00Z',
      status: 'healthy'
    },
    {
      id: '2',
      name: 'messages',
      rowCount: 89750,
      size: '512 MB',
      lastBackup: '2024-01-21T00:00:00Z',
      status: 'warning'
    },
    {
      id: '3',
      name: 'newsletter_subscriptions',
      rowCount: 5280,
      size: '128 MB',
      lastBackup: '2024-01-21T00:00:00Z',
      status: 'healthy'
    }
  ];

  const queryMetrics: QueryMetric[] = [
    {
      id: '1',
      query: 'SELECT * FROM users WHERE last_login > ?',
      duration: 145,
      timestamp: '2024-01-21T10:15:00Z',
      status: 'success'
    },
    {
      id: '2',
      query: 'UPDATE messages SET status = ? WHERE id IN (?)',
      duration: 890,
      timestamp: '2024-01-21T10:14:30Z',
      status: 'success'
    },
    {
      id: '3',
      query: 'DELETE FROM expired_sessions WHERE last_access < ?',
      duration: 450,
      timestamp: '2024-01-21T10:14:00Z',
      status: 'failed'
    }
  ];

  const backups: BackupInfo[] = [
    {
      id: '1',
      filename: 'backup_20240121_000000.sql',
      size: '1.2 GB',
      createdAt: '2024-01-21T00:00:00Z',
      type: 'full',
      status: 'completed'
    },
    {
      id: '2',
      filename: 'backup_20240120_120000.sql',
      size: '256 MB',
      createdAt: '2024-01-20T12:00:00Z',
      type: 'incremental',
      status: 'completed'
    },
    {
      id: '3',
      filename: 'backup_20240120_000000.sql',
      size: '1.1 GB',
      createdAt: '2024-01-20T00:00:00Z',
      type: 'full',
      status: 'completed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'completed':
      case 'success':
        return 'success';
      case 'warning':
      case 'in_progress':
        return 'warning';
      case 'critical':
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'primary';
      case 'incremental':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Breadcrumb 
        pageTitle="Database" 
        items={[
          { label: 'Admin Console', href: '/admin-console' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
              Database Manager
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              Monitor and manage database operations
            </p>
          </div>

          {/* Database Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-[#18181b]">
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <HardDrive className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Storage Used</p>
                    <p className="text-xl font-semibold">896 MB / 2 GB</p>
                    <Progress
                      size="sm"
                      value={44.8}
                      className="max-w-md mt-2"
                      color="primary"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white dark:bg-[#18181b]">
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-success/10">
                    <Activity className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Active Connections</p>
                    <p className="text-xl font-semibold">24 / 100</p>
                    <Progress
                      size="sm"
                      value={24}
                      className="max-w-md mt-2"
                      color="success"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white dark:bg-[#18181b]">
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-warning/10">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Avg. Query Time</p>
                    <p className="text-xl font-semibold">495ms</p>
                    <Progress
                      size="sm"
                      value={49.5}
                      className="max-w-md mt-2"
                      color="warning"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Tabs 
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
            aria-label="Database tabs"
            className="mb-6"
          >
            <Tab
              key="metrics"
              title={
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Table Metrics</span>
                </div>
              }
            />
            <Tab
              key="queries"
              title={
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Recent Queries</span>
                </div>
              }
            />
            <Tab
              key="backups"
              title={
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span>Backups</span>
                </div>
              }
            />
          </Tabs>

          {selectedTab === 'metrics' && (
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <Database className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Table Metrics</p>
                  <p className="text-small text-default-500">Overview of database tables</p>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Table metrics">
                  <TableHeader>
                    <TableColumn>TABLE NAME</TableColumn>
                    <TableColumn>ROW COUNT</TableColumn>
                    <TableColumn>SIZE</TableColumn>
                    <TableColumn>LAST BACKUP</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {tableMetrics.map((table) => (
                      <TableRow key={table.id}>
                        <TableCell>{table.name}</TableCell>
                        <TableCell>{table.rowCount.toLocaleString()}</TableCell>
                        <TableCell>{table.size}</TableCell>
                        <TableCell>{new Date(table.lastBackup).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(table.status)}
                            variant="flat"
                            size="sm"
                          >
                            {table.status.toUpperCase()}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}

          {selectedTab === 'queries' && (
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <Activity className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Recent Queries</p>
                  <p className="text-small text-default-500">Monitor database queries</p>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Recent queries">
                  <TableHeader>
                    <TableColumn>QUERY</TableColumn>
                    <TableColumn>DURATION</TableColumn>
                    <TableColumn>TIMESTAMP</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {queryMetrics.map((query) => (
                      <TableRow key={query.id}>
                        <TableCell>
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                            {query.query}
                          </code>
                        </TableCell>
                        <TableCell>{query.duration}ms</TableCell>
                        <TableCell>{new Date(query.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(query.status)}
                            variant="flat"
                            size="sm"
                          >
                            {query.status.toUpperCase()}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}

          {selectedTab === 'backups' && (
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <HardDrive className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Database Backups</p>
                  <p className="text-small text-default-500">Manage database backups</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex justify-end mb-4">
                  <Button color="primary" className="mr-2">
                    Create Backup
                  </Button>
                  <Button color="secondary">
                    Schedule Backup
                  </Button>
                </div>
                <Table aria-label="Backup history">
                  <TableHeader>
                    <TableColumn>FILENAME</TableColumn>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>SIZE</TableColumn>
                    <TableColumn>CREATED AT</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell>{backup.filename}</TableCell>
                        <TableCell>
                          <Chip
                            color={getTypeColor(backup.type)}
                            variant="flat"
                            size="sm"
                          >
                            {backup.type.toUpperCase()}
                          </Chip>
                        </TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(backup.status)}
                            variant="flat"
                            size="sm"
                          >
                            {backup.status.toUpperCase()}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
} 