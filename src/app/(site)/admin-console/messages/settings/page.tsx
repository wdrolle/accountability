'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Select,
  SelectItem,
  Chip,
  Divider,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from '@nextui-org/react';
import { Switch } from "@nextui-org/switch";
import { Clock, Calendar, Settings, Save } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type DeliveryWindow = {
  id: string;
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
};

type CronJob = {
  id: string;
  name: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string | null;
  status: 'active' | 'paused' | 'failed';
};

type Timezone = {
  id: number;
  timezone: string;
  utc_offset: string;
  name: string;
};

export default function MessageSettingsPage() {
  const [deliveryWindows, setDeliveryWindows] = useState<DeliveryWindow[]>([
    {
      id: '1',
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'America/New_York',
      isActive: true
    }
  ]);

  const [cronJobs, setCronJobs] = useState<CronJob[]>([
    {
      id: '1',
      name: 'Daily Message Delivery',
      schedule: '0 9 * * *',
      lastRun: '2024-01-20T09:00:00Z',
      nextRun: '2024-01-21T09:00:00Z',
      status: 'active'
    },
    {
      id: '2',
      name: 'Weekly Digest',
      schedule: '0 10 * * 1',
      lastRun: '2024-01-15T10:00:00Z',
      nextRun: '2024-01-22T10:00:00Z',
      status: 'active'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [timezones, setTimezones] = useState<Timezone[]>([]);

  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const response = await fetch('/api/admin/timezones');
        const data = await response.json();
        setTimezones(data);
      } catch (error) {
        console.error('Error fetching timezones:', error);
      }
    };

    fetchTimezones();
  }, []);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      // TODO: Implement actual API call
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: CronJob['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Breadcrumb 
        pageTitle="Message Settings" 
        items={[
          { label: 'Admin Console', href: '/admin-console' },
          { label: 'Messages', href: '/admin-console/messages' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
              Message Settings
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              Configure message delivery times and cron jobs.
            </p>
          </div>

          <div className="grid gap-6">
            {/* Delivery Windows Card */}
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3 border-b border-gray-200 dark:border-gray-700">
                <Clock className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Delivery Windows</p>
                  <p className="text-small text-default-500">Configure when messages can be delivered</p>
                </div>
              </CardHeader>
              <CardBody className="pt-8">
                <div className="space-y-8">
                  {deliveryWindows.map((window, index) => (
                    <div key={window.id} className="space-y-8 pb-8 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-black dark:text-white">Delivery Window {index + 1}</h4>
                        <Switch
                          isSelected={window.isActive}
                          onValueChange={(value) => {
                            const newWindows = [...deliveryWindows];
                            newWindows[index].isActive = value;
                            setDeliveryWindows(newWindows);
                          }}
                          aria-label={`Toggle delivery window ${index + 1}`}
                        >
                          Active
                        </Switch>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm font-medium text-black dark:text-white mb-2">Start Time</p>
                          <Input
                            type="time"
                            value={window.startTime}
                            onChange={(e) => {
                              const newWindows = [...deliveryWindows];
                              newWindows[index].startTime = e.target.value;
                              setDeliveryWindows(newWindows);
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black dark:text-white mb-2">End Time</p>
                          <Input
                            type="time"
                            value={window.endTime}
                            onChange={(e) => {
                              const newWindows = [...deliveryWindows];
                              newWindows[index].endTime = e.target.value;
                              setDeliveryWindows(newWindows);
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black dark:text-white mb-2">Timezone</p>
                          <Select
                            value={window.timezone}
                            onChange={(e) => {
                              const newWindows = [...deliveryWindows];
                              newWindows[index].timezone = e.target.value;
                              setDeliveryWindows(newWindows);
                            }}
                            classNames={{
                              trigger: "bg-default-100 dark:bg-default-50",
                              listbox: "bg-default-100 dark:bg-default-50",
                              popoverContent: "bg-default-100 dark:bg-default-50"
                            }}
                          >
                            {timezones.map((tz) => (
                              <SelectItem key={tz.timezone} value={tz.timezone}>
                                {`${tz.name} (${tz.utc_offset})`}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => {
                      setDeliveryWindows([
                        ...deliveryWindows,
                        {
                          id: String(deliveryWindows.length + 1),
                          startTime: '09:00',
                          endTime: '17:00',
                          timezone: 'UTC',
                          isActive: true
                        }
                      ]);
                    }}
                  >
                    Add Delivery Window
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Cron Jobs Card */}
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <Calendar className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Cron Jobs</p>
                  <p className="text-small text-default-500">Manage scheduled message delivery tasks</p>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Cron jobs table">
                  <TableHeader>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>SCHEDULE</TableColumn>
                    <TableColumn>LAST RUN</TableColumn>
                    <TableColumn>NEXT RUN</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {cronJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {job.schedule}
                          </code>
                        </TableCell>
                        <TableCell>
                          {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'Not scheduled'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(job.status)}
                            variant="flat"
                            size="sm"
                          >
                            {job.status.toUpperCase()}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            <div className="flex justify-end mt-6">
              <Button
                color="primary"
                startContent={<Save className="w-4 h-4" />}
                isLoading={isLoading}
                onPress={handleSaveSettings}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 