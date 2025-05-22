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
  useDisclosure,
  Textarea,
  Tooltip
} from '@nextui-org/react';
import { MoreVertical, ChevronDown, Search, Edit } from 'lucide-react';
import Button from '@/components/CustomButtons/Button';
import { toast } from 'sonner';
import React from 'react';

interface User {
  id: string;
  email: string;
  raw_app_meta_data: any;
  raw_user_meta_data: any;
  created_at: string;
  last_sign_in_at: string;
}

const columns = [
  { name: 'EMAIL', uid: 'email', sortable: true },
  { name: 'APP META DATA', uid: 'app_meta_data', sortable: false },
  { name: 'USER META DATA', uid: 'user_meta_data', sortable: false },
  { name: 'CREATED', uid: 'created_at', sortable: true },
  { name: 'LAST SIGN IN', uid: 'last_sign_in', sortable: true },
  { name: 'ACTIONS', uid: 'actions' }
];

const INITIAL_VISIBLE_COLUMNS = [
  'email',
  'app_meta_data',
  'user_meta_data',
  'created_at',
  'last_sign_in',
  'actions'
];

export default function UpdateUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending'
  });
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedAppMetaData, setEditedAppMetaData] = useState('');
  const [editedUserMetaData, setEditedUserMetaData] = useState('');
  const [viewMetadataType, setViewMetadataType] = useState<'app' | 'user' | null>(null);
  const [viewMetadataContent, setViewMetadataContent] = useState('');
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    return columns.filter(column =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    return users.filter(user => {
      const searchContent = [
        user.email,
        JSON.stringify(user.raw_app_meta_data),
        JSON.stringify(user.raw_user_meta_data)
      ].join(' ').toLowerCase();
      
      return !hasSearchFilter || searchContent.includes(filterValue.toLowerCase());
    });
  }, [users, filterValue, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const showError = (message: string) => {
    toast.error(message);
  };

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const handleViewMetadata = (type: 'app' | 'user', content: any, user: User) => {
    // console.log('[DEBUG] Setting selected user:', user.id);
    setSelectedUser(user);
    setViewMetadataType(type);
    setViewMetadataContent(JSON.stringify(content, null, 2));
    onViewOpen();
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditedAppMetaData(JSON.stringify(user.raw_app_meta_data, null, 2));
    setEditedUserMetaData(JSON.stringify(user.raw_user_meta_data, null, 2));
    onOpen();
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      let parsedAppMetaData, parsedUserMetaData;
      
      try {
        parsedAppMetaData = JSON.parse(editedAppMetaData);
        parsedUserMetaData = JSON.parse(editedUserMetaData);
      } catch (err) {
        setError('Invalid JSON format');
        return;
      }

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_app_meta_data: parsedAppMetaData,
          raw_user_meta_data: parsedUserMetaData,
        }),
      });

      if (!response.ok) throw new Error('Failed to update user');

      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? {
              ...user,
              raw_app_meta_data: parsedAppMetaData,
              raw_user_meta_data: parsedUserMetaData,
            }
          : user
      ));

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleSingleMetadataUpdate = async () => {
    // console.log('[DEBUG] Starting single metadata update');
    // console.log('[DEBUG] Selected user:', selectedUser?.id);
    // console.log('[DEBUG] Metadata type:', viewMetadataType);
    
    if (!selectedUser) {
      showError('No user selected for update');
      return;
    }
    
    if (!viewMetadataType) {
      showError('No metadata type selected for update');
      return;
    }

    try {
      let parsedContent;
      try {
        parsedContent = JSON.parse(viewMetadataContent);
      } catch (err) {
        showError('Invalid JSON format');
        return;
      }

      const updateData = viewMetadataType === 'app' 
        ? { raw_app_meta_data: parsedContent }
        : { raw_user_meta_data: parsedContent };

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (err) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(responseData?.message || 'Failed to update user');
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? {
              ...user,
              ...(viewMetadataType === 'app' 
                ? { raw_app_meta_data: parsedContent }
                : { raw_user_meta_data: parsedContent })
            }
          : user
      ));

      showSuccess('Metadata updated successfully');
      onViewClose();
    } catch (err) {
      console.error('[DEBUG] Update error:', err);
      showError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const renderCell = (user: User, columnKey: string) => {
    switch (columnKey) {
      case 'email':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{user.email}</p>
            <p className="text-bold text-tiny text-default-500">{user.id}</p>
          </div>
        );
      case 'app_meta_data':
        return (
          <div 
            className="max-w-[200px] cursor-pointer hover:bg-gray-100 rounded p-2"
            onClick={() => handleViewMetadata('app', user.raw_app_meta_data, user)}
          >
            <div className="flex items-center gap-1">
              <div className="flex-1 truncate">
                <pre className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                  {JSON.stringify(user.raw_app_meta_data)}
                </pre>
              </div>
              <Edit className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      case 'user_meta_data':
        return (
          <div 
            className="max-w-[200px] cursor-pointer hover:bg-gray-100 rounded p-2"
            onClick={() => handleViewMetadata('user', user.raw_user_meta_data, user)}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate">
                <pre className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                  {JSON.stringify(user.raw_user_meta_data)}
                </pre>
              </div>
              <Edit className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      case 'created_at':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
            <p className="text-bold text-tiny text-default-500">
              {new Date(user.created_at).toLocaleTimeString()}
            </p>
          </div>
        );
      case 'last_sign_in':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
            </p>
            <p className="text-bold text-tiny text-default-500">
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleTimeString() : ''}
            </p>
          </div>
        );
      case 'actions':
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <NextUIButton isIconOnly size="sm" variant="light">
                  <MoreVertical className="text-default-300" />
                </NextUIButton>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key={user.id} onPress={() => handleEdit(user)}>
                  Edit All Metadata
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between gap-3 items-end">
        <Input
          isClearable
          className="w-full sm:max-w-[44%]"
          placeholder="Search by email or metadata..."
          startContent={<Search />}
          value={filterValue}
          onClear={() => setFilterValue('')}
          onValueChange={setFilterValue}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <NextUIButton endContent={<ChevronDown />} variant="flat">
                Columns
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

      <div className="relative">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[100px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <Table
            aria-label="Users table"
            isHeaderSticky
            bottomContent={
              pages > 0 ? (
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                  />
                </div>
              ) : null
            }
            classNames={{
              wrapper: "min-h-[400px]",
            }}
          >
            <TableHeader columns={headerColumns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.uid === "actions" ? "center" : "start"}
                  allowsSorting={column.sortable}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={items}
              emptyContent={isLoading ? "Loading..." : "No users found"}
            >
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(item, columnKey.toString())}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Modal
        isOpen={isViewOpen}
        onClose={onViewClose}
        size="3xl"
        scrollBehavior="inside"
        backdrop="blur"
        placement="center"
        hideCloseButton={true}
        classNames={{
          base: "bg-white dark:bg-gray-900",
          backdrop: "backdrop-opacity-10",
          wrapper: "items-center",
          body: "p-0",
          header: "border-b border-gray-200 dark:border-gray-700",
          footer: "border-t border-gray-200 dark:border-gray-700"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-shrink-0">
                {viewMetadataType === 'app' ? 'App Metadata' : 'User Metadata'}
                {selectedUser && <span className="text-sm text-gray-500 ml-2">({selectedUser.email})</span>}
              </ModalHeader>
              <ModalBody>
                <Textarea
                  value={viewMetadataContent}
                  onValueChange={setViewMetadataContent}
                  placeholder="Enter JSON data"
                  minRows={40}
                  classNames={{
                    base: "w-full",
                    input: "font-mono resize-none p-4 min-h-[800px]",
                    inputWrapper: "min-h-[800px]"
                  }}
                  style={{
                    height: '800px'
                  }}
                />
              </ModalBody>
              <ModalFooter className="flex-shrink-0">
                <Button color="danger" onClick={onViewClose}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onClick={handleSingleMetadataUpdate}
                >
                  Update
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
        backdrop="blur"
        placement="center"
        hideCloseButton={true}
        classNames={{
          base: "bg-white dark:bg-gray-900 h-[calc(80vh-130px)] pb-1",
          backdrop: "backdrop-opacity-10",
          wrapper: "items-center",
          body: "flex-1 p-0 h-[calc(80vh-130px)] min-h-[100vh]",
          header: "border-b border-gray-200 dark:border-gray-700",
          footer: "border-t border-gray-200 dark:border-gray-700"
        }}
      >
        <ModalContent className="h-[calc(80vh-130px)]">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Edit All User Metadata
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      App Metadata (raw_app_meta_data)
                    </label>
                    <Textarea
                      value={editedAppMetaData}
                      onValueChange={setEditedAppMetaData}
                      placeholder="Enter JSON data"
                      minRows={5}
                      classNames={{
                        base: "h-[150vh] min-h-[50vh]",
                        input: "font-mono h-[150vh] min-h-[50vh] resize-none p-4",
                        inputWrapper: "h-[150vh] min-h-[50vh]"
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      User Metadata (raw_user_meta_data)
                    </label>
                    <Textarea
                      value={editedUserMetaData}
                      onValueChange={setEditedUserMetaData}
                      placeholder="Enter JSON data"
                      minRows={5}
                      classNames={{
                        base: "h-[150vh] min-h-[50vh]",
                        input: "font-mono h-[150vh] min-h-[50vh] resize-none p-4",
                        inputWrapper: "h-[150vh] min-h-[50vh]"
                      }}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleUpdate}>
                  Update All
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
} 