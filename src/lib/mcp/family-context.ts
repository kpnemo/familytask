import { PrismaClient } from '@prisma/client';

export interface FamilyContext {
  familyId: string;
  userRole: 'ADMIN_PARENT' | 'PARENT' | 'CHILD';
  members: Array<{
    id: string;
    name: string;
    role: 'PARENT' | 'CHILD';
    familyRole: 'ADMIN_PARENT' | 'PARENT' | 'CHILD';
  }>;
  activeTasks: Array<{
    id: string;
    title: string;
    description?: string;
    points: number;
    dueDate: Date;
    status: string;
    assignedTo?: string;
    assignedToName?: string;
  }>;
  completionHistory: Array<{
    taskTitle: string;
    assigneeName: string;
    completedAt: Date;
    points: number;
  }>;
  pointsData: Array<{
    userId: string;
    userName: string;
    currentPoints: number;
    totalEarned: number;
  }>;
}

export class FamilyContextBuilder {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async buildContext(familyId: string, userRole: string): Promise<FamilyContext> {
    try {
      // Get family members
      const familyMembers = await this.prisma.familyMember.findMany({
        where: { familyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      const members = familyMembers.map(fm => ({
        id: fm.user.id,
        name: fm.user.name,
        role: fm.user.role,
        familyRole: fm.role,
      }));

      // Get active tasks
      const tasks = await this.prisma.task.findMany({
        where: {
          familyId,
          status: {
            in: ['PENDING', 'AVAILABLE', 'COMPLETED', 'OVERDUE'],
          },
        },
        include: {
          assignee: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

      const activeTasks = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        points: task.points,
        dueDate: task.dueDate,
        status: task.status,
        assignedTo: task.assignedTo || undefined,
        assignedToName: task.assignee?.name || undefined,
      }));

      // Get completion history (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completedTasks = await this.prisma.task.findMany({
        where: {
          familyId,
          status: 'VERIFIED',
          verifiedAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          assignee: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          verifiedAt: 'desc',
        },
      });

      const completionHistory = completedTasks.map(task => ({
        taskTitle: task.title,
        assigneeName: task.assignee?.name || 'Unknown',
        completedAt: task.verifiedAt!,
        points: task.points,
      }));

      // Get points data for all family members
      const pointsData = await Promise.all(
        members.map(async (member) => {
          const pointsHistory = await this.prisma.pointsHistory.findMany({
            where: {
              userId: member.id,
              familyId,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          });

          const currentPoints = pointsHistory[0]?.balanceAfter || 0;

          const totalEarnedResult = await this.prisma.pointsHistory.aggregate({
            where: {
              userId: member.id,
              familyId,
              points: {
                gt: 0,
              },
            },
            _sum: {
              points: true,
            },
          });

          const totalEarned = totalEarnedResult._sum.points || 0;

          return {
            userId: member.id,
            userName: member.name,
            currentPoints,
            totalEarned,
          };
        })
      );

      return {
        familyId,
        userRole: userRole as 'ADMIN_PARENT' | 'PARENT' | 'CHILD',
        members,
        activeTasks,
        completionHistory,
        pointsData,
      };
    } catch (error) {
      console.error('Error building family context:', error);
      throw new Error('Failed to build family context');
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async validateFamilyAccess(userId: string, familyId: string): Promise<boolean> {
    try {
      const familyMember = await this.prisma.familyMember.findFirst({
        where: {
          userId,
          familyId,
        },
      });

      return !!familyMember;
    } catch (error) {
      console.error('Error validating family access:', error);
      return false;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getUserFamilyRole(userId: string, familyId: string): Promise<string | null> {
    try {
      const familyMember = await this.prisma.familyMember.findFirst({
        where: {
          userId,
          familyId,
        },
      });

      return familyMember?.role || null;
    } catch (error) {
      console.error('Error getting user family role:', error);
      return null;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}