import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Monitor, Smartphone, Tablet, MapPin, Clock, User, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LoginActivityTracker = () => {
  const { user, isAdmin, apiCall } = useAuth();
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchLoginActivities();
    }
  }, [isAdmin, selectedUser, currentPage]);

  const fetchUsers = async () => {
    try {
      const response = await apiCall('/users');
      setUsers(response.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchLoginActivities = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const offset = (currentPage - 1) * itemsPerPage;
      
      let endpoint = `/login-activities?limit=${itemsPerPage}&offset=${offset}`;
      if (selectedUser !== 'all') {
        endpoint += `&user_id=${selectedUser}`;
      }

      const response = await apiCall(endpoint);
      setActivities(response.activities || []);
    } catch (err) {
      console.error('Failed to fetch login activities:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cleanupOldActivities = async () => {
    try {
      await apiCall('/login-activities/cleanup', { method: 'DELETE' });
      fetchLoginActivities(); // Refresh the list
      alert('Old login activities cleaned up successfully');
    } catch (err) {
      console.error('Failed to cleanup old activities:', err);
      setError('Failed to cleanup old activities');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getLocationString = (activity) => {
    const parts = [activity.location_city, activity.location_region, activity.location_country]
      .filter(part => part && part !== 'Unknown' && part !== 'Local');
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  };

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. Only administrators can view login activities.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Login Activity Tracker
          </CardTitle>
          <CardDescription>
            Monitor user login activities, device information, and access patterns. Records are kept for the last 2 weeks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="user-filter">Filter by User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={cleanupOldActivities}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Cleanup Old Records
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading login activities...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No login activities found
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{activity.users?.full_name}</div>
                                <div className="text-sm text-muted-foreground">{activity.users?.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">{formatDateTime(activity.login_time)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={activity.success ? "default" : "destructive"}>
                              {activity.success ? "Success" : "Failed"}
                            </Badge>
                            {!activity.success && activity.failure_reason && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {activity.failure_reason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(activity.device_type)}
                              <span className="capitalize">{activity.device_type || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{activity.browser || 'Unknown'}</TableCell>
                          <TableCell>{activity.operating_system || 'Unknown'}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {activity.ip_address || 'Unknown'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">{getLocationString(activity)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {activities.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {activities.length} activities
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">Page {currentPage}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={activities.length < itemsPerPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginActivityTracker;

