import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'Access denied to this workspace', 403)
    }

    // Get all projects in the workspace
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      select: { id: true, name: true }
    })

    const projectIds = projects.map((p) => p.id)

    // Get all tasks inside workspace projects
    const tasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        }
      }
    })

    // Compute basic statistics
    const totalProjects = projects.length
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.completedAt !== null).length
    const openTasks = totalTasks - completedTasks
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Compute priority splits
    const priorities = { low: 0, medium: 0, high: 0, urgent: 0 }
    tasks.forEach((t) => {
      const p = t.priority.toLowerCase()
      if (p in priorities) {
        priorities[p as keyof typeof priorities]++
      }
    })

    // Compute member workloads (open tasks count)
    const memberWorkloadMap: Record<string, { id: string; name: string; avatarUrl: string | null; openTasksCount: number }> = {}
    
    // First, populate all workspace members to show them even if they have 0 tasks
    const allMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    })

    allMembers.forEach((m) => {
      memberWorkloadMap[m.userId] = {
        id: m.userId,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        openTasksCount: 0
      }
    })

    // Calculate workloads from tasks assignees list
    tasks.forEach((t) => {
      if (t.completedAt === null) {
        t.assignees.forEach((a) => {
          if (memberWorkloadMap[a.userId]) {
            memberWorkloadMap[a.userId].openTasksCount++
          } else {
            // Fallback for custom or deleted members
            memberWorkloadMap[a.userId] = {
              id: a.userId,
              name: a.user.name,
              avatarUrl: a.user.avatarUrl,
              openTasksCount: 1
            }
          }
        })
      }
    })

    const memberWorkloads = Object.values(memberWorkloadMap).sort((a, b) => b.openTasksCount - a.openTasksCount)

    // Compute Project Velocity (past 14 days completions timeline)
    const velocityMap: Record<string, number> = {}
    const datesList: string[] = []

    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      velocityMap[label] = 0
      datesList.push(label)
    }

    tasks.forEach((t) => {
      if (t.completedAt) {
        const d = new Date(t.completedAt)
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        if (label in velocityMap) {
          velocityMap[label]++
        }
      }
    })

    const projectVelocity = datesList.map((date) => ({
      date,
      count: velocityMap[date]
    }))

    return apiSuccess({
      kpis: {
        totalProjects,
        totalTasks,
        completedTasks,
        openTasks,
        completionRate
      },
      priorities,
      memberWorkloads,
      projectVelocity
    }, 'Workspace analytics retrieved successfully')
  } catch (error: any) {
    console.error('Fetch workspace analytics error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
