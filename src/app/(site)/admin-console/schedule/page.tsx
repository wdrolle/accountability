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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/react';
import { Calendar, Clock, Plus, Play, Pause, Edit, Trash } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type Schedule = {
  id: string;
  name: string;
  type: 'message' | 'task';
  cronExpression: string;
  status: 'active' | 'paused' | 'failed';
  lastRun: string | null;
  nextRun: string | null;
  description: string;
};

export default function SchedulePage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: '1',
      name: 'Daily Digest',
      type: 'message',
      cronExpression: '0 9 * * *',
      status: 'active',
      lastRun: '2024-01-20T09:00:00Z',
      nextRun: '2024-01-21T09:00:00Z',
      description: 'Send daily digest to all active users'
    },
    {
      id: '2',
      name: 'Weekly Report',
      type: 'message',
      cronExpression: '0 10 * * 1',
      status: 'active',
      lastRun: '2024-01-15T10:00:00Z',
      nextRun: '2024-01-22T10:00:00Z',
      description: 'Generate and send weekly activity reports'
    },
    {
      id: '3',
      name: 'Database Cleanup',
      type: 'task',
      cronExpression: '0 0 * * 0',
      status: 'paused',
      lastRun: '2024-01-14T00:00:00Z',
      nextRun: null,
      description: 'Remove old and inactive records'
    }
  ]);

  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    type: 'message',
    status: 'active'
  });

  const handleAddSchedule = () => {
    if (newSchedule.name && newSchedule.cronExpression && newSchedule.description) {
      setSchedules([
        ...schedules,
        {
          id: String(schedules.length + 1),
          name: newSchedule.name,
          type: newSchedule.type as 'message' | 'task',
          cronExpression: newSchedule.cronExpression,
          status: newSchedule.status as 'active' | 'paused' | 'failed',
          lastRun: null,
          nextRun: null,
          description: newSchedule.description
        }
      ]);
      setNewSchedule({
        type: 'message',
        status: 'active'
      });
      onClose();
    }
  };

  const toggleStatus = (id: string) => {
    setSchedules(schedules.map(schedule => {
      if (schedule.id === id) {
        return {
          ...schedule,
          status: schedule.status === 'active' ? 'paused' : 'active',
          nextRun: schedule.status === 'paused' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
        };
      }
      return schedule;
    }));
  };

  const deleteSchedule = (id: string) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
  };

  const getStatusColor = (status: Schedule['status']) => {
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

  const getTypeColor = (type: Schedule['type']) => {
    switch (type) {
      case 'message':
        return 'primary';
      case 'task':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Breadcrumb 
        pageTitle="Schedule" 
        items={[
          { label: 'Admin Console', href: '/admin-console' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
                Schedule Manager
              </h1>
              <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
                Manage automated tasks and message delivery schedules
              </p>
            </div>
            <Button
              color="primary"
              endContent={<Plus className="w-4 h-4" />}
              onPress={onOpen}
            >
              Add Schedule
            </Button>
          </div>

          <Card className="bg-white dark:bg-[#18181b]">
            <CardHeader className="flex gap-3">
              <Calendar className="w-6 h-6" />
              <div className="flex flex-col">
                <p className="text-lg font-semibold text-black dark:text-white">Active Schedules</p>
                <p className="text-small text-default-500">List of all scheduled tasks and messages</p>
              </div>
            </CardHeader>
            <CardBody>
              <Table aria-label="Schedules table">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>CRON EXPRESSION</TableColumn>
                  <TableColumn>LAST RUN</TableColumn>
                  <TableColumn>NEXT RUN</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{schedule.name}</p>
                          <p className="text-small text-default-500">{schedule.description}</p>
                        </div>
                      </TableCell>
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
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {schedule.cronExpression}
                        </code>
                      </TableCell>
                      <TableCell>
                        {schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'Not scheduled'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(schedule.status)}
                          variant="flat"
                          size="sm"
                        >
                          {schedule.status.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => toggleStatus(schedule.id)}
                          >
                            {schedule.status === 'active' ? 
                              <Pause className="w-4 h-4" /> : 
                              <Play className="w-4 h-4" />
                            }
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => deleteSchedule(schedule.id)}
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Add New Schedule</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Enter schedule name"
                value={newSchedule.name || ''}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              />
              <Select
                label="Type"
                value={newSchedule.type}
                onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value as 'message' | 'task' })}
              >
                <SelectItem key="message" value="message">Message</SelectItem>
                <SelectItem key="task" value="task">Task</SelectItem>
              </Select>
              <Input
                label="Cron Expression"
                placeholder="Enter cron expression"
                value={newSchedule.cronExpression || ''}
                onChange={(e) => setNewSchedule({ ...newSchedule, cronExpression: e.target.value })}
              />
              <Input
                label="Description"
                placeholder="Enter description"
                value={newSchedule.description || ''}
                onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleAddSchedule}>
              Add Schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 