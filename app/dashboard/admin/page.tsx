import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import UserRoleMenu from '../../../components/UserRoleMenu';

const prisma = new PrismaClient();

async function updateUserRole(userId: string, role: UserRole, managedAirportId?: string) {
  'use server';

  if (role === 'AIRPORT_MANAGER' && !managedAirportId) {
    throw new Error('Airport manager assignment requires an airport.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      managedAirportId: role === 'AIRPORT_MANAGER' ? managedAirportId : null,
    },
  });

  revalidatePath('/dashboard/admin');
}

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [revenueAggregate, totalUsers, totalBookings, activeFlights, users, airports, busiestRoutes, bookingsForChart] =
    await Promise.all([
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
      }),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.flight.count({ where: { status: { not: 'CANCELLED' } } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.airport.findMany({ orderBy: { iata: 'asc' } }),
      prisma.booking.groupBy({
        by: ['flightId'],
        _count: { flightId: true },
        where: { status: 'CONFIRMED' },
        orderBy: { _count: { flightId: 'desc' } },
        take: 5,
      }),
      prisma.booking.findMany({
        select: {
          createdAt: true,
          totalPrice: true,
        },
      }),
    ]);

  const currentMonth = new Date();
  const chartBuckets = Array.from({ length: 6 }, (_, index) => {
    const bucketDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (5 - index), 1);
    return {
      key: bucketDate.toISOString().slice(0, 7),
      label: bucketDate.toLocaleDateString('en-US', { month: 'short' }),
      revenue: 0,
    };
  });

  bookingsForChart.forEach((booking) => {
    const monthKey = booking.createdAt.toISOString().slice(0, 7);
    const bucket = chartBuckets.find((entry) => entry.key === monthKey);
    if (bucket) {
      bucket.revenue += booking.totalPrice;
    }
  });

  const chartMax = Math.max(...chartBuckets.map((bucket) => bucket.revenue), 1);

  const routeDetails = await prisma.flight.findMany({
    where: { id: { in: busiestRoutes.map((route) => route.flightId) } },
    include: {
      origin: true,
      destination: true,
    },
  });

  const routeMap = routeDetails.reduce<Record<string, string>>((acc, flight) => {
    acc[flight.id] = `${flight.origin.iata} → ${flight.destination.iata}`;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Global Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of revenue, users, bookings, and route activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${revenueAggregate._sum.totalPrice?.toLocaleString() ?? '0'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Flights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeFlights}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalBookings}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge>{user.role}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <UserRoleMenu
                        userId={user.id}
                        airports={airports.map((airport) => ({
                          id: airport.id,
                          iata: airport.iata,
                          name: airport.name,
                          city: airport.city,
                        }))}
                        onRoleChange={updateUserRole}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-60 items-end gap-3 rounded-md bg-muted px-4 pb-4 pt-6">
                {chartBuckets.map((bucket) => {
                  const height = Math.max((bucket.revenue / chartMax) * 100, 8);

                  return (
                    <div key={bucket.key} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-40 w-full items-end rounded-md bg-background/40 p-1">
                        <div
                          className="w-full rounded-md bg-primary transition-all"
                          style={{ height: `${height}%` }}
                          title={`$${bucket.revenue.toLocaleString()}`}
                        />
                      </div>
                      <div className="text-center text-xs text-muted-foreground">
                        <div>{bucket.label}</div>
                        <div>${bucket.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Busiest Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {busiestRoutes.length > 0 ? (
                  busiestRoutes.map((route) => (
                    <li key={route.flightId} className="flex items-center justify-between gap-4">
                      <span>{routeMap[route.flightId] ?? route.flightId}</span>
                      <span className="font-semibold">{route._count.flightId} bookings</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">No confirmed bookings yet.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
