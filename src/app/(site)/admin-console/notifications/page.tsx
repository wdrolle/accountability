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
  Tab
} from '@nextui-org/react';
import { Bell, Mail, Book, MessageCircle } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type NewsletterSubscription = {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'unsubscribed';
  lastNewsletter: string;
  newsletterTitle: string;
  subscriptionDate: string;
};

type DailyDevotional = {
  id: string;
  title: string;
  sendDate: string;
  recipientCount: number;
  status: 'sent' | 'scheduled' | 'failed';
};

type SentMessage = {
  id: string;
  type: 'newsletter' | 'devotional' | 'system';
  subject: string;
  sentDate: string;
  recipientCount: number;
  deliveryRate: number;
};

export default function NotificationsPage() {
  const [selectedTab, setSelectedTab] = useState('newsletters');

  const newsletters: NewsletterSubscription[] = [
    {
      id: '1',
      email: 'john.doe@example.com',
      name: 'John Doe',
      status: 'active',
      lastNewsletter: '2024-01-20T09:00:00Z',
      newsletterTitle: 'January Monthly Update',
      subscriptionDate: '2023-12-01T10:00:00Z'
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      status: 'unsubscribed',
      lastNewsletter: '2024-01-15T09:00:00Z',
      newsletterTitle: 'January Monthly Update',
      subscriptionDate: '2023-11-15T14:30:00Z'
    }
  ];

  const devotionals: DailyDevotional[] = [
    {
      id: '1',
      title: 'Morning Reflection',
      sendDate: '2024-01-21T07:00:00Z',
      recipientCount: 1250,
      status: 'sent'
    },
    {
      id: '2',
      title: 'Evening Prayer',
      sendDate: '2024-01-21T18:00:00Z',
      recipientCount: 1180,
      status: 'scheduled'
    }
  ];

  const messages: SentMessage[] = [
    {
      id: '1',
      type: 'newsletter',
      subject: 'January Monthly Update',
      sentDate: '2024-01-20T09:00:00Z',
      recipientCount: 1500,
      deliveryRate: 98.5
    },
    {
      id: '2',
      type: 'devotional',
      subject: 'Morning Reflection',
      sentDate: '2024-01-21T07:00:00Z',
      recipientCount: 1250,
      deliveryRate: 99.2
    },
    {
      id: '3',
      type: 'system',
      subject: 'System Maintenance Notice',
      sentDate: '2024-01-19T15:00:00Z',
      recipientCount: 2000,
      deliveryRate: 100
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'sent':
        return 'success';
      case 'unsubscribed':
      case 'failed':
        return 'danger';
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'newsletter':
        return 'primary';
      case 'devotional':
        return 'secondary';
      case 'system':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Breadcrumb 
        pageTitle="Notifications" 
        items={[
          { label: 'Admin Console', href: '/admin-console' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">
              Notification Manager
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              Manage system notifications, newsletters, and message delivery
            </p>
          </div>

          <Tabs 
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key.toString())}
            aria-label="Notification tabs"
            className="mb-6"
          >
            <Tab
              key="newsletters"
              title={
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Newsletter Subscriptions</span>
                </div>
              }
            />
            <Tab
              key="devotionals"
              title={
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4" />
                  <span>Daily Devotionals</span>
                </div>
              }
            />
            <Tab
              key="messages"
              title={
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Sent Messages</span>
                </div>
              }
            />
          </Tabs>

          {selectedTab === 'newsletters' && (
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <Mail className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Newsletter Subscriptions</p>
                  <p className="text-small text-default-500">Manage newsletter subscribers</p>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Newsletter subscriptions table">
                  <TableHeader>
                    <TableColumn>EMAIL</TableColumn>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>LAST NEWSLETTER</TableColumn>
                    <TableColumn>NEWSLETTER TITLE</TableColumn>
                    <TableColumn>SUBSCRIPTION DATE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {newsletters.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.email}</TableCell>
                        <TableCell>{sub.name}</TableCell>
                        <TableCell>{new Date(sub.lastNewsletter).toLocaleString()}</TableCell>
                        <TableCell>{sub.newsletterTitle}</TableCell>
                        <TableCell>{new Date(sub.subscriptionDate).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(sub.status)}
                            variant="flat"
                            size="sm"
                          >
                            {sub.status.toUpperCase()}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}

          {selectedTab === 'devotionals' && (
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <Book className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Daily Devotionals</p>
                  <p className="text-small text-default-500">Track daily devotional messages</p>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Daily devotionals table">
                  <TableHeader>
                    <TableColumn>TITLE</TableColumn>
                    <TableColumn>SEND DATE</TableColumn>
                    <TableColumn>RECIPIENTS</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {devotionals.map((dev) => (
                      <TableRow key={dev.id}>
                        <TableCell>{dev.title}</TableCell>
                        <TableCell>{new Date(dev.sendDate).toLocaleString()}</TableCell>
                        <TableCell>{dev.recipientCount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            color={getStatusColor(dev.status)}
                            variant="flat"
                            size="sm"
                          >
                            {dev.status.toUpperCase()}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}

          {selectedTab === 'messages' && (
            <Card className="bg-white dark:bg-[#18181b]">
              <CardHeader className="flex gap-3">
                <MessageCircle className="w-6 h-6" />
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-black dark:text-white">Sent Messages</p>
                  <p className="text-small text-default-500">History of all sent messages</p>
                </div>
              </CardHeader>
              <CardBody>
                <Table aria-label="Sent messages table">
                  <TableHeader>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>SUBJECT</TableColumn>
                    <TableColumn>SENT DATE</TableColumn>
                    <TableColumn>RECIPIENTS</TableColumn>
                    <TableColumn>DELIVERY RATE</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <Chip
                            color={getTypeColor(msg.type)}
                            variant="flat"
                            size="sm"
                          >
                            {msg.type.toUpperCase()}
                          </Chip>
                        </TableCell>
                        <TableCell>{msg.subject}</TableCell>
                        <TableCell>{new Date(msg.sentDate).toLocaleString()}</TableCell>
                        <TableCell>{msg.recipientCount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            color={msg.deliveryRate >= 98 ? 'success' : 'warning'}
                            variant="flat"
                            size="sm"
                          >
                            {msg.deliveryRate}%
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