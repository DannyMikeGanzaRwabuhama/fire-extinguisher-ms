import { useState, useEffect } from 'react';
import { userApi } from '../../api/user';
import type { UserInfo } from '../../api/user';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import PaginationControls from '../../components/PaginationControls';

const ITEMS_PER_PAGE = 10;

const roleNames = {
  ROLE_ADMIN: 'Admin',
  ROLE_INSPECTOR: 'Inspector',
  ROLE_USER: 'Regular User',
};

const roleBadges = {
  ROLE_ADMIN: 'bg-primary text-primary-foreground font-semibold',
  ROLE_INSPECTOR: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold border-blue-500/20',
  ROLE_USER: 'bg-muted text-muted-foreground font-semibold',
};

export default function UsersList() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.getAll({ page: currentPage, limit: ITEMS_PER_PAGE });
      setUsers(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load users list.');
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Users Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage all registered users and roles within TZW LTD.
          </p>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-card border border-border rounded-md">
          <p className="text-sm text-muted-foreground animate-pulse">Loading users list...</p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden border-border bg-card shadow-sm rounded-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow>
                  <TableHead className="font-semibold text-foreground w-[80px]">ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Email</TableHead>
                  <TableHead className="font-semibold text-foreground">Phone</TableHead>
                  <TableHead className="font-semibold text-foreground">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((item) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                      <TableCell className="font-medium text-foreground">#{item.id}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span>{item.firstName} {item.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>{item.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span>{item.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 font-light text-xs">No phone set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleBadges[item.role] || ''}>
                          {roleNames[item.role] || item.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </Card>
      )}
    </div>
  );
}
