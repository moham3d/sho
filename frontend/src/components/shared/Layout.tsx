import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiHome,
  HiUser,
  HiUserGroup,
  HiDocumentText,
  HiClipboardList,
  HiChartBar,
  HiCog,
  HiLogout,
  HiMenu,
  HiX,
  HiChevronDown,
  HiBell,
  HiSearch,
  HiCalendar,
} from 'react-icons/hi';

interface LayoutProps {
  children?: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: NavItem[];
}

const Layout: React.FC<LayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <HiHome className="w-5 h-5" />,
    },
    // Nurse Routes
    ...(hasRole(['nurse', 'admin']) ? [
      {
        name: 'Nurse',
        href: '/nurse',
        icon: <HiUser className="w-5 h-5" />,
        children: [
          {
            name: 'Patients',
            href: '/nurse/patients',
            icon: <HiUserGroup className="w-4 h-4" />,
          },
          {
            name: 'Visits',
            href: '/nurse/visits',
            icon: <HiCalendar className="w-4 h-4" />,
          },
          {
            name: 'Forms',
            href: '/nurse/forms',
            icon: <HiDocumentText className="w-4 h-4" />,
          },
        ],
      },
    ] : []),
    // Doctor Routes
    ...(hasRole(['doctor', 'admin']) ? [
      {
        name: 'Doctor',
        href: '/doctor',
        icon: <HiDocumentText className="w-5 h-5" />,
        children: [
          {
            name: 'Cases',
            href: '/doctor/cases',
            icon: <HiClipboardList className="w-4 h-4" />,
          },
          {
            name: 'Reviews',
            href: '/doctor/reviews',
            icon: <HiChartBar className="w-4 h-4" />,
          },
          {
            name: 'Forms',
            href: '/doctor/forms',
            icon: <HiDocumentText className="w-4 h-4" />,
          },
        ],
      },
    ] : []),
    // Admin Routes
    ...(hasRole(['admin']) ? [
      {
        name: 'Admin',
        href: '/admin',
        icon: <HiCog className="w-5 h-5" />,
        children: [
          {
            name: 'Users',
            href: '/admin/users',
            icon: <HiUserGroup className="w-4 h-4" />,
          },
          {
            name: 'System Monitoring',
            href: '/admin/monitoring',
            icon: <HiChartBar className="w-4 h-4" />,
          },
          {
            name: 'Audit Logs',
            href: '/admin/audit-logs',
            icon: <HiDocumentText className="w-4 h-4" />,
          },
        ],
      },
    ] : []),
  ];

  const userNavigation = [
    { name: 'Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
    { name: 'Help', href: '/help' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'lg:hidden' : ''}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Al-Shorouk</h1>
            <p className="text-xs text-gray-500">Radiology System</p>
          </div>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <HiX className="h-6 w-6" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <DropdownNavItem item={item} isActive={isActive} />
            ) : (
              <Link
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="ml-3">{item.name}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.fullName || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role || 'Unknown Role'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const DropdownNavItem = ({ item, isActive }: { item: NavItem; isActive: (href: string) => boolean }) => {
    const [isOpen, setIsOpen] = useState(false);

    const isAnyChildActive = item.children?.some(child => isActive(child.href));

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isAnyChildActive
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="ml-3 flex-1 text-left">{item.name}</span>
          <HiChevronDown
            className={`ml-3 h-5 w-5 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children?.map((child) => (
              <Link
                key={child.name}
                to={child.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(child.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span className="flex-shrink-0">{child.icon}</span>
                <span className="ml-3">{child.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r lg:border-gray-200">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                <HiMenu className="h-6 w-6" />
              </button>

              <div className="ml-4 lg:ml-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <span className="sr-only">View notifications</span>
                <HiBell className="h-6 w-6" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-sm">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                title="Logout"
              >
                <HiLogout className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;