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
  Input,
  Select,
  SelectItem,
  Switch
} from '@nextui-org/react';
import { Calendar, Clock, Users, Plus, Edit, Trash } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type Schedule = {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly';
  time: string;
  days: string[];
  timezone: string;
  targetGroup: string;
  status: 'active' | 'inactive';
  lastRun: string | null;
  nextRun: string | null;
};

export default function MessageSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: '1',
      name: 'Morning Devotional',
      type: 'daily',
      time: '07:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timezone: 'America/New_York',
      targetGroup: 'All Subscribers',
      status: 'active',
      lastRun: '2024-01-21T07:00:00Z',
      nextRun: '2024-01-22T07:00:00Z'
    },
    {
      id: '2',
      name: 'Weekly Family Prayer',
      type: 'weekly',
      time: '18:00',
      days: ['Sunday'],
      timezone: 'America/New_York',
      targetGroup: 'Family Groups',
      status: 'active',
      lastRun: '2024-01-21T18:00:00Z',
      nextRun: '2024-01-28T18:00:00Z'
    },
    {
      id: '3',
      name: 'Monthly Reflection',
      type: 'monthly',
      time: '09:00',
      days: ['1'],
      timezone: 'America/New_York',
      targetGroup: 'Active Members',
      status: 'inactive',
      lastRun: '2024-01-01T09:00:00Z',
      nextRun: '2024-02-01T09:00:00Z'
    }
  ]);

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'warning';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'primary';
      case 'weekly':
        return 'success';
      case 'monthly':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDays = (schedule: Schedule) => {
    switch (schedule.type) {
      case 'daily':
        return schedule.days.join(', ');
      case 'weekly':
        return schedule.days.join(', ');
      case 'monthly':
        return `Day ${schedule.days[0]}`;
      default:
        return '';
    }
  };

  const toggleStatus = (id: string) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === id) {
        return {
          ...schedule,
          status: schedule.status === 'active' ? 'inactive' : 'active'
        };
      }
      return schedule;
    }));
  };

  return (
    <>
      <Breadcrumb 
        pageTitle="Message Schedule" 
        items={[
          { label: 'Admin Console', href: '/admin-console' },
          { label: 'Messages', href: '/admin-console/messages' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
              Message Schedule
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              Configure automated message delivery schedules
            </p>
          </div>

          {/* Schedule Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-[#18181b]">
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Active Schedules</p>
                    <p className="text-xl font-semibold">
                      {schedules.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-white dark:bg-[#18181b]">
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-success/10">
                    <Users className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Target Groups</p>
                    <p className="text-xl font-semibold">3</p>
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
                    <p className="text-small text-default-500">Next Delivery</p>
                    <p className="text-xl font-semibold">In 2 hours</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card className="bg-white dark:bg-[#18181b]">
            <CardHeader className="flex justify-between items-center">
              <div className="flex gap-3">
                <Calendar className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Delivery Schedules</p>
                  <p className="text-small text-default-500">Configure message delivery times</p>
                </div>
              </div>
              <Button color="primary" endContent={<Plus className="w-4 h-4" />}>
                Add Schedule
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Message schedules table">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>TIME</TableColumn>
                  <TableColumn>DAYS</TableColumn>
                  <TableColumn>TARGET GROUP</TableColumn>
                  <TableColumn>NEXT RUN</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.name}</TableCell>
                      <TableCell>
                        <Chip
                          color={getTypeColor(schedule.type)}
                          variant="flat"
                          size="sm"
                        >
                          {schedule.type.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {schedule.time}
                        </div>
                      </TableCell>
                      <TableCell>{formatDays(schedule)}</TableCell>
                      <TableCell>{schedule.targetGroup}</TableCell>
                      <TableCell>
                        {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'Not scheduled'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          isSelected={schedule.status === 'active'}
                          onValueChange={() => toggleStatus(schedule.id)}
                          size="sm"
                          color="success"
                        >
                          {schedule.status.toUpperCase()}
                        </Switch>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
} 