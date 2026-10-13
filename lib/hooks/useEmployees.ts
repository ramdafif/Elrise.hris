'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Employee, UserSession } from '@/lib/types';

export interface UseEmployeesFilters {
  search?: string;
  departmentId?: string;
  status?: string;
  limit?: number;
}

export interface UseEmployeesOptions {
  session?: UserSession;
  initialEmployees?: Employee[];
  autoFetch?: boolean;
  limit?: number;
  initialFilters?: UseEmployeesFilters;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface UseEmployeesReturn {
  employees: Employee[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  total: number;
  loadMore: () => Promise<void>;
  refetch: (newFilters?: UseEmployeesFilters) => Promise<void>;
  createEmployee: (employeeData: Omit<Employee, 'id'>) => Promise<Employee | null>;
  updateEmployee: (id: string, updates: Partial<Employee>, reason?: string) => Promise<Employee | null>;
  deleteEmployee: (id: string, reason?: string) => Promise<boolean>;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export function useEmployees(options: UseEmployeesOptions = {}): UseEmployeesReturn {
  const {
    session,
    initialEmployees,
    autoFetch = false,
    limit = 50,
    initialFilters = {},
    onSuccess,
    onError,
  } = options;

  const [managedEmployees, setManagedEmployees] = useState<Employee[] | null>(null);
  const employees = managedEmployees ?? initialEmployees ?? [];

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const total = totalCount ?? employees.length;

  const filtersRef = useRef<UseEmployeesFilters>({
    limit,
    ...initialFilters,
  });

  const sessionRef = useRef<UserSession | undefined>(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const setEmployees: React.Dispatch<React.SetStateAction<Employee[]>> = useCallback(
    (action) => {
      setManagedEmployees((prev) => {
        const current = prev ?? initialEmployees ?? [];
        return typeof action === 'function' ? (action as any)(current) : action;
      });
    },
    [initialEmployees]
  );

  const buildQueryString = useCallback((filters: UseEmployeesFilters, cursor?: string | null) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.search) params.set('search', filters.search);
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      params.set('departmentId', filters.departmentId);
    }
    if (filters.status && filters.status !== 'ALL') {
      params.set('status', filters.status);
    }
    return params.toString();
  }, []);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const s = sessionRef.current || session;
    if (s) {
      headers['x-user-role'] = s.role;
      headers['x-employee-id'] = s.employeeId || 'emp-001';
      headers['x-user-name'] = s.name;
    }
    return headers;
  }, [session]);

  const fetchEmployees = useCallback(
    async (isLoadMore = false, customFilters?: UseEmployeesFilters) => {
      const activeFilters = { ...filtersRef.current, ...(customFilters || {}) };
      if (customFilters) {
        filtersRef.current = activeFilters;
      }

      const cursorToUse = isLoadMore ? nextCursor : null;
      const queryString = buildQueryString(activeFilters, cursorToUse);

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/employees?${queryString}`, {
          method: 'GET',
          headers: getHeaders(),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}: Gagal memuat data karyawan`);
        }

        const data = await response.json();
        const items: Employee[] = data.employees || data.items || [];

        setManagedEmployees((prev) => {
          const current = prev ?? initialEmployees ?? [];
          return isLoadMore ? [...current, ...items] : items;
        });

        setHasMore(Boolean(data.hasMore));
        setNextCursor(data.nextCursor || null);
        if (typeof data.total === 'number') {
          setTotalCount(data.total);
        }
      } catch (err: any) {
        const msg = err.message || 'Terjadi kesalahan saat memuat data karyawan';
        setError(msg);
        if (onError) onError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [buildQueryString, getHeaders, initialEmployees, nextCursor, onError]
  );

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !nextCursor) return;
    await fetchEmployees(true);
  }, [fetchEmployees, hasMore, isLoading, nextCursor]);

  const refetch = useCallback(
    async (newFilters?: UseEmployeesFilters) => {
      await fetchEmployees(false, newFilters);
    },
    [fetchEmployees]
  );

  const createEmployee = useCallback(
    async (employeeData: Omit<Employee, 'id'>): Promise<Employee | null> => {
      setIsSubmitting(true);
      setError(null);

      const currentSession = sessionRef.current || session || {
        id: 'user-admin',
        name: 'PT Administrator',
        email: 'admin.pt@nusantaratech.co.id',
        role: 'ADMIN_PT',
        employeeId: 'emp-002',
      };

      try {
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            action: 'CREATE',
            employeeData,
            employee: employeeData,
            session: currentSession,
            userName: currentSession.name,
            userRole: currentSession.role,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal mendaftarkan karyawan baru');
        }

        const created: Employee = data.employee;
        if (created) {
          setManagedEmployees((prev) => {
            const current = prev ?? initialEmployees ?? [];
            return [created, ...current];
          });
          setTotalCount((prev) => (prev !== null ? prev + 1 : employees.length + 1));
        }

        if (onSuccess) onSuccess('Karyawan baru berhasil didaftarkan ke sistem.');
        return created || null;
      } catch (err: any) {
        const msg = err.message || 'Gagal mendaftarkan karyawan baru';
        setError(msg);
        if (onError) onError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [employees.length, getHeaders, initialEmployees, onError, onSuccess, session]
  );

  const updateEmployee = useCallback(
    async (id: string, updates: Partial<Employee>, reason?: string): Promise<Employee | null> => {
      setIsSubmitting(true);
      setError(null);

      const currentSession = sessionRef.current || session || {
        id: 'user-admin',
        name: 'PT Administrator',
        email: 'admin.pt@nusantaratech.co.id',
        role: 'ADMIN_PT',
        employeeId: 'emp-002',
      };

      try {
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            action: 'UPDATE',
            employeeId: id,
            id,
            updates,
            reason: reason || 'Pembaruan data karyawan',
            session: currentSession,
            userName: currentSession.name,
            userRole: currentSession.role,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal memperbarui data karyawan');
        }

        const updated: Employee = data.employee;
        setManagedEmployees((prev) => {
          const current = prev ?? initialEmployees ?? [];
          return current.map((emp) =>
            emp.id === id ? { ...emp, ...updates, ...(updated || {}) } : emp
          );
        });

        if (onSuccess) onSuccess('Data karyawan berhasil diperbarui.');
        return updated || null;
      } catch (err: any) {
        const msg = err.message || 'Gagal memperbarui data karyawan';
        setError(msg);
        if (onError) onError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [getHeaders, initialEmployees, onError, onSuccess, session]
  );

  const deleteEmployee = useCallback(
    async (id: string, reason?: string): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);

      const currentSession = sessionRef.current || session || {
        id: 'user-admin',
        name: 'PT Administrator',
        email: 'admin.pt@nusantaratech.co.id',
        role: 'ADMIN_PT',
        employeeId: 'emp-002',
      };

      try {
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            action: 'DELETE',
            employeeId: id,
            reason: reason || 'Karyawan Dinonaktifkan',
            session: currentSession,
            userName: currentSession.name,
            userRole: currentSession.role,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal menonaktifkan karyawan');
        }

        setManagedEmployees((prev) => {
          const current = prev ?? initialEmployees ?? [];
          return current.map((emp) =>
            emp.id === id ? { ...emp, status: 'TERMINATED' } : emp
          );
        });

        if (onSuccess) onSuccess('Status karyawan berhasil diubah menjadi TERMINATED.');
        return true;
      } catch (err: any) {
        const msg = err.message || 'Gagal menonaktifkan karyawan';
        setError(msg);
        if (onError) onError(msg);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [getHeaders, initialEmployees, onError, onSuccess, session]
  );

  // Auto-fetch effect
  useEffect(() => {
    if (!autoFetch) return;
    let isCancelled = false;

    const runAutoFetch = async () => {
      setIsLoading(true);
      try {
        const queryString = buildQueryString(filtersRef.current, null);
        const res = await fetch(`/api/employees?${queryString}`, {
          method: 'GET',
          headers: getHeaders(),
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          const items: Employee[] = data.employees || data.items || [];
          setManagedEmployees(items);
          setHasMore(Boolean(data.hasMore));
          setNextCursor(data.nextCursor || null);
          if (typeof data.total === 'number') {
            setTotalCount(data.total);
          }
        }
      } catch {
        // Handled silently or by manual refetch
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void runAutoFetch();

    return () => {
      isCancelled = true;
    };
  }, [autoFetch, buildQueryString, getHeaders]);

  return {
    employees,
    isLoading,
    isSubmitting,
    error,
    hasMore,
    nextCursor,
    total,
    loadMore,
    refetch,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    setEmployees,
  };
}
