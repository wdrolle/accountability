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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/react';
import { MoreVertical, ChevronDown, Search, Plus } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  user_count: number;
};

const columns = [
  { name: 'ROLE NAME', uid: 'name', sortable: true },
  { name: 'DESCRIPTION', uid: 'description', sortable: true },
  { name: 'PERMISSIONS', uid: 'permissions', sortable: false },
  { name: 'USERS', uid: 'user_count', sortable: true },
  { name: 'CREATED AT', uid: 'created_at', sortable: true },
  { name: 'ACTIONS', uid: 'actions' }
];

const INITIAL_VISIBLE_COLUMNS = [
  'name',
  'description',
  'permissions',
  'user_count',
  'created_at',
  'actions'
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending'
  });

  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Add available permissions list
  const availablePermissions = [
    'CREATE_MESSAGES',
    'EDIT_MESSAGES',
    'DELETE_MESSAGES',
    'MANAGE_USERS',
    'MANAGE_ROLES',
    'VIEW_ANALYTICS'
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const data = await response.json();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Add edit role handler
  const handleEditRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      await fetchRoles();
      onEditClose();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Add create role handler
  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      await fetchRoles();
      onEditClose();
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const renderCell = (role: Role, columnKey: string) => {
    switch (columnKey) {
      case 'permissions':
        return (
          <div className="flex flex-wrap gap-1">
            {role.permissions.map((permission) => (
              <Chip key={permission} size="sm">
                {permission}
              </Chip>
            ))}
          </div>
        );
      case 'user_count':
        return (
          <Chip size="sm" variant="flat">
            {role.user_count} users
          </Chip>
        );
      case 'created_at':
        return new Date(role.created_at).toLocaleDateString();
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
                  setSelectedRole(role);
                  setEditForm({
                    name: role.name,
                    description: role.description,
                    permissions: role.permissions
                  });
                  onEditOpen();
                }}
              >
                Edit Role
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return role[columnKey as keyof Role];
    }
  };

  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredRoles = [...roles];
    if (filterValue) {
      filteredRoles = filteredRoles.filter((role) =>
        role.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        role.description.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    return filteredRoles;
  }, [roles, filterValue]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a: Role, b: Role) => {
      const first = a[sortDescriptor.column as keyof Role];
      const second = b[sortDescriptor.column as keyof Role];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredItems, sortDescriptor]);

  const pages = Math.ceil(sortedItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return sortedItems.slice(start, end);
  }, [page, sortedItems, rowsPerPage]);

  const onSearchChange = (value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  };

  const onClear = () => {
    setFilterValue("");
    setPage(1);
  };

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name or description..."
            startContent={<Search className="w-4 h-4" />}
            value={filterValue}
            onClear={onClear}
            onValueChange={onSearchChange}
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
              onPress={() => {
                setSelectedRole(null);
                setEditForm({
                  name: '',
                  description: '',
                  permissions: []
                });
                onEditOpen();
              }}
            >
              Add New Role
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {roles.length} roles
          </span>
        </div>
      </div>
    );
  }, [
    filterValue,
    visibleColumns,
    onSearchChange,
    roles.length,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
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
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            variant="flat"
            onPress={() => setPage(1)}
          >
            First
          </Button>
          <Button
            isDisabled={pages === 1}
            variant="flat"
            onPress={() => setPage(pages)}
          >
            Last
          </Button>
        </div>
      </div>
    );
  }, [page, pages]);

  return (
    <div className="p-6">
      <Breadcrumb pageTitle="Roles" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white dark:text-white light:text-black mb-4">
            Role Management
          </h1>
          <p className="text-gray-400 dark:text-gray-400 light:text-black/80">
            Manage user roles and permissions across the platform.
          </p>
        </div>

        <Table
          aria-label="Roles table"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: "max-h-[600px]",
          }}
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSelectionChange={setSelectedKeys}
          onSortChange={setSortDescriptor}
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
            loadingContent={<div>Loading roles...</div>}
            loadingState={loading ? "loading" : "idle"}
            emptyContent={error || "No roles found"}
          >
            {(role) => (
              <TableRow key={role.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(role, columnKey.toString())}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Edit/Create Role Modal */}
        <Modal 
          isOpen={isEditOpen} 
          onClose={onEditClose}
          size="2xl"
          backdrop="blur"
        >
          <ModalContent>
            <ModalHeader>
              {selectedRole ? 'Edit Role' : 'Create New Role'}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role Name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter role name"
                    variant="bordered"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter role description"
                    variant="bordered"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Permissions</label>
                  <div className="space-y-2">
                    {availablePermissions.map(permission => (
                      <div key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.permissions.includes(permission)}
                          onChange={(e) => {
                            const newPermissions = e.target.checked
                              ? [...editForm.permissions, permission]
                              : editForm.permissions.filter(p => p !== permission);
                            setEditForm(prev => ({ ...prev, permissions: newPermissions }));
                          }}
                          className="mr-2"
                        />
                        <span>{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onEditClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={selectedRole ? handleEditRole : handleCreateRole}>
                {selectedRole ? 'Save Changes' : 'Create Role'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}