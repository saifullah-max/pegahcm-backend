import { Request, Response } from "express";
import prisma from "../utils/Prisma";
import moment from "moment-timezone";

interface CustomJwtPayload {
  userId: string;
}

// Helper function to get permission scope filter
const getPermissionFilter = async (req: Request) => {
  const current_user_id = (req.user as unknown as CustomJwtPayload)?.userId;
  const permissionScope = (req as any).permissionScope || "all";
  
  // Check if user is admin
  const user = await prisma.users.findUnique({
    where: { id: current_user_id },
    select: {
      role: {
        select: {
          name: true
        }
      }
    }
  });

  const isAdmin = user?.role?.name === "Admin";

  // If admin, return empty filters (show all data)
  if (isAdmin) {
    return {
      current_user_id,
      permissionScope: "all",
      filter: {},
      projectFilter: {},
      bidFilter: {}
    };
  }
  
  // For "own" scope, we need to include records where user is creator, sales person, or assignee
  const getProjectFilter = () => {
    if (permissionScope === "own") {
      return {
        OR: [
          { created_by: current_user_id },
          { sales_persons: { some: { user_id: current_user_id } } },
          { assignees: { some: { user_id: current_user_id } } }
        ]
      };
    }
    return {};
  };

  const getBidFilter = () => {
    if (permissionScope === "own") {
      return {
        OR: [
          { created_by: current_user_id },
          { attend_by: { some: { user_id: current_user_id } } }
        ]
      };
    }
    return {};
  };
  
  return {
    current_user_id,
    permissionScope,
    filter: permissionScope === "own" ? { created_by: current_user_id } : {},
    projectFilter: getProjectFilter(),
    bidFilter: getBidFilter()
  };
};

// COMPREHENSIVE DASHBOARD - Combines multiple endpoints into one
export const getComprehensiveDashboard = async (req: Request, res: Response) => {
  try {
    const { projectFilter, bidFilter, current_user_id } = await getPermissionFilter(req);
    // Check if user is admin
    const user = await prisma.users.findUnique({
      where: { id: current_user_id },
      select: { role: { select: { name: true } } }
    });
    const isAdmin = user?.role?.name.toLocaleLowerCase() === "admin";
    const now = moment();
    const currentMonthStart = now.clone().startOf('month').toDate();
    const lastMonthStart = now.clone().subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = now.clone().subtract(1, 'month').endOf('month').toDate();

    // Fetch all data in parallel
    const [
      allProjects,
      currentMonthProjects,
      lastMonthProjects,
      totalBids,
      wonBids,
      pendingProposals,
      proposalShared,
      interviewed,
      awarded,
      upcomingMilestones,
      overdueMilestones
    ] = await Promise.all([
      // Projects data
      prisma.projects.findMany({
        where: isAdmin ? {} : projectFilter,
        include: {
          milestones: { select: { id: true, status: true, revenue: true } },
          assignees: { include: { user: { select: { id: true, full_name: true } } } }
        }
      }),
      prisma.projects.findMany({
        where: isAdmin ? { created_at: { gte: currentMonthStart } } : { ...projectFilter, created_at: { gte: currentMonthStart } },
        include: { milestones: { select: { revenue: true } } }
      }),
      prisma.projects.findMany({
        where: isAdmin ? { created_at: { gte: lastMonthStart, lte: lastMonthEnd } } : { ...projectFilter, created_at: { gte: lastMonthStart, lte: lastMonthEnd } },
        include: { milestones: { select: { revenue: true } } }
      }),
      // Bid counts
      prisma.bids.count({ where: isAdmin ? {} : bidFilter }),
      prisma.bids.count({ where: isAdmin ? { bid_status: 'awarded' } : { ...bidFilter, bid_status: 'awarded' } }),
      prisma.bids.count({ where: isAdmin ? { bid_status: { in: ['proposal_pending', 'proposal_shared'] } } : { ...bidFilter, bid_status: { in: ['proposal_pending', 'proposal_shared'] } } }),
      prisma.bids.count({ where: isAdmin ? { bid_status: 'proposal_shared' } : { ...bidFilter, bid_status: 'proposal_shared' } }),
      prisma.bids.count({ where: isAdmin ? { bid_status: 'interviewed' } : { ...bidFilter, bid_status: 'interviewed' } }),
      prisma.bids.count({ where: isAdmin ? { bid_status: 'awarded' } : { ...bidFilter, bid_status: 'awarded' } }),
      // Upcoming deadlines
      prisma.milestones.findMany({
        where: {
          deadline: { gte: moment.utc().startOf('day').toDate(), lte: moment.utc().add(10, 'days').endOf('day').toDate() },
          status: { not: 'completed' },
          ...(isAdmin ? {} : (Object.keys(projectFilter).length > 0 ? { project: projectFilter } : {}))
        },
        take: 5,
        orderBy: { deadline: 'asc' },
        include: {
          project: { select: { id: true, name: true } },
          assignees: { include: { user: { select: { id: true, full_name: true } } } }
        }
      }),
      // Overdue milestones
      prisma.milestones.findMany({
        where: {
          deadline: { lte: moment.utc().subtract(30, 'days').endOf('day').toDate() },
          status: { not: 'completed' },
          ...(isAdmin ? {} : (Object.keys(projectFilter).length > 0 ? { project: projectFilter } : {}))
        },
        take: 5,
        orderBy: { deadline: 'asc' },
        include: {
          project: { select: { id: true, name: true, client_name: true } },
          assignees: { include: { user: { select: { id: true, full_name: true } } } }
        }
      })
    ]);

    // Calculate revenues
    const totalRevenue = allProjects.reduce((sum, p) => 
      sum + p.milestones.reduce((ms, m) => ms + (m.revenue || 0), 0), 0
    );
    const monthlyRevenue = currentMonthProjects.reduce((sum, p) => 
      sum + p.milestones.reduce((ms, m) => ms + (m.revenue || 0), 0), 0
    );
    const lastMonthRevenue = lastMonthProjects.reduce((sum, p) => 
      sum + p.milestones.reduce((ms, m) => ms + (m.revenue || 0), 0), 0
    );

    // Stats
    const activeProjects = allProjects.filter(p => p.status === 'active').length;
    const completedProjects = allProjects.filter(p => p.status === 'completed').length;
    const revenueGrowth = lastMonthRevenue > 0 ? Number((((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(2)) : 0;
    const bidWinRate = totalBids > 0 ? Number(((wonBids / totalBids) * 100).toFixed(2)) : 0;

    // Top 5 projects by revenue
    const topProjects = allProjects
      .map(p => ({
        id: p.id,
        name: p.name,
        client_name: p.client_name,
        status: p.status,
        revenue: p.milestones.reduce((sum, m) => sum + (m.revenue || 0), 0),
        milestones_total: p.milestones.length,
        milestones_completed: p.milestones.filter(m => m.status === 'completed').length,
        assignees_count: p.assignees.length
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Project status distribution
    const statusMap = new Map<string, number>();
    allProjects.forEach(p => {
      const status = p.status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const projectStatusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: allProjects.length > 0 ? Number(((count / allProjects.length) * 100).toFixed(2)) : 0
    }));

    // Client distribution (top 5)
    const clientMap = new Map<string, { projects: number; revenue: number }>();
    allProjects.forEach(p => {
      const client = p.client_name;
      if (!clientMap.has(client)) {
        clientMap.set(client, { projects: 0, revenue: 0 });
      }
      const data = clientMap.get(client)!;
      data.projects += 1;
      data.revenue += p.milestones.reduce((sum, m) => sum + (m.revenue || 0), 0);
    });
    const topClients = Array.from(clientMap.entries())
      .map(([client_name, data]) => ({ client_name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Bid conversion funnel
    const bidFunnel = {
      total: totalBids,
      proposal_shared: proposalShared,
      interviewed: interviewed,
      awarded: awarded,
      conversion_rate: totalBids > 0 ? Number(((awarded / totalBids) * 100).toFixed(2)) : 0
    };

    // Format upcoming deadlines
    const upcomingDeadlinesFormatted = upcomingMilestones.map(m => ({
      milestone_id: m.id,
      milestone_name: m.name,
      project_id: m.project.id,
      project_name: m.project.name,
      deadline: m.deadline,
      days_remaining: moment(m.deadline).diff(moment(), 'days'),
      status: m.status,
      assignees: m.assignees.map(a => ({ id: a.user.id, name: a.user.full_name }))
    }));

    // Format overdue milestones
    const overdueMilestonesFormatted = overdueMilestones.map(m => ({
      milestone_id: m.id,
      milestone_name: m.name,
      project_id: m.project.id,
      project_name: m.project.name,
      client_name: m.project.client_name,
      deadline: m.deadline,
      days_overdue: moment().diff(moment(m.deadline), 'days'),
      status: m.status,
      assignees: m.assignees.map(a => ({ id: a.user.id, name: a.user.full_name }))
    }));

    return res.status(200).json({
      stats: {
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        revenue_growth: revenueGrowth,
        active_projects: activeProjects,
        completed_projects: completedProjects,
        total_projects: allProjects.length,
        total_bids: totalBids,
        won_bids: wonBids,
        bid_win_rate: bidWinRate,
        pending_proposals: pendingProposals
      },
      top_projects: topProjects,
      project_status: projectStatusDistribution,
      top_clients: topClients,
      bid_funnel: bidFunnel,
      upcoming_deadlines: upcomingDeadlinesFormatted,
      overdue_milestones: overdueMilestonesFormatted
    });
  } catch (error) {
    console.error("Error fetching comprehensive dashboard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Individual endpoints kept for specific use cases
// GET /api/sales/dashboard/revenue-chart - Kept for flexible chart periods and detailed historical data
export const getRevenueChart = async (req: Request, res: Response) => {
  try {
    const { projectFilter, current_user_id } = await getPermissionFilter(req);
    const { period = '6months' } = req.query;

    // Check if user is admin
    const user = await prisma.users.findUnique({
      where: { id: current_user_id },
      select: { role: { select: { name: true } } }
    });
    const isAdmin = user?.role?.name === "Admin";

    let monthsBack = 6;
    if (period === '12months') monthsBack = 12;
    else if (period === 'year') monthsBack = 12;

    const startDate = moment().subtract(monthsBack, 'months').startOf('month').toDate();

    const projects = await prisma.projects.findMany({
      where: {
        ...(isAdmin ? {} : projectFilter),
        created_at: { gte: startDate }
      },
      select: {
        created_at: true,
        status: true,
        milestones: {
          select: { revenue: true }
        }
      }
    });

    // Group by month
    const monthlyMap = new Map<string, { revenue: number; projects_completed: number }>();
    
    for (let i = 0; i < monthsBack; i++) {
      const monthKey = moment().subtract(i, 'months').format('YYYY-MM');
      monthlyMap.set(monthKey, { revenue: 0, projects_completed: 0 });
    }

    projects.forEach(project => {
      const monthKey = moment(project.created_at).format('YYYY-MM');
      if (monthlyMap.has(monthKey)) {
        const data = monthlyMap.get(monthKey)!;
        const projectRevenue = project.milestones.reduce((sum, m) => sum + (m.revenue || 0), 0);
        data.revenue += projectRevenue;
        if (project.status === 'completed') {
          data.projects_completed += 1;
        }
      }
    });

    // Get monthly targets from database - Note: target table doesn't have relationships
    const targets = await prisma.target.findMany({
      where: {},
      select: {
        closing_target: true,
        created_at: true
      }
    });

    // Create target map by month
    const targetMap = new Map<string, number>();
    targets.forEach(target => {
      if (target.created_at) {
        const monthKey = moment(target.created_at).format('YYYY-MM');
        targetMap.set(monthKey, target.closing_target);
      }
    });

    const monthlyData = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        month_label: moment(month).format('MMM'),
        revenue: data.revenue,
        target: targetMap.get(month) || 0,
        projects_completed: data.projects_completed
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const avgMonthlyRevenue = monthlyData.length > 0 
      ? Math.round(totalRevenue / monthlyData.length)
      : 0;

    const bestMonth = monthlyData.reduce((best, current) => 
      current.revenue > best.revenue ? current : best,
      monthlyData[0] || { month: '', revenue: 0 }
    );

    return res.status(200).json({
      monthly_data: monthlyData,
      total_revenue: totalRevenue,
      avg_monthly_revenue: avgMonthlyRevenue,
      best_month: {
        month: bestMonth.month,
        revenue: bestMonth.revenue
      }
    });
  } catch (error) {
    console.error("Error fetching revenue chart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/sales/dashboard/recent-bids - Kept for detailed bid listing with filtering
export const getRecentBids = async (req: Request, res: Response) => {
  try {
    const { bidFilter, current_user_id } = await getPermissionFilter(req);
    const { limit = '5', status_filter } = req.query;
    const limitNum = parseInt(limit as string);

    // Check if user is admin
    const user = await prisma.users.findUnique({
      where: { id: current_user_id },
      select: { role: { select: { name: true } } }
    });
    const isAdmin = user?.role?.name === "Admin";

    const whereClause = {
      ...(isAdmin ? {} : bidFilter),
      ...(status_filter ? { bid_status: status_filter as string } : {})
    };

    const bids = await prisma.bids.findMany({
      where: whereClause,
      take: limitNum,
      orderBy: { created_at: 'desc' },
      include: {
        project_type: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get creator user info for all bids
    const creatorIds = [...new Set(bids.map(b => b.created_by).filter(Boolean))];
    const creators = await prisma.users.findMany({
      where: { id: { in: creatorIds as string[] } },
      select: { id: true, full_name: true }
    });
    const creatorMap = new Map(creators.map(u => [u.id, u.full_name]));

    const result = bids.map(bid => ({
      id: bid.id,
      client_name: bid.client_name,
      project_type: bid.project_type ? {
        id: bid.project_type.id,
        name: bid.project_type.name
      } : null,
      bid_amount: bid.price,
      status: bid.bid_status,
      created_at: bid.created_at,
      sales_person: {
        id: bid.created_by || '',
        name: creatorMap.get(bid.created_by || '') || 'Unknown'
      },
      days_since_submission: moment().diff(moment(bid.created_at), 'days')
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching recent bids:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/sales/dashboard/team-performance - Kept for employee performance analysis
export const getTeamPerformance = async (req: Request, res: Response) => {
  try {
    const { current_user_id, permissionScope } = await getPermissionFilter(req);
    const { period = 'month' } = req.query;

    let startDate = moment().startOf('month').toDate();
    if (period === 'quarter') {
      startDate = moment().startOf('quarter').toDate();
    } else if (period === 'year') {
      startDate = moment().startOf('year').toDate();
    }

    // Check if user is admin
    const user = await prisma.users.findUnique({
      where: { id: current_user_id },
      select: { role: { select: { name: true } } }
    });
    const isAdmin = user?.role?.name === "Admin";

    // Get all employees (or filtered by permission)
    const employeeFilter = isAdmin
      ? {} // Admin sees all employees
      : permissionScope === "own"
        ? { user_id: current_user_id }
        : {};

    const employees = await prisma.employees.findMany({
      where: employeeFilter,
      include: {
        user: {
          select: {
            id: true,
            full_name: true
          }
        }
      }
    });

    const performance = await Promise.all(
      employees.map(async (employee) => {
        const userId = employee.user_id;

        const [projects, totalBids, wonBids] = await Promise.all([
          prisma.projects.findMany({
            where: {
              created_by: userId,
              created_at: { gte: startDate }
            },
            include: {
              milestones: {
                select: { revenue: true }
              }
            }
          }),
          prisma.bids.count({
            where: {
              created_by: userId,
              created_at: { gte: startDate }
            }
          }),
          prisma.bids.count({
            where: {
              created_by: userId,
              bid_status: 'awarded',
              created_at: { gte: startDate }
            }
          })
        ]);

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        
        const totalRevenue = projects.reduce((sum, p) => {
          return sum + p.milestones.reduce((ms, m) => ms + (m.revenue || 0), 0);
        }, 0);
        
        const avgProjectValue = totalProjects > 0 ? Math.round(totalRevenue / totalProjects) : 0;
        const winRate = totalBids > 0 ? Number(((wonBids / totalBids) * 100).toFixed(2)) : 0;

        return {
          employee_id: employee.id,
          name: employee.user.full_name,
          total_projects: totalProjects,
          active_projects: activeProjects,
          completed_projects: completedProjects,
          total_revenue: Number(totalRevenue),
          total_bids: totalBids,
          won_bids: wonBids,
          win_rate: winRate,
          avg_project_value: avgProjectValue
        };
      })
    );

    // Sort by total revenue
    performance.sort((a, b) => b.total_revenue - a.total_revenue);

    return res.status(200).json(performance);
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};