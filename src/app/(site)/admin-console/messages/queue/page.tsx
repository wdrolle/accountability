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
import { MessageSquare, Clock, Users, Send, Pause, Play, Trash } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type QueuedMessage = {
  id: string;
  title: string;
  type: 'devotional' | 'family' | 'personal';
  scheduledFor: string;
  recipients: number;
  status: 'scheduled' | 'processing' | 'paused' | 'failed';
  progress: number;
};

type MessageTemplate = {
  id: string;
  title: string;
  type: 'devotional' | 'family' | 'personal';
  lastUsed: string | null;
  status: 'active' | 'draft' | 'archived';
  targetAudience: string;
};

export default function MessageQueuePage() {
  const [selectedTab, setSelectedTab] = useState('queue');

  const queuedMessages: QueuedMessage[] = [
    {
      id: '1',
      title: 'Morning Devotional - Faith and Trust',
      type: 'devotional',
      scheduledFor: '2024-01-22T07:00:00Z',
      recipients: 1250,
      status: 'scheduled',
      progress: 0
    },
    {
      id: '2',
      title: 'Evening Family Prayer',
      type: 'family',
      scheduledFor: '2024-01-21T18:00:00Z',
      recipients: 850,
      status: 'processing',
      progress: 45
    },
    {
      id: '3',
      title: 'Personal Reflection - Weekly Verse',
      type: 'personal',
      scheduledFor: '2024-01-21T12:00:00Z',
      recipients: 2000,
      status: 'paused',
      progress: 30
    }
  ];

  const messageTemplates: MessageTemplate[] = [
    {
      id: '1',
      title: 'Daily Morning Devotional',
      type: 'devotional',
      lastUsed: '2024-01-21T07:00:00Z',
      status: 'active',
      targetAudience: 'All Subscribers'
    },
    {
      id: '2',
      title: 'Family Prayer Time',
      type: 'family',
      lastUsed: '2024-01-20T18:00:00Z',
      status: 'active',
      targetAudience: 'Family Groups'
    },
    {
      id: '3',
      title: 'Personal Growth Series',
      type: 'personal',
      lastUsed: null,
      status: 'draft',
      targetAudience: 'Active Members'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'active':
        return 'success';
      case 'processing':
        return 'primary';
      case 'paused':
      case 'draft':
        return 'warning';
      case 'failed':
      case 'archived':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'devotional':
        return 'primary';
      case 'family':
        return 'success';
      case 'personal':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const toggleMessageStatus = (id: string) => {
    // Implementation for toggling message status
  };

  const deleteMessage = (id: string) => {
    // Implementation for deleting message
  };

  return (
    <>
      <Breadcrumb 
        pageTitle="Message Queue" 
        items={[
          { label: 'Admin Console', href: '/admin-console' },
          { label: 'Messages', href: '/admin-console/messages' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
              Automated Messages
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              Manage daily devotional messages sent to users and families
            </p>
          </div>

          {/* Message Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-[#18181b]">
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Queued Messages</p>
                    <p className="text-xl font-semibold">12</p>
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
                    <p className="text-small text-default-500">Total Recipients</p>
                    <p className="text-xl font-semibold">4,100</p>
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
                    <p className="text-small text-default-500">Next Scheduled</p>
                    <p className="text-xl font-semibold">In 2 hours</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Tabs 
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
            aria-label="Message queue tabs"
            className="mb-6"
          >
            <Tab
              key="queue"
              title={
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Message Queue</span>
                </div>
              }
            />
            <Tab
              key="templates"
              title={
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Templates</span>
                </div>
              }
            />
          </Tabs>

          {selectedTab === 'queue' && (
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <Send className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Message Queue</p>
                  <p className="text-small text-default-500">Scheduled and processing messages</p>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Message queue table">
                  <TableHeader>
                    <TableColumn>TITLE</TableColumn>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>SCHEDULED FOR</TableColumn>
                    <TableColumn>RECIPIENTS</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>PROGRESS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {queuedMessages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>{message.title}</TableCell>
                        <TableCell>
                          <Chip
                            color={getTypeColor(message.type)}
                            variant="flat"
                            size="sm"
                          >
                            {message.type.toUpperCase()}
                          </Chip>
                        </TableCell>
                        <TableCell>{new Date(message.scheduledFor).toLocaleString()}</TableCell>
                        <TableCell>{message.recipients.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(message.status)}
                            variant="flat"
                            size="sm"
                          >
                            {message.status.toUpperCase()}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Progress
                            size="sm"
                            value={message.progress}
                            color={message.status === 'processing' ? 'primary' : 'default'}
                            className="max-w-md"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => toggleMessageStatus(message.id)}
                            >
                              {message.status === 'paused' ? 
                                <Play className="w-4 h-4" /> : 
                                <Pause className="w-4 h-4" />
                              }
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => deleteMessage(message.id)}
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
          )}

          {selectedTab === 'templates' && (
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <MessageSquare className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Message Templates</p>
                  <p className="text-small text-default-500">Reusable message templates</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex justify-end mb-4">
                  <Button color="primary">
                    Create Template
                  </Button>
                </div>
                <Table aria-label="Message templates table">
                  <TableHeader>
                    <TableColumn>TITLE</TableColumn>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>LAST USED</TableColumn>
                    <TableColumn>TARGET AUDIENCE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {messageTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.title}</TableCell>
                        <TableCell>
                          <Chip
                            color={getTypeColor(template.type)}
                            variant="flat"
                            size="sm"
                          >
                            {template.type.toUpperCase()}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {template.lastUsed ? new Date(template.lastUsed).toLocaleString() : 'Never'}
                        </TableCell>
                        <TableCell>{template.targetAudience}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(template.status)}
                            variant="flat"
                            size="sm"
                          >
                            {template.status.toUpperCase()}
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