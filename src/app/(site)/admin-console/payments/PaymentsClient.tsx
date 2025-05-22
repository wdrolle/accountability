'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Button as NextUIButton,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
  Selection,
  SortDescriptor,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/react';
import { MoreVertical, ChevronDown, Search } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Button from '@/components/CustomButtons/Button';

interface StripePayment {
  id: string;
  amount: number;
  status: string;
  created: number;
  currency: string;
  customer: {
    email: string;
    name: string;
  } | null;
  payment_method: {
    type: string;
    card?: {
      brand: string;
      last4: string;
    };
  } | null;
  exists_in_db: boolean;
}

interface LocalPayment {
  id: string;
  amount: number;
  currency: string;
  payment_provider: string;
  payment_status: string;
  provider_payment_id: string;
  created_at: string;
  user: {
    email: string;
    name: string;
  };
  subscription_plans: {
    name: string;
    description: string;
  };
}

const columns = [
  { name: 'USER', uid: 'user', sortable: true },
  { name: 'AMOUNT', uid: 'amount', sortable: true },
  { name: 'STATUS', uid: 'status', sortable: true },
  { name: 'PROVIDER', uid: 'provider', sortable: true },
  { name: 'DATE', uid: 'date', sortable: true },
  { name: 'ACTIONS', uid: 'actions' }
];

const INITIAL_VISIBLE_COLUMNS = [
  'user',
  'amount',
  'status',
  'provider',
  'date',
  'actions'
];

export default function PaymentsClient() {
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'date',
    direction: 'descending'
  });
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/admin/payments');
        if (!response.ok) throw new Error('Failed to fetch payments');
        
        const data = await response.json();
        setPayments(data.payments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    return columns.filter(column =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  // Format payments data
  const allPayments = useMemo(() => 
    payments.map(payment => ({
      id: payment.id,
      user: payment.customer?.email || 'N/A',
      userName: payment.customer?.name || 'N/A',
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      provider: 'Stripe',
      date: new Date(payment.created * 1000),
      paymentMethod: payment.payment_method?.type || 'N/A',
      cardDetails: payment.payment_method?.card ? 
        `${payment.payment_method.card.brand} **** ${payment.payment_method.card.last4}` : 
        'N/A',
      exists_in_db: payment.exists_in_db
    })), [payments]);

  const filteredItems = useMemo(() => {
    return allPayments.filter(payment => {
      const searchContent = [
        payment.user,
        payment.userName,
        payment.status,
        payment.provider
      ].join(' ').toLowerCase();
      
      return !hasSearchFilter || searchContent.includes(filterValue.toLowerCase());
    });
  }, [allPayments, filterValue, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const renderCell = (payment: any, columnKey: string) => {
    switch (columnKey) {
      case 'user':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{payment.userName}</p>
            <p className="text-bold text-tiny capitalize text-default-500">{payment.user.toLowerCase()}</p>
          </div>
        );
      case 'amount':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {Number(payment.amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {payment.currency.toUpperCase()}
            </p>
            {payment.cardDetails !== 'N/A' && (
              <p className="text-bold text-tiny text-default-500">{payment.cardDetails}</p>
            )}
          </div>
        );
      case 'status':
        return (
          <div className="flex justify-center">
            <Chip
              className="capitalize"
              color={payment.status.toLowerCase() === 'succeeded' ? 'success' : 'warning'}
              size="sm"
              variant="shadow"
              style={{
                backgroundColor: payment.status.toLowerCase() === 'succeeded' ? '#17c964' : '#f5a524',
                color: 'white',
                padding: '0.5rem 1rem',
              }}
            >
              {payment.status}
            </Chip>
          </div>
        );
      case 'provider':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">Provider: {payment.provider}</p>
            <p className="text-bold text-tiny capitalize text-default-500">Payment Method: {payment.paymentMethod}</p>
          </div>
        );
      case 'date':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{payment.date.toLocaleDateString()}</p>
            <p className="text-bold text-tiny text-default-500">{payment.date.toLocaleTimeString()}</p>
          </div>
        );
      case 'actions':
        return (
          <div className="relative flex items-center justify-center w-full">
            <div className="flex justify-center min-w-[200px]">
              <Chip
                className="capitalize whitespace-normal text-center w-full py-2 px-4"
                color={payment.exists_in_db ? "success" : "danger"}
                size="sm"
                variant="shadow"
                style={{
                  backgroundColor: payment.exists_in_db ? '#17c964' : '#f31260',
                  color: 'white',
                  padding: '0.5rem 1rem',
                }}
              >
                {payment.exists_in_db ? "Synced to payments received" : "Not synced to payments received"}
              </Chip>
            </div>
            <div className="ml-2">
              <Dropdown>
                <DropdownTrigger>
                  <NextUIButton isIconOnly size="sm" variant="light">
                    <MoreVertical className="text-default-300" />
                  </NextUIButton>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem 
                    key="view" 
                    onPress={() => {
                      setSelectedPayment(payment);
                      onOpen();
                    }}
                  >
                    View Details
                  </DropdownItem>
                  <DropdownItem key="download">Download Receipt</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        );
      default:
        return payment[columnKey];
    }
  };

  const syncPayments = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/admin/payments/sync', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync payments');
      }
      
      // Refresh the payments data after sync
      const refreshResponse = await fetch('/api/admin/payments');
      if (!refreshResponse.ok) throw new Error('Failed to fetch payments');
      
      const data = await refreshResponse.json();
      setPayments(data.payments);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync payments');
    } finally {
      setIsSyncing(false);
    }
  };

  const topContent = useMemo(() => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-3 items-end">
        <div className="flex gap-3 items-center flex-1">
          <Input
            isClearable
            className="w-[400px]"
            classNames={{
              input: "text-base",
              inputWrapper: "h-12"
            }}
            placeholder="Search by name, email, status..."
            startContent={<Search className="text-default-400 w-5 h-5" />}
            value={filterValue}
            onClear={() => setFilterValue("")}
            onValueChange={setFilterValue}
          />
        </div>
        <div className="flex gap-3 items-center">
          <Button
            onClick={syncPayments}
            disabled={isSyncing}
            color="primary"
            size="sm"
          >
            {isSyncing ? "Syncing..." : "Sync Payments"}
          </Button>
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <NextUIButton variant="bordered" size="sm">
                Columns
                <ChevronDown className="w-4 h-4 ml-2" />
              </NextUIButton>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={visibleColumns}
              selectionMode="multiple"
              onSelectionChange={setVisibleColumns}
            >
              {columns.map((column) => (
                <DropdownItem key={column.uid} className="capitalize">
                  {column.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-default-400 text-small">
          Total {allPayments.length} payments
        </span>
      </div>
    </div>
  ), [filterValue, visibleColumns, allPayments.length]);

  const bottomContent = useMemo(() => (
    <div className="py-2 px-2 flex justify-between items-center">
      <Pagination
        showControls
        classNames={{
          cursor: "bg-foreground text-background",
        }}
        color="default"
        isDisabled={hasSearchFilter}
        page={page}
        total={pages}
        variant="light"
        onChange={setPage}
      />
      <span className="text-small text-default-400">
        {selectedKeys === "all"
          ? "All items selected"
          : `${selectedKeys.size} of ${items.length} selected`}
      </span>
    </div>
  ), [page, pages, selectedKeys, items.length, hasSearchFilter]);

  const generateReceipt = async (payment: any) => {
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Start generating content immediately without logo
    // Add company info with adjusted positioning for no logo
    doc.setFontSize(20);
    doc.text('RECEIPT', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('God Messages', pageWidth / 2, 40, { align: 'center' });
    doc.text('Your Trusted Message Provider', pageWidth / 2, 45, { align: 'center' });
    
    // Add receipt details
    doc.setFontSize(12);
    doc.text('Receipt Details', 15, 60);
    
    const receiptDetails = [
      ['Receipt Number:', payment.id],
      ['Date:', payment.date.toLocaleString()],
      ['Payment Method:', payment.paymentMethod],
      ['Status:', payment.status]
    ];
    
    // @ts-ignore
    doc.autoTable({
      startY: 65,
      head: [],
      body: receiptDetails,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 100 }
      }
    });
    
    // Add customer details
    // @ts-ignore
    const customerY = doc.lastAutoTable.finalY + 15;
    doc.text('Customer Details', 15, customerY);
    
    const customerDetails = [
      ['Name:', payment.userName],
      ['Email:', payment.user]
    ];
    
    // @ts-ignore
    doc.autoTable({
      startY: customerY + 5,
      head: [],
      body: customerDetails,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 100 }
      }
    });
    
    // Add payment details
    // @ts-ignore
    const paymentY = doc.lastAutoTable.finalY + 15;
    doc.text('Payment Details', 15, paymentY);
    
    const paymentDetails = [
      ['Amount:', `${payment.amount.toFixed(2)} ${payment.currency.toUpperCase()}`],
      ['Payment Provider:', payment.provider]
    ];
    
    if (payment.cardDetails !== 'N/A') {
      paymentDetails.push(['Card Details:', payment.cardDetails]);
    }
    
    if (payment.subscription_plans) {
      paymentDetails.push(
        ['Plan:', payment.subscription_plans.name],
        ['Description:', payment.subscription_plans.description]
      );
    }
    
    // @ts-ignore
    doc.autoTable({
      startY: paymentY + 5,
      head: [],
      body: paymentDetails,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 100 }
      }
    });
    
    // Add footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.text('Thank you for your business!', pageWidth / 2, footerY - 10, { align: 'center' });
    doc.text('For any questions, please contact support@godmessages.com', pageWidth / 2, footerY - 5, { align: 'center' });
    doc.text('© ' + new Date().getFullYear() + ' God Messages. All rights reserved.', pageWidth / 2, footerY, { align: 'center' });
    
    // Save the PDF
    doc.save(`receipt-${payment.id}.pdf`);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb 
        pageTitle="Payments" 
        items={[
          { label: 'Admin Console', href: '/admin-console' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-4">
              Payments Management
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              View and manage payment transactions.
            </p>
          </div>

          <Table
            aria-label="Payments table"
            isHeaderSticky
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            classNames={{
              wrapper: 'max-h-[382px] relative',
              base: 'bg-transparent',
              table: 'min-h-[200px]',
              thead: 'bg-default-100 dark:bg-default-50 sticky top-0 z-1',
              tbody: 'bg-transparent relative',
              tr: 'border-b border-default-100 hover:bg-default-100/40 relative',
              th: 'bg-default-100 dark:bg-default-50 text-default-500 py-3 text-center',
              td: 'py-3 align-middle text-center relative',
              emptyWrapper: 'h-[382px]',
              loadingWrapper: 'h-[382px]'
            }}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            sortDescriptor={sortDescriptor}
            topContent={topContent}
            topContentPlacement="outside"
            onSortChange={setSortDescriptor}
            selectionBehavior="toggle"
          >
            <TableHeader>
              {headerColumns.map((column) => (
                <TableColumn 
                  key={column.uid}
                  align={column.uid === "actions" ? "center" : "start"}
                  allowsSorting={column.sortable}
                >
                  {column.name}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody 
              items={items}
              loadingContent={<div>Loading payments...</div>}
              loadingState={isLoading ? "loading" : "idle"}
              emptyContent={error || "No payments found"}
            >
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey: React.Key) => (
                    <TableCell>
                      {renderCell(item, columnKey.toString())}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
        backdrop="blur"
        placement="center"
        classNames={{
          backdrop: "bg-black/50",
          base: "bg-white dark:bg-[#18181b] text-black dark:text-white",
          header: "border-b border-default-200",
          footer: "border-t border-default-200",
          closeButton: "hover:bg-default-200 active:bg-default-200/70 text-default-600",
          body: "py-6"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Payment Details
              </ModalHeader>
              <ModalBody>
                {selectedPayment && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">User Information</h3>
                        <div className="space-y-2">
                          <p><span className="font-medium">Name:</span> {selectedPayment.userName}</p>
                          <p><span className="font-medium">Email:</span> {selectedPayment.user}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                        <div className="space-y-2">
                          <p>
                            <span className="font-medium">Amount:</span> {selectedPayment.amount.toFixed(2)} {selectedPayment.currency.toUpperCase()}
                          </p>
                          <p><span className="font-medium">Status:</span> {selectedPayment.status}</p>
                          <p><span className="font-medium">Provider:</span> {selectedPayment.provider}</p>
                          <p><span className="font-medium">Payment Method:</span> {selectedPayment.paymentMethod}</p>
                          {selectedPayment.cardDetails !== 'N/A' && (
                            <p><span className="font-medium">Card Details:</span> {selectedPayment.cardDetails}</p>
                          )}
                          <p>
                            <span className="font-medium">Date:</span> {selectedPayment.date.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedPayment.provider === 'Stripe' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Stripe Details</h3>
                        <div className="space-y-2">
                          <p><span className="font-medium">Payment ID:</span> {selectedPayment.id}</p>
                        </div>
                      </div>
                    )}

                    {selectedPayment.subscription_plans && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
                        <div className="space-y-2">
                          <p><span className="font-medium">Plan:</span> {selectedPayment.subscription_plans.name}</p>
                          <p><span className="font-medium">Description:</span> {selectedPayment.subscription_plans.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <NextUIButton color="danger" variant="light" onPress={onClose}>
                  Close
                </NextUIButton>
                <NextUIButton 
                  color="primary" 
                  onPress={() => {
                    generateReceipt(selectedPayment);
                  }}
                >
                  Download Receipt
                </NextUIButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
} 