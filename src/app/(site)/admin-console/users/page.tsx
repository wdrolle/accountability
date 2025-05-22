'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Button,
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
import { MoreVertical, ChevronDown, Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

type User = {
  id: string;
  email: string | null;
  name: string;
  role: string;
  status: string;
  created_at: string;
  last_sign_in: string | null;
  is_super_admin: boolean;
  raw_app_meta_data: {
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  } | null;
  details: {
    image: string | null;
    phone?: string;
    family_members: Array<{
      member_id: string;
      added_at: string | null;
      user: {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
      };
    }>;
    family_invitations: Array<{
      id: string;
      status: string;
      email: string;
      created_at: string | null;
      updated_at: string | null;
      invitation_code: string;
      user?: {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
      };
    }>;
    family_subscription: {
      owner_id: string;
      status: string;
      created_at: string | null;
    } | null;
    files_in_storage: Array<{
      id: string;
      file_url: string;
      filename: string;
      created_at: string | null;
    }>;
    newsletter_subscriptions: Array<{
      id: string;
      status: string;
      created_at: string | null;
    }>;
    sent_messages: Array<{
      id: string;
      message: string;
      sent_at: string | null;
      delivery_status: string;
    }>;
    subscriptions: Array<{
      id: string;
      subscription_plan: string;
      status: string;
      created_at: string | null;
    }>;
    usage: Array<{
      date: string;
      count: number;
    }>;
    user_preference: {
      theme_preferences: string[];
      blocked_themes: string[];
      preferred_agents_version: string[];
      message_length_preference: string | null;
    } | null;
    user_subscriptions: {
      subscription_plan_id: string;
      start_date: string;
      end_date: string | null;
      status: string;
    } | null;
  };
};

type SortableColumn = keyof Pick<
  User,
  'name' | 'email' | 'role' | 'status' | 'created_at' | 'last_sign_in'
>;

const columns = [
  { name: 'USER', uid: 'name', sortable: true },
  { name: 'EMAIL', uid: 'email', sortable: true },
  { name: 'ROLE', uid: 'role', sortable: true },
  { name: 'STATUS', uid: 'status', sortable: true },
  { name: 'CREATED AT', uid: 'created_at', sortable: true },
  { name: 'LAST Log In', uid: 'last_sign_in', sortable: true },
  { name: 'ACTIONS', uid: 'actions' }
];

const INITIAL_VISIBLE_COLUMNS = [
  'name',
  'email',
  'role',
  'status',
  'created_at',
  'actions'
];

type Color =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

/**
 * Returns a Chip color based on the provided user status.
 * Example mapping:
 *  - ACTIVE => success
 *  - BANNED, DELETED => danger
 *  - PENDING, PAUSED, VACATION => warning
 *  - (default) => default
 */
// Helper that maps a user status to a NextUI color
function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'success';   // Green
    case 'BANNED':
    case 'DELETED':
      return 'danger';    // Red
    case 'PENDING':
    case 'PAUSED':
    case 'VACATION':
      return 'warning';   // Yellow
    default:
      return 'default';   // Gray
  }
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = useState<Selection>(
    new Set(['all'])
  );
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending'
  });
  const [page, setPage] = useState(1);
  const [selectedColor, setSelectedColor] = useState<Color>('primary');
  const colors: Color[] = [
    'default',
    'primary',
    'secondary',
    'success',
    'warning',
    'danger'
  ];
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  const { 
    isOpen: isFamilyOpen, 
    onOpen: onFamilyOpen, 
    onClose: onFamilyClose 
  } = useDisclosure();
  const { 
    isOpen: isSubscriptionsOpen, 
    onOpen: onSubscriptionsOpen, 
    onClose: onSubscriptionsClose 
  } = useDisclosure();
  const { 
    isOpen: isMessagesOpen, 
    onOpen: onMessagesOpen, 
    onClose: onMessagesClose 
  } = useDisclosure();
  const { 
    isOpen: isBanOpen, 
    onOpen: onBanOpen, 
    onClose: onBanClose 
  } = useDisclosure();
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    raw_app_meta_data: {}
  });

  useEffect(() => {
    if (selectedUser) {
      const [firstName = '', lastName = ''] = (selectedUser.name || '').split(' ');
      setEditForm({
        first_name: selectedUser.raw_app_meta_data?.first_name || firstName,
        last_name: selectedUser.raw_app_meta_data?.last_name || lastName,
        email: selectedUser.email || '',
        phone: selectedUser.raw_app_meta_data?.phone || '',
        role: selectedUser.role || '',
        raw_app_meta_data: selectedUser.raw_app_meta_data || {}
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const updatedData = {
        ...editForm,
        name: `${editForm.first_name} ${editForm.last_name}`.trim(),
        raw_app_meta_data: {
          ...editForm.raw_app_meta_data,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone
        }
      };

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Refresh the users list
      await fetchUsers();
      onEditClose();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = columns.filter(column =>
    Array.from(visibleColumns).includes(column.uid)
  );

  const filteredItems = users.filter(user => {
    const matchesSearch =
      !hasSearchFilter ||
      user.name.toLowerCase().includes(filterValue.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(filterValue.toLowerCase());

    const selectedStatuses = Array.from(statusFilter);
    const matchesStatus =
      selectedStatuses.includes('all') ||
      selectedStatuses.includes(user.status);

    return matchesSearch && matchesStatus;
  });

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const sortedItems = [...filteredItems].sort((a: User, b: User) => {
    const column = sortDescriptor.column as SortableColumn;
    const first = a[column];
    const second = b[column];

    if (first == null) return 1;
    if (second == null) return -1;
    if (first === second) return 0;

    const cmp = first < second ? -1 : 1;
    return sortDescriptor.direction === 'descending' ? -cmp : cmp;
  });

  const items = sortedItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const renderCell = (user: User, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 min-w-[40px]">
              <img
                className="w-full h-full rounded-full object-cover"
                src={
                  user.raw_app_meta_data?.avatar_url ||
                  (user.details.image
                    ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${user.details.image}`
                    : null) ||
                  user.details.files_in_storage?.[0]?.file_url ||
                  '/images/fallback-image.jpg'
                }
                alt={user.name}
                onError={e => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'images/favicon.ico';
                }}
              />
            </div>
            <span className="text-sm">{user.name}</span>
          </div>
        );
      case 'role':
        return (
          <div className="flex items-center gap-2">
            <span className="capitalize">{user.role}</span>
            {user.is_super_admin && (
              <Chip size="sm" color="primary" variant="flat">
                Admin
              </Chip>
            )}
          </div>
        );
        case 'status': {
          const status = user.status.toUpperCase();
          let chipColor: "success" | "danger" | "warning" | "default";
          
          switch (status) {
            case 'ACTIVE':
              chipColor = 'success';
              break;
            case 'BANNED':
            case 'DELETED':
              chipColor = 'danger';
              break;
            case 'PENDING':
            case 'PAUSED':
            case 'VACATION':
              chipColor = 'warning';
              break;
            default:
              chipColor = 'default';
          }

          return (
            <Chip
              color={chipColor}
              radius="sm"
            >
              {status}
            </Chip>
          );
        }
      case 'created_at':
      case 'last_sign_in': {
        const dateValue = user[columnKey as 'created_at' | 'last_sign_in'];
        return dateValue ? new Date(dateValue).toLocaleDateString() : '-';
      }
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu className="bg-white dark:bg-[#18181b]">
              <DropdownItem 
                key="edit" 
                onClick={() => {
                  setSelectedUser(user);
                  onEditOpen();
                }}
              >
                Edit User
              </DropdownItem>
              <DropdownItem 
                key="family" 
                onClick={() => {
                  setSelectedUser(user);
                  onFamilyOpen();
                }}
              >
                View Family
              </DropdownItem>
              <DropdownItem 
                key="subscriptions" 
                onClick={() => {
                  setSelectedUser(user);
                  onSubscriptionsOpen();
                }}
              >
                View Subscriptions
              </DropdownItem>
              <DropdownItem 
                key="messages" 
                onClick={() => {
                  setSelectedUser(user);
                  onMessagesOpen();
                }}
              >
                View Messages
              </DropdownItem>
              {user.status.toLowerCase() === 'active' ? (
                <DropdownItem
                  key="ban"
                  className="text-danger"
                  color="danger"
                  onClick={() => {
                    setSelectedUser(user);
                    onBanOpen();
                  }}
                >
                  Ban User
                </DropdownItem>
              ) : user.status.toLowerCase() === 'banned' ? (
                <DropdownItem
                  key="unban"
                  className="text-success"
                  color="success"
                  onClick={() => {
                    setSelectedUser(user);
                    onBanOpen();
                  }}
                >
                  Unban User
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        );
      default: {
        const value = user[columnKey as keyof User];
        return value?.toString() || '-';
      }
    }
  };

  const onSearchChange = (value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue('');
    }
  };

  const topContent = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: 'w-full sm:max-w-[44%] p-4',
              inputWrapper: 'border-1'
            }}
            placeholder="Search by name or email..."
            size="sm"
            startContent={<Search className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue('')}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDown className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
                className="bg-white dark:bg-[#18181b]"
              >
                <DropdownItem key="all">All</DropdownItem>
                <DropdownItem key="active">Active</DropdownItem>
                <DropdownItem key="pending">Pending</DropdownItem>
                <DropdownItem key="banned">Banned</DropdownItem>
                <DropdownItem key="deleted">Deleted</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDown className="text-small" />}
                  size="sm"
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
                className="bg-white dark:bg-[#18181b]"
              >
                {columns.map(column => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {column.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDown className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Selection Color
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Selection Color"
                selectedKeys={new Set([selectedColor])}
                selectionMode="single"
                onSelectionChange={keys => {
                  const selected = Array.from(keys)[0];
                  if (selected && colors.includes(selected as Color)) {
                    setSelectedColor(selected as Color);
                  }
                }}
                className="bg-white dark:bg-[#18181b]"
              >
                {colors.map(color => (
                  <DropdownItem key={color} className="capitalize">
                    {color}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              className="bg-foreground text-background pl-4"
              endContent={<Plus className="w-4 h-4" />}
              size="sm"
            >
              Add New
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-default-400 text-small pl-4">
          Total {users.length} users
        </span>
        <label className="flex items-center text-default-400 text-small pr-4">
          Rows per page:
          <select
            className="light:bg-white dark:bg-[#18181b] outline-none text-default-400 text-small"
            onChange={e => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
      </div>
    </div>
  );

  const bottomContent = (
    <div className="py-2 px-2 flex justify-between items-center">
      <Pagination
        showControls
        classNames={{
          cursor: 'bg-foreground text-background'
        }}
        color="default"
        isDisabled={hasSearchFilter}
        page={page}
        total={pages}
        variant="light"
        onChange={setPage}
      />
      <span className="text-small text-default-400">
        {selectedKeys === 'all'
          ? 'All items selected'
          : `${selectedKeys.size} of ${items.length} selected`}
      </span>
    </div>
  );

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
        pageTitle="Users" 
        items={[
          { label: 'Admin Console', href: '/admin-console' }
        ]} 
      />
      <div className="p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-4">
              User Management
            </h1>
            <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
              View and manage user accounts, roles, and permissions.
            </p>
          </div>

          <Table
            aria-label="Users table"
            isHeaderSticky
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            classNames={{
              wrapper: 'max-h-[382px] overflow-hidden', // Ensure no overflow
              base: 'bg-white dark:bg-[#18181b] text-black dark:text-white',
              table: 'min-h-[100px]',
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

            <TableHeader columns={headerColumns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.uid === 'actions' ? 'center' : 'start'}
                  allowsSorting={column.sortable}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={items}
              isLoading={loading}
              loadingContent={
                <div className="h-[400px] flex items-center justify-center">
                  Loading users...
                </div>
              }
              emptyContent={
                hasSearchFilter ? 'No users found' : 'No users available'
              }
            >
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(item, columnKey.toString())}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit User Modal */}
        <Modal 
          isOpen={isEditOpen} 
          onClose={onEditClose}
          onOpenChange={onEditClose}
          size="2xl"
          backdrop="blur"
          placement="center"
          isDismissable={true}
          classNames={{
            backdrop: "bg-black/50",
            base: "bg-white dark:bg-[#18181b] text-black dark:text-white",
            header: "border-b border-default-200",
            footer: "border-t border-default-200",
            closeButton: "hover:bg-default-200 active:bg-default-200/70 text-default-600",
            body: "p-6"
          }}
        >
          <ModalContent>
            <ModalHeader>Edit User</ModalHeader>
            <ModalBody>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <Input
                        value={editForm.first_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="First Name"
                        variant="bordered"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <Input
                        value={editForm.last_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Last Name"
                        variant="bordered"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      type="email"
                      variant="bordered"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone"
                      type="tel"
                      variant="bordered"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full rounded-md border border-default-200 bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onEditClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleEditUser}>
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Family Modal */}
        <Modal 
          isOpen={isFamilyOpen} 
          onClose={onFamilyClose}
          onOpenChange={onFamilyClose}
          size="2xl"
          backdrop="blur"
          placement="center"
          hideCloseButton={true}
          classNames={{
            backdrop: "bg-black/50",
            base: "bg-white dark:bg-[#18181b] text-black dark:text-white",
            header: "border-b border-default-200",
            footer: "border-t border-default-200",
            body: "p-6"
          }}
        >
          <ModalContent>
            <ModalHeader>Family Members Associated with: {selectedUser?.name}, {selectedUser?.email}</ModalHeader>
            <ModalBody>
              {selectedUser && (
                <div className="space-y-8">
                  {/* Family Members Section */}
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-4">Family Members</h4>
                    {selectedUser.details.family_invitations?.filter(inv => inv.status === 'ACCEPTED').length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.details.family_invitations
                          .filter(inv => inv.status === 'ACCEPTED')
                          .map((member) => (
                            <div key={member.id} className="p-3 border rounded-lg dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-black dark:text-white">
                                    {member.user?.first_name || ''} {member.user?.last_name || ''}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {member.email}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Added: {member.updated_at ? new Date(member.updated_at).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <Chip size="sm" color="success">ACTIVE</Chip>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p>No family members</p>
                      </div>
                    )}
                  </div>

                  {/* Pending Invitations Section */}
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-4">Pending Invitations</h4>
                    {selectedUser.details.family_invitations?.filter(inv => inv.status === 'PENDING').length > 0 ? (
                      <div className="space-y-4">
                        {selectedUser.details.family_invitations
                          .filter(inv => inv.status === 'PENDING')
                          .map((invitation) => (
                            <div key={invitation.id} className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{invitation.email}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Code: {invitation.invitation_code || 'No code'}
                                  </p>
                                  <div className="flex gap-4">
                                    <p className="text-xs text-gray-400 mt-1">
                                      Sent: {invitation.created_at ? new Date(invitation.created_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <Chip size="sm" color="warning">PENDING</Chip>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p>No pending invitations</p>
                      </div>
                    )}
                  </div>

                  {/* Accepted Invitations Section */}
                  <div>
                    <h4 className="text-lg font-medium text-black dark:text-white mb-4">Accepted Invitations</h4>
                    {selectedUser.details.family_invitations?.filter(inv => inv.status === 'ACCEPTED').length > 0 ? (
                      <div className="space-y-4">
                        {selectedUser.details.family_invitations
                          .filter(inv => inv.status === 'ACCEPTED')
                          .map((invitation) => (
                            <div key={invitation.id} className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                              <div className="flex items-center justify-between">
                                <div>
                                  {invitation.user && (
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                      {invitation.user.first_name || ''} {invitation.user.last_name || ''}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{invitation.email}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Code: {invitation.invitation_code || 'No code'}
                                  </p>
                                  <div className="flex gap-4">
                                    <p className="text-xs text-gray-400 mt-1">
                                      Sent: {invitation.created_at ? new Date(invitation.created_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Accepted: {invitation.updated_at ? new Date(invitation.updated_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <Chip size="sm" color="success">ACCEPTED</Chip>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p>No accepted invitations</p>
                      </div>
                    )}
                  </div>

                  {/* Family Subscription Info */}
                  {selectedUser.details.family_subscription && (
                    <div>
                      <h4 className="text-lg font-medium text-black dark:text-white mb-4">Family Subscription</h4>
                      <div className="p-4 border rounded-lg dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Owner ID: {selectedUser.details.family_subscription.owner_id}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Created: {selectedUser.details.family_subscription.created_at ? new Date(selectedUser.details.family_subscription.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <Chip size="sm" color="success">ACTIVE</Chip>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button 
                color="primary" 
                onPress={onFamilyClose}
                className="bg-[#18181b] hover:bg-[#27272a] text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                size="md"
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Subscriptions Modal */}
        <Modal 
          isOpen={isSubscriptionsOpen} 
          onClose={onSubscriptionsClose}
          onOpenChange={onSubscriptionsClose}
          size="2xl"
          backdrop="blur"
          placement="center"
          isDismissable={true}
          classNames={{
            backdrop: "bg-black/50",
            base: "bg-white dark:bg-[#18181b] text-black dark:text-white",
            header: "border-b border-default-200",
            footer: "border-t border-default-200",
            closeButton: "hover:bg-default-200 active:bg-default-200/70 text-default-600",
            body: "p-6"
          }}
        >
          <ModalContent>
            <ModalHeader>Subscriptions</ModalHeader>
            <ModalBody>
              {selectedUser && (
                <div className="space-y-4">
                  {selectedUser.details.subscriptions.map(sub => (
                    <div key={sub.id} className="p-4 border rounded">
                      <p>Plan: {sub.subscription_plan}</p>
                      <p>Status: {sub.status}</p>
                      <p>Created: {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  ))}
                  {selectedUser.details.subscriptions.length === 0 && (
                    <p>No subscriptions found.</p>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onSubscriptionsClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Messages Modal */}
        <Modal 
          isOpen={isMessagesOpen} 
          onClose={onMessagesClose}
          onOpenChange={onMessagesClose}
          size="2xl"
          backdrop="blur"
          placement="center"
          isDismissable={true}
          classNames={{
            backdrop: "bg-black/50",
            base: "bg-white dark:bg-[#18181b] text-black dark:text-white",
            header: "border-b border-default-200",
            footer: "border-t border-default-200",
            closeButton: "hover:bg-default-200 active:bg-default-200/70 text-default-600",
            body: "p-6"
          }}
        >
          <ModalContent>
            <ModalHeader>Messages</ModalHeader>
            <ModalBody>
              {selectedUser && (
                <div className="space-y-4">
                  {selectedUser.details.sent_messages.map(msg => (
                    <div key={msg.id} className="p-4 border rounded">
                      <p>Message: {msg.message}</p>
                      <p>Status: {msg.delivery_status}</p>
                      <p>Sent: {msg.sent_at ? new Date(msg.sent_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  ))}
                  {selectedUser.details.sent_messages.length === 0 && (
                    <p>No messages found.</p>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onMessagesClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Ban/Unban Modal */}
        <Modal 
          isOpen={isBanOpen} 
          onClose={onBanClose}
          onOpenChange={onBanClose}
          backdrop="blur"
          placement="center"
          isDismissable={true}
          classNames={{
            backdrop: "bg-black/50",
            base: "bg-white dark:bg-[#18181b] text-black dark:text-white",
            header: "border-b border-default-200",
            footer: "border-t border-default-200",
            closeButton: "hover:bg-default-200 active:bg-default-200/70 text-default-600",
            body: "p-6"
          }}
        >
          <ModalContent>
            <ModalHeader>{selectedUser?.status.toLowerCase() === 'banned' ? 'Unban User' : 'Ban User'}</ModalHeader>
            <ModalBody>
              {selectedUser && (
                <div>
                  <p>Are you sure you want to {selectedUser.status.toLowerCase() === 'banned' ? 'unban' : 'ban'} {selectedUser.name}?</p>
                  <p className="text-sm text-gray-500 mt-2">This action can be reversed later.</p>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onBanClose}>
                Cancel
              </Button>
              <Button 
                color={selectedUser?.status.toLowerCase() === 'banned' ? 'success' : 'danger'} 
                onPress={onBanClose}
              >
                {selectedUser?.status.toLowerCase() === 'banned' ? 'Unban User' : 'Ban User'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </>
  );
}
