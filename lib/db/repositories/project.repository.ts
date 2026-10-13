import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { Project, EmployeeProjectAssignment, ProjectStatus, AssignmentStatus } from '@/lib/types';
import { randomUUID } from 'crypto';

export class ProjectRepository {
  private inMemoryProjects: Project[] = [];
  private inMemoryAssignments: EmployeeProjectAssignment[] = [];

  constructor() {
    this.seedDefaultProjects();
  }

  private seedDefaultProjects() {
    this.inMemoryProjects = [
      {
        id: 'prj-jkt-01',
        tenantId: 'tenant-elkyno-01',
        code: 'PRJ-JKT-01',
        name: 'Project Jakarta Smart City',
        description: 'Pengembangan infrastruktur IoT dan smart traffic monitoring korporat Jakarta.',
        status: 'ACTIVE',
        startDate: '2025-01-01',
        endDate: '2026-12-31',
        location: 'Jakarta Cyber 2 Tower & Smart Hub',
        managerId: 'emp-004',
        budget: 4500000000,
        createdAt: '2025-01-01T08:00:00Z',
      },
      {
        id: 'prj-sby-02',
        tenantId: 'tenant-elkyno-01',
        code: 'PRJ-SBY-02',
        name: 'Project Surabaya Logistics Hub',
        description: 'Modernisasi sistem rantai pasok dan pergudangan terintegrasi Surabaya.',
        status: 'ACTIVE',
        startDate: '2025-06-01',
        endDate: '2027-05-31',
        location: 'Intiland Tower Lt. 9 Surabaya',
        managerId: 'emp-006',
        budget: 3200000000,
        createdAt: '2025-06-01T08:00:00Z',
      },
      {
        id: 'prj-bdg-03',
        tenantId: 'tenant-elkyno-01',
        code: 'PRJ-BDG-03',
        name: 'Project Bandung AI Research Lab',
        description: 'Riset kecerdasan buatan dan platform rekayasa data lanjutan.',
        status: 'PLANNING',
        startDate: '2026-03-01',
        endDate: '2027-12-31',
        location: 'Dago Digital Valley Bandung',
        managerId: 'emp-001',
        budget: 2800000000,
        createdAt: '2026-01-15T08:00:00Z',
      },
      // Secondary tenant projects for cross-tenant testing
      {
        id: 'prj-nel-01',
        tenantId: 'tenant-holding-02',
        code: 'PRJ-NEL-01',
        name: 'Project Nusantara Solar Farm',
        description: 'Pembangunan pembangkit listrik tenaga surya mandiri.',
        status: 'ACTIVE',
        startDate: '2025-03-01',
        endDate: '2026-12-31',
        location: 'Gresik Energy Complex',
        budget: 8500000000,
        createdAt: '2025-03-01T08:00:00Z',
      },
    ];

    this.inMemoryAssignments = [
      {
        id: 'asg-001',
        tenantId: 'tenant-elkyno-01',
        employeeId: 'emp-004', // Hendra Wijaya
        projectId: 'prj-jkt-01',
        projectPosition: 'PROJECT_LEAD',
        role: 'PROJECT_LEAD',
        assignmentType: 'PROJECT_LEAD',
        startDate: '2025-01-01',
        status: 'ACTIVE',
        isPrimary: true,
        projectCode: 'PRJ-JKT-01',
        projectName: 'Project Jakarta Smart City',
        createdAt: '2025-01-01T08:00:00Z',
      },
      {
        id: 'asg-002',
        tenantId: 'tenant-elkyno-01',
        employeeId: 'emp-005', // Farhan Maulana Akbar
        projectId: 'prj-jkt-01',
        projectPosition: 'ENGINEER',
        role: 'ENGINEER',
        assignmentType: 'ENGINEER',
        startDate: '2025-01-15',
        status: 'ACTIVE',
        isPrimary: true,
        projectCode: 'PRJ-JKT-01',
        projectName: 'Project Jakarta Smart City',
        createdAt: '2025-01-15T08:00:00Z',
      },
      {
        id: 'asg-003',
        tenantId: 'tenant-elkyno-01',
        employeeId: 'emp-006', // Bayu Wicaksono
        projectId: 'prj-sby-02',
        projectPosition: 'OPERATIONS_LEAD',
        role: 'OPERATIONS_LEAD',
        assignmentType: 'OPERATIONS_LEAD',
        startDate: '2025-06-01',
        status: 'ACTIVE',
        isPrimary: true,
        projectCode: 'PRJ-SBY-02',
        projectName: 'Project Surabaya Logistics Hub',
        createdAt: '2025-06-01T08:00:00Z',
      },
      // Historical assignment test: Farhan worked on Bandung project previously
      {
        id: 'asg-004',
        tenantId: 'tenant-elkyno-01',
        employeeId: 'emp-005',
        projectId: 'prj-bdg-03',
        projectPosition: 'ANALYST',
        role: 'ANALYST',
        assignmentType: 'ANALYST',
        startDate: '2024-06-01',
        endDate: '2024-12-31',
        status: 'COMPLETED',
        isPrimary: false,
        projectCode: 'PRJ-BDG-03',
        projectName: 'Project Bandung AI Research Lab',
        createdAt: '2024-06-01T08:00:00Z',
      },
    ];
  }

  // -------------------------------------------------------------
  // PROJECTS
  // -------------------------------------------------------------

  async findProjects(tenantId: string): Promise<Project[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const rows = await (prisma as any).project.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        });
        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            tenantId: r.tenantId,
            code: r.code,
            name: r.name,
            description: r.description || undefined,
            status: r.status as ProjectStatus,
            startDate: r.startDate ? new Date(r.startDate).toISOString().split('T')[0] : '',
            endDate: r.endDate ? new Date(r.endDate).toISOString().split('T')[0] : undefined,
            location: r.location || undefined,
            managerId: r.managerId || undefined,
            budget: r.budget ? Number(r.budget) : undefined,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        // Fallback to cache
      }
    }
    return this.inMemoryProjects.filter((p) => p.tenantId === tenantId);
  }

  async findProjectById(id: string, tenantId: string): Promise<Project | null> {
    const projects = await this.findProjects(tenantId);
    return projects.find((p) => p.id === id) || null;
  }

  async createProject(data: Partial<Project>, tenantId: string): Promise<Project> {
    const newProject: Project = {
      id: data.id || `prj-${randomUUID().slice(0, 8)}`,
      tenantId,
      code: data.code || `PRJ-${Date.now().toString().slice(-4)}`,
      name: data.name || 'Proyek Baru',
      description: data.description,
      status: data.status || 'ACTIVE',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate,
      location: data.location,
      managerId: data.managerId,
      budget: data.budget,
      createdAt: new Date().toISOString(),
    };

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        await (prisma as any).project.create({
          data: {
            id: newProject.id,
            tenantId: newProject.tenantId,
            code: newProject.code,
            name: newProject.name,
            description: newProject.description,
            status: newProject.status,
            startDate: new Date(newProject.startDate),
            endDate: newProject.endDate ? new Date(newProject.endDate) : null,
            location: newProject.location,
            managerId: newProject.managerId,
            budget: newProject.budget,
          },
        });
      } catch {
        // Store in memory
      }
    }

    this.inMemoryProjects.unshift(newProject);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>, tenantId: string): Promise<Project | null> {
    const existing = await this.findProjectById(id, tenantId);
    if (!existing) return null;

    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        await (prisma as any).project.update({
          where: { id },
          data: {
            name: updated.name,
            description: updated.description,
            status: updated.status,
            endDate: updated.endDate ? new Date(updated.endDate) : null,
            location: updated.location,
            managerId: updated.managerId,
            budget: updated.budget,
          },
        });
      } catch {
        // Fallback
      }
    }

    const idx = this.inMemoryProjects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.inMemoryProjects[idx] = updated;
    }

    return updated;
  }

  // -------------------------------------------------------------
  // EMPLOYEE PROJECT ASSIGNMENTS
  // -------------------------------------------------------------

  async findAssignments(query: {
    tenantId: string;
    projectId?: string;
    employeeId?: string;
  }): Promise<EmployeeProjectAssignment[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const where: any = { tenantId: query.tenantId };
        if (query.projectId) where.projectId = query.projectId;
        if (query.employeeId) where.employeeId = query.employeeId;

        const rows = await (prisma as any).employeeProjectAssignment.findMany({
          where,
          include: {
            project: { select: { code: true, name: true } },
            employee: { select: { fullName: true } },
          },
          orderBy: { startDate: 'desc' },
        });

        if (rows && rows.length > 0) {
          return rows.map((r: any) => {
            const pos = r.projectPosition || r.role || 'MEMBER';
            return {
              id: r.id,
              tenantId: r.tenantId,
              employeeId: r.employeeId,
              projectId: r.projectId,
              projectPosition: pos,
              role: pos,
              assignmentType: pos,
              startDate: r.startDate ? new Date(r.startDate).toISOString().split('T')[0] : '',
              endDate: r.endDate ? new Date(r.endDate).toISOString().split('T')[0] : undefined,
              status: r.status as AssignmentStatus,
              isPrimary: Boolean(r.isPrimary),
              projectCode: r.project?.code,
              projectName: r.project?.name,
              employeeName: r.employee?.fullName,
              createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            };
          });
        }
      } catch {
        // Fallback
      }
    }

    return this.inMemoryAssignments.filter((a) => {
      if (a.tenantId !== query.tenantId) return false;
      if (query.projectId && a.projectId !== query.projectId) return false;
      if (query.employeeId && a.employeeId !== query.employeeId) return false;
      return true;
    });
  }

  async assignEmployee(
    data: Partial<EmployeeProjectAssignment>,
    tenantId: string
  ): Promise<EmployeeProjectAssignment> {
    if (!data.employeeId || !data.projectId) {
      throw new Error('employeeId dan projectId wajib diisi.');
    }

    // Lookup project for code and name
    const project = await this.findProjectById(data.projectId, tenantId);

    const pos = data.projectPosition || data.role || data.assignmentType || 'MEMBER';
    const assignment: EmployeeProjectAssignment = {
      id: data.id || `asg-${randomUUID().slice(0, 8)}`,
      tenantId,
      employeeId: data.employeeId,
      projectId: data.projectId,
      projectPosition: pos,
      role: pos,
      assignmentType: pos,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate,
      status: data.status || 'ACTIVE',
      isPrimary: Boolean(data.isPrimary),
      projectCode: project?.code,
      projectName: project?.name,
      createdAt: new Date().toISOString(),
    };

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        await (prisma as any).employeeProjectAssignment.create({
          data: {
            id: assignment.id,
            tenantId: assignment.tenantId,
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            projectPosition: assignment.projectPosition,
            role: assignment.role,
            startDate: new Date(assignment.startDate),
            endDate: assignment.endDate ? new Date(assignment.endDate) : null,
            status: assignment.status,
            isPrimary: assignment.isPrimary,
          },
        });
      } catch {
        // Fallback
      }
    }

    this.inMemoryAssignments.unshift(assignment);
    return assignment;
  }

  async updateAssignmentStatus(
    id: string,
    status: AssignmentStatus,
    endDate?: string,
    tenantId?: string
  ): Promise<EmployeeProjectAssignment | null> {
    const idx = this.inMemoryAssignments.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    if (tenantId && this.inMemoryAssignments[idx].tenantId !== tenantId) {
      throw new Error('[SECURITY_VIOLATION] Akses penugasan proyek lintas tenant ditolak.');
    }

    this.inMemoryAssignments[idx] = {
      ...this.inMemoryAssignments[idx],
      status,
      endDate: endDate || this.inMemoryAssignments[idx].endDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        await (prisma as any).employeeProjectAssignment.update({
          where: { id },
          data: {
            status,
            endDate: this.inMemoryAssignments[idx].endDate ? new Date(this.inMemoryAssignments[idx].endDate!) : null,
          },
        });
      } catch {
        // Fallback
      }
    }

    return this.inMemoryAssignments[idx];
  }
}

export const projectRepository = new ProjectRepository();
