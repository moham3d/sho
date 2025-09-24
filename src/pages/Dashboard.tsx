import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import {
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalPatients: number;
  activeCases: number;
  pendingReviews: number;
  todayAppointments: number;
}

interface RecentActivity {
  id: string;
  type: 'patient' | 'appointment' | 'case' | 'review';
  title: string;
  description: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, sendMessage } = useWebSocket({
    url: 'ws://localhost:3001',
    onMessage: (data) => handleWebSocketMessage(data),
    onError: (error) => console.error('WebSocket error:', error)
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeCases: 0,
    pendingReviews: 0,
    todayAppointments: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // WebSocket message handling is done via the onMessage callback

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Simulate API call - replace with actual API
      const mockStats: DashboardStats = {
        totalPatients: 1247,
        activeCases: 23,
        pendingReviews: 5,
        todayAppointments: 18,
      };

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'patient',
          title: 'New Patient Registration',
          description: 'Patient Ahmed Mohamed registered in the system',
          timestamp: '2 minutes ago',
          priority: 'medium',
        },
        {
          id: '2',
          type: 'appointment',
          title: 'Appointment Scheduled',
          description: 'Chest X-ray scheduled for 2:00 PM',
          timestamp: '15 minutes ago',
          priority: 'low',
        },
        {
          id: '3',
          type: 'case',
          title: 'Urgent Case Assigned',
          description: 'Emergency CT scan review required',
          timestamp: '30 minutes ago',
          priority: 'high',
        },
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    // Handle real-time updates
    console.log('WebSocket message received:', message);
    // Update stats or activity based on message type
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'medium':
        return <ClockIcon className="w-4 h-4" />;
      case 'low':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <BellIcon className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome, {user?.fullName || user?.username || 'User'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Patients
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalPatients.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Cases
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.activeCases}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Reviews
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.pendingReviews}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Appointments
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.todayAppointments}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
                    {getPriorityIcon(activity.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <button className="btn btn-primary w-full">
                New Patient
              </button>
              <button className="btn btn-secondary w-full">
                New Appointment
              </button>
              <button className="btn btn-secondary w-full">
                View Reports
              </button>
              <button className="btn btn-secondary w-full">
                System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;