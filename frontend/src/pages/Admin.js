import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/authContext';
import axios from 'axios';

function Admin() {
  // eslint-disable-next-line
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchAdminData();// eslint-disable-next-line
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        axios.get('/api/users/all'),
        axios.get('/api/users/stats')
      ]);
      
      setUsers(usersResponse.data.users || usersResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Fallback to sample data for demo
      setSampleData();// eslint-disable-next-line
    } finally {
      setLoading(false);
    }
  };

  const setSampleData = () => {
    const sampleUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        age: 28,
        gender: 'male',
        height: 175,
        weight: 72.5,
        bmi: 23.7,
        bmiCategory: 'Normal weight',
        progressEntries: 25,
        lastLogin: new Date('2024-11-28T10:30:00'),
        createdAt: new Date('2024-10-15T08:00:00'),
        isActive: true
      },
      {
        id: '2',
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        age: 32,
        gender: 'female',
        height: 165,
        weight: 58.2,
        bmi: 21.4,
        bmiCategory: 'Normal weight',
        progressEntries: 18,
        lastLogin: new Date('2024-11-27T15:45:00'),
        createdAt: new Date('2024-10-20T12:30:00'),
        isActive: true
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        age: 35,
        gender: 'male',
        height: 180,
        weight: 85.0,
        bmi: 26.2,
        bmiCategory: 'Overweight',
        progressEntries: 12,
        lastLogin: new Date('2024-11-25T09:15:00'),
        createdAt: new Date('2024-11-01T14:20:00'),
        isActive: true
      },
      {
        id: '4',
        name: 'Emily Chen',
        email: 'emily@example.com',
        age: 26,
        gender: 'female',
        height: 160,
        weight: 52.8,
        bmi: 20.6,
        bmiCategory: 'Normal weight',
        progressEntries: 30,
        lastLogin: new Date('2024-11-28T14:20:00'),
        createdAt: new Date('2024-09-10T10:45:00'),
        isActive: true
      },
      {
        id: '5',
        name: 'David Brown',
        email: 'david@example.com',
        age: 41,
        gender: 'male',
        height: 178,
        weight: 78.5,
        bmi: 24.8,
        bmiCategory: 'Normal weight',
        progressEntries: 8,
        lastLogin: new Date('2024-11-20T11:30:00'),
        createdAt: new Date('2024-11-15T16:10:00'),
        isActive: false
      }
    ];

    const sampleStats = {
      totalUsers: 5,
      activeUsers: 4,
      newUsersThisMonth: 2,
      bmiDistribution: [
        { _id: 'Normal', count: 4 },
        { _id: 'Overweight', count: 1 },
        { _id: 'Underweight', count: 0 },
        { _id: 'Obese', count: 0 }
      ]
    };

    setUsers(sampleUsers);
    setStats(sampleStats);
  };

  const filteredAndSortedUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getBMIColor = (bmiCategory) => {
    switch (bmiCategory) {
      case 'Underweight': return 'text-blue-600 bg-blue-100';
      case 'Normal weight': return 'text-green-600 bg-green-100';
      case 'Overweight': return 'text-yellow-600 bg-yellow-100';
      case 'Obese': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleUserClick = (selectedUser) => {
    setSelectedUser(selectedUser);
    setShowUserDetails(true);
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor user activity and platform analytics</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 text-xl">👥</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-3xl font-bold text-blue-600">{stats.newUsersThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">📈</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Engagement Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">⚡</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BMI Distribution */}
      {stats && stats.bmiDistribution && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">BMI Distribution</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {stats.bmiDistribution.map((item, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{item._id}</p>
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalUsers > 0 ? Math.round((item.count / stats.totalUsers) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Management */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <div className="flex space-x-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-64"
            />
            
            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="input w-48"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="lastLogin-desc">Recently Active</option>
              <option value="bmi-asc">BMI Low to High</option>
              <option value="bmi-desc">BMI High to Low</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Age/Gender</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Physical Stats</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">BMI Category</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Progress</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Last Active</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.map((userData) => (
                <tr key={userData.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium text-gray-900">{userData.name}</p>
                      <p className="text-xs text-gray-500">{userData.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-gray-900">{userData.age} years</p>
                    <p className="text-xs text-gray-500 capitalize">{userData.gender}</p>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-gray-900">{userData.height}cm, {userData.weight}kg</p>
                    <p className="text-xs text-gray-500">BMI: {userData.bmi}</p>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getBMIColor(userData.bmiCategory)}`}>
                      {userData.bmiCategory}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <p className="font-medium text-gray-900">{userData.progressEntries}</p>
                    <p className="text-xs text-gray-500">entries</p>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-gray-900">
                      {new Date(userData.lastLogin).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(userData.lastLogin).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      userData.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => handleUserClick(userData)}
                      className="text-primary-600 hover:text-primary-800 font-medium text-xs"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👤</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No users found</h4>
            <p className="text-gray-600">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{selectedUser.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium capitalize">{selectedUser.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Height:</span>
                    <span className="font-medium">{selectedUser.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{selectedUser.weight} kg</span>
                  </div>
                </div>
              </div>

              {/* Health Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Health Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">BMI:</span>
                    <span className="font-medium">{selectedUser.bmi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className={`font-medium ${getBMIColor(selectedUser.bmiCategory).split(' ')[0]}`}>
                      {selectedUser.bmiCategory}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress Entries:</span>
                    <span className="font-medium">{selectedUser.progressEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Status:</span>
                    <span className={`font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Login:</span>
                    <span className="font-medium">
                      {new Date(selectedUser.lastLogin).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="btn-outline"
                >
                  Close
                </button>
                <button className="btn-primary">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
