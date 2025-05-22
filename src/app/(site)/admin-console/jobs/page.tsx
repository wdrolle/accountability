// src/app/(site)/admin-console/jobs/page.tsx

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
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
  Selection,
  SortDescriptor,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@nextui-org/react';
import { MoreVertical, ChevronDown, Search, Plus, ChevronRight, ChevronUp } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type Job = {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string | null;
  runDetails?: JobRunDetail[];
};

type JobRunDetail = {
  runid: number;
  job_pid: number | null;
  database: string | null;
  username: string | null;
  command: string | null;
  status: string | null;
  return_message: string | null;
  start_time: string | null;
  end_time: string | null;
};

const columns = [
  { name: 'JOB ID', uid: 'jobid', sortable: true },
  { name: 'JOB NAME', uid: 'jobname', sortable: true },
  { name: 'SCHEDULE', uid: 'schedule', sortable: true },
  { name: 'COMMAND', uid: 'command', sortable: false },
  { name: 'NODE', uid: 'nodename', sortable: true },
  { name: 'DATABASE', uid: 'database', sortable: true },
  { name: 'USERNAME', uid: 'username', sortable: true },
  { name: 'STATUS', uid: 'active', sortable: true },
  { name: 'ACTIONS', uid: 'actions' }
];

const INITIAL_VISIBLE_COLUMNS = [
  'jobid',
  'jobname',
  'schedule',
  'command',
  'active',
  'actions'
];

type Color =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'jobid',
    direction: 'ascending'
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set([]));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editedJob, setEditedJob] = useState<Partial<Job>>({});
  const [selectedColor, setSelectedColor] = useState<Color>('primary');
  const colors: Color[] = [
    'default',
    'primary',
    'secondary',
    'success',
    'warning',
    'danger'
  ];
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const HISTORY_ROWS_PER_PAGE = 5;

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobRunDetails = async (jobId: number) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/runs`);
      if (!response.ok) {
        throw new Error('Failed to fetch job run details');
      }
      const data = await response.json();
      
      // Update the specific job with run details
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.jobid === jobId 
            ? { ...job, runDetails: data }
            : job
        )
      );

      // Also update selectedJob if it matches
      setSelectedJob(prev => 
        prev?.jobid === jobId 
          ? { ...prev, runDetails: data }
          : prev
      );
    } catch (error) {
      console.error('Error fetching job run details:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch run details');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setEditedJob({
      jobname: job.jobname || '',
      schedule: job.schedule,
      command: job.command,
      nodename: job.nodename,
      database: job.database,
      username: job.username
    });
    onOpen();
  };

  const handleSaveJob = async () => {
    if (!selectedJob) return;
    setIsSaving(true);
    setSaveError(null);

    // Ensure all required fields are present
    const requiredFields = ['schedule', 'command', 'nodename', 'database', 'username'];
    const missingFields = requiredFields.filter(field => {
      const value = editedJob[field as keyof typeof editedJob];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      setSaveError(`Missing required fields: ${missingFields.join(', ')}`);
      setIsSaving(false);
      return;
    }

    // Validate and sanitize the data
    const payload = {
      jobname: typeof editedJob.jobname === 'string' ? editedJob.jobname : null,
      schedule: String(editedJob.schedule),
      command: String(editedJob.command),
      nodename: String(editedJob.nodename),
      database: String(editedJob.database),
      username: String(editedJob.username)
    };

    // console.log('[DEBUG] Sending payload:', payload);

    try {
      const response = await fetch(`/api/admin/jobs/${selectedJob.jobid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from server");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update job');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data from server');
      }

      // Update the jobs list with the edited job
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.jobid === selectedJob.jobid
            ? { ...job, ...data }
            : job
        )
      );

      onClose();
    } catch (error) {
      console.error('Error updating job:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update job');
    } finally {
      setIsSaving(false);
    }
  };

  const getFilteredHistory = (runDetails: JobRunDetail[] | undefined) => {
    if (!runDetails) return { items: [], pages: 0 };
    
    let filtered = runDetails;
    if (historySearch) {
      filtered = runDetails.filter(run => 
        run.return_message?.toLowerCase().includes(historySearch.toLowerCase()) ||
        run.status?.toLowerCase().includes(historySearch.toLowerCase()) ||
        run.runid.toString().includes(historySearch)
      );
    }
    
    const pages = Math.ceil(filtered.length / HISTORY_ROWS_PER_PAGE);
    const start = (historyPage - 1) * HISTORY_ROWS_PER_PAGE;
    const items = filtered.slice(start, start + HISTORY_ROWS_PER_PAGE);
    
    return { items, pages, totalItems: filtered.length };
  };

  const handleViewHistory = (job: Job) => {
    setSelectedJob(job);
    setHistoryPage(1);
    setHistorySearch('');
    onOpen();
    fetchJobRunDetails(job.jobid);
  };

  const renderCell = (job: Job, columnKey: string) => {
    switch (columnKey) {
      case 'jobid':
        return job.jobid;
      case 'active':
        return (
          <Chip
            className="capitalize"
            color={job.active ? 'success' : 'danger'}
            size="sm"
            variant="flat"
          >
            {job.active ? 'Active' : 'Inactive'}
          </Chip>
        );
      case 'actions':
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Button 
              size="sm" 
              variant="light"
              onPress={() => handleViewHistory(job)}
            >
              View History
            </Button>
          </div>
        );
      default:
        const value = job[columnKey as keyof Job];
        return value !== null && value !== undefined ? String(value) : '';
    }
  };

  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredJobs = [...jobs];
    if (filterValue) {
      filteredJobs = filteredJobs.filter((job) =>
        job.jobname?.toLowerCase().includes(filterValue.toLowerCase()) ||
        job.command.toLowerCase().includes(filterValue.toLowerCase()) ||
        job.username.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    return filteredJobs;
  }, [jobs, filterValue]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by job name, command, or username..."
            startContent={<Search className="w-4 h-4" />}
            value={filterValue}
            onClear={() => setFilterValue("")}
            onValueChange={setFilterValue}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  endContent={<ChevronDown className="w-4 h-4" />}
                  variant="flat"
                >
                  Columns
                </Button>
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
            <Button 
              color="primary" 
              endContent={<Plus className="w-4 h-4" />}
            >
              Add New Job
            </Button>
          </div>
        </div>
      </div>
    );
  }, [filterValue, visibleColumns]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="text-default-400 text-small">
          Total {jobs.length} jobs
        </span>
        <Pagination
          showControls
          classNames={{
            cursor: "bg-foreground text-background",
          }}
          color="default"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    );
  }, [page, pages, jobs.length]);

  return (
    <>
      <Breadcrumb 
        pageTitle="Jobs" 
        items={[
          { label: 'Admin Console', href: '/admin-console' }
        ]} 
      />
    <div className="p-6">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-4">
            Job Management
          </h1>
          <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
            Manage and monitor system jobs and tasks.
          </p>
        </div>

        <Table
          
          aria-label="Jobs table"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-[382px] overflow-hidden', // Ensure no overflow
            base: 'bg-white dark:bg-[#18181b] text-black dark:text-white',
            table: 'min-h-[200px]',
            thead: 'sticky top-0 z-20 bg-white dark:bg-blue-500', // Fix header alignment
            tbody: 'bg-white dark:bg-[#18181b] overflow-hidden', // Prevent extra spacing
            tr: 'border-b border-default-100 dark:border-default-50 hover:bg-default-100 dark:hover:bg-default-50 data-[selected=true]:!bg-blue-500/20 data-[selected=true]:!text-blue-600 dark:data-[selected=true]:!bg-blue-500/20 dark:data-[selected=true]:!text-blue-400',
            th: 'bg-default-100 dark:bg-black/50 text-default-500 dark:text-default-400 py-2', // Align header properly
            td: 'text-default-600 dark:text-default-300',
            emptyWrapper: 'h-[382px]',
            loadingWrapper: 'h-[382px]'
          }}
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          color={selectedColor}
          defaultSelectedKeys={new Set(['2'])}
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
            loadingContent={<div>Loading jobs...</div>}
            loadingState={loading ? "loading" : "idle"}
            emptyContent={error || "No jobs found"}
          >
            {(item) => (
              <TableRow key={item.jobid}>
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

      
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        onOpenChange={onClose}
        size="5xl"
        backdrop="blur"
        placement="center"
        hideCloseButton={true}
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "border-[#292f46] bg-white dark:bg-[#18181b] m-4",
          header: "border-b-[1px] border-[#292f46]",
          body: "py-6 px-6",
          footer: "border-t-[1px] border-[#292f46] px-6",
          closeButton: "hover:bg-white/5 active:bg-white/10"
        }}
      >
        <ModalContent>
          {(onClose) => {
            const { items: historyItems, pages: historyPages, totalItems } = getFilteredHistory(selectedJob?.runDetails);
            
            return (
              <>
                <ModalHeader className="flex flex-col gap-1 px-6">
                  <h3 className="text-xl font-bold text-black dark:text-white">
                    Run History - {selectedJob?.jobname || `Job ${selectedJob?.jobid}`}
                  </h3>
                </ModalHeader>
                <ModalBody>
                  {historyLoading ? (
                    <div className="flex justify-center items-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : selectedJob?.runDetails ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <Input
                          isClearable
                          className="w-full sm:max-w-[44%]"
                          placeholder="Search runs..."
                          startContent={<Search className="w-4 h-4" />}
                          value={historySearch}
                          onClear={() => setHistorySearch('')}
                          onValueChange={setHistorySearch}
                        />
                        <span className="text-default-400 text-small">
                          Total {totalItems} runs
                        </span>
                      </div>
                      <Table 
                        aria-label="Job run details"
                        classNames={{
                          base: "max-w-full",
                          table: "min-w-full",
                          th: "bg-default-100 dark:bg-black/50 text-black dark:text-white",
                          td: "text-black dark:text-white whitespace-nowrap",
                          tr: "border-b border-default-100 dark:border-default-50"
                        }}
                      >
                        <TableHeader>
                          <TableColumn>RUN ID</TableColumn>
                          <TableColumn>STATUS</TableColumn>
                          <TableColumn>START TIME</TableColumn>
                          <TableColumn>END TIME</TableColumn>
                          <TableColumn className="w-full">RETURN MESSAGE</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {historyItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center">
                                {historySearch ? 'No matching runs found' : 'No run history available'}
                              </TableCell>
                            </TableRow>
                          ) : (
                            historyItems.map((run) => (
                              <TableRow key={run.runid}>
                                <TableCell>{run.runid}</TableCell>
                                <TableCell>
                                  <Chip
                                    className="capitalize"
                                    color={run.status === 'success' ? 'success' : 'danger'}
                                    size="sm"
                                    variant="flat"
                                  >
                                    {run.status || 'Unknown'}
                                  </Chip>
                                </TableCell>
                                <TableCell>{run.start_time ? new Date(run.start_time).toLocaleString() : 'N/A'}</TableCell>
                                <TableCell>{run.end_time ? new Date(run.end_time).toLocaleString() : 'N/A'}</TableCell>
                                <TableCell className="truncate max-w-xl">{run.return_message || 'N/A'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      {historyPages > 1 && (
                        <div className="flex justify-center">
                          <Pagination
                            showControls
                            total={historyPages}
                            page={historyPage}
                            onChange={setHistoryPage}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-black dark:text-white">No run history available</div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="primary" variant="light" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </div>
    </>
  );
} 