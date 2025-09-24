import React from 'react';
import { Link } from 'react-router-dom';
const NotFound: React.FC = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-9xl font-bold text-blue-600 mb-4">404</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            The page you are looking for doesn't exist.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="btn btn-primary w-full"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="btn btn-secondary w-full"
          >
            Go Home
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Need help?
            <a
              href="tel:ext1234"
              className="text-blue-600 hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;