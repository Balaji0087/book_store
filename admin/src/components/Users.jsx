// File: src/components/Users.jsx
import React, { useState, useEffect, useMemo } from "react";
import adminAxios from "../utils/adminAxios";
import {
  Search, ChevronDown, ChevronUp, User, Mail, Calendar,
  Edit, X, Trash2, Plus, Check, AlertCircle, Users as UsersIcon
} from "lucide-react";
import { styles } from "../assets/dummyStyles";
import { toast } from "react-toastify";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminAxios.get('/user/all');
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const aVal = sortConfig.key === "createdAt" ? new Date(a[sortConfig.key]) : a[sortConfig.key];
      const bVal = sortConfig.key === "createdAt" ? new Date(b[sortConfig.key]) : b[sortConfig.key];
      return sortConfig.direction === "asc" ? aVal > bVal ? 1 : -1 : aVal > bVal ? -1 : 1;
    });
  }, [filteredUsers, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const viewUser = (user) => {
    setSelectedUser(user);
    setIsEditing(false);
  };

  const startEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setEditForm({ name: "", email: "" });
  };

  const saveEdit = async () => {
    try {
      await adminAxios.put(`/user/${selectedUser._id}`, editForm);
      toast.success('User updated successfully');
      fetchUsers();
      cancelEdit();
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await adminAxios.delete(`/user/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const startCreate = () => {
    setCreateForm({ name: "", email: "", password: "", role: "user" });
    setIsCreating(true);
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setCreateForm({ name: "", email: "", password: "", role: "user" });
  };

  const saveCreate = async () => {
    if (!createForm.name || !createForm.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      await adminAxios.post('/user/create', createForm);
      toast.success('User created successfully');
      fetchUsers();
      cancelCreate();
    } catch (err) {
      console.error("Failed to create user:", err);
      toast.error(err.response?.data?.message || 'Failed to create user.');
    }
  };

  const stats = [
    { label: "Total Users", value: users.length, icon: UsersIcon, color: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "Admin Users", value: users.filter(u => u.role === 'admin').length, icon: User, color: "bg-red-100", iconColor: "text-red-600" },
    { label: "Regular Users", value: users.filter(u => u.role === 'user').length, icon: User, color: "bg-green-100", iconColor: "text-green-600" },
    { label: "Active Users", value: users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, icon: User, color: "bg-purple-100", iconColor: "text-purple-600" }
  ];

  return (
    <div className={styles.pageBackground}>
      <div className={styles.container}>
        <div className="mb-8">
          <h1 className={styles.headerTitle}>User Management</h1>
          <p className={styles.headerSubtitle}>Manage and monitor all registered users</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className={styles.statsCard}>
              <div className={styles.statsCardContent}>
                <div>
                  <p className={styles.statsCardLabel}>{stat.label}</p>
                  <p className={styles.statsCardValue}>{stat.value}</p>
                </div>
                <div className={styles.statsIconContainer(stat.color)}>
                  <stat.icon className={styles.statsIcon(stat.iconColor)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.controlsContainer}>
          <div className={styles.controlsInner}>
            <div className={styles.searchContainer}>
              <div className={styles.searchIcon}>
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="search"
                name="search"
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                aria-label="Search users"
              />
            </div>
            <button onClick={startCreate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create User</span>
            </button>
          </div>
        </div>

        <div className={styles.ordersTableContainer}>
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  {["name", "email", "role", "createdAt"].map(key => (
                    <th key={key} className={styles.tableHeader} onClick={() => key !== "role" && handleSort(key)}>
                      <div className={styles.tableHeaderContent}>
                        {key === "createdAt" ? "Joined Date" : key === "role" ? "Role" : key.charAt(0).toUpperCase() + key.slice(1)}
                        {key !== "role" && (
                          <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {sortConfig.key === key ?
                              (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) :
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            }
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className={`${styles.tableHeader} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedUsers.map(user => (
                  <tr key={user._id} className={styles.tableRow}>
                    <td className={`${styles.tableCell} font-medium text-gray-900`}>{user.name}</td>
                    <td className={`${styles.tableCell} text-gray-600`}>{user.email}</td>
                    <td className={`${styles.tableCell} text-gray-600`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className={`${styles.tableCell} text-gray-500`}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className={`${styles.tableCell} text-right`}>
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => viewUser(user)} className={styles.viewButton}>
                          View
                        </button>
                        <button onClick={() => startEdit(user)} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                          <Edit className="w-4 h-4 inline mr-1" />
                          Edit
                        </button>
                        <button onClick={() => deleteUser(user._id)} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!sortedUsers.length && !loading && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconContainer}>
                  <User className={styles.emptyIcon} />
                </div>
                <h3 className={styles.emptyTitle}>No users found</h3>
                <p className={styles.emptyMessage}>Try adjusting your search</p>
              </div>
            )}

            {loading && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconContainer}>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
                <h3 className={styles.emptyTitle}>Loading users...</h3>
              </div>
            )}

            <div className={styles.tableFooter}>
              <div className={styles.footerText}>
                Showing <span className="font-medium">{sortedUsers.length}</span> of{" "}
                <span className="font-medium">{users.length}</span> users
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View/Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden border-opacity-60">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">
                    {isEditing ? 'Edit User' : 'User Details'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {isEditing ? 'Update user information' : `User ID: ${selectedUser._id}`}
                  </p>
                </div>
                <button onClick={cancelEdit} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh]">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-3 text-blue-600" />
                  {isEditing ? 'Edit User Information' : 'User Profile'}
                </h3>
                <div className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="bg-white/60 rounded-lg p-4">
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white/60 rounded-lg p-4">
                        <p className="font-medium text-gray-800 text-lg">{selectedUser.name}</p>
                        <p className="text-gray-600 text-sm">{selectedUser.email}</p>
                        <div className="mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedUser.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {selectedUser.role === 'admin' ? 'Administrator' : 'User'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Account Created</p>
                            <p className="text-sm text-gray-600">
                              {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              at {new Date(selectedUser.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!isEditing && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-green-600" />
                    Account Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 text-center border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {Math.floor((new Date() - new Date(selectedUser.createdAt)) / (1000 * 60 * 60 * 24))}
                      </div>
                      <p className="text-sm text-green-700 font-medium">Days as Member</p>
                    </div>

                    <div className="bg-white/60 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Account Status</p>
                          <p className="text-xs text-gray-600">Active Member</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Member Since</p>
                          <p className="text-xs text-gray-600">
                            {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50/80 border-t border-gray-200 p-6 flex flex-wrap gap-3 justify-end">
              <button onClick={cancelEdit} className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {isEditing ? 'Cancel' : 'Close'}
                </div>
              </button>
              {isEditing && (
                <button onClick={saveEdit} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Save Changes
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border-opacity-60">
            <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Create New User</h2>
                  <p className="text-green-100 text-sm mt-1">Add a new user to the system</p>
                </div>
                <button onClick={cancelCreate} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalSection}>
                <h3 className={styles.sectionTitle}>
                  <Plus className={styles.sectionIcon} />
                  User Information
                </h3>
                <div className={styles.sectionContent}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="create-name" className="block text-sm font-semibold text-gray-900 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="create-name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-email" className="block text-sm font-semibold text-gray-900 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="create-email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-password" className="block text-sm font-semibold text-gray-900 mb-2">
                        Password <span className="text-gray-500 font-normal">(optional - default will be generated)</span>
                      </label>
                      <input
                        type="password"
                        id="create-password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="Enter password (min 8 characters)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 If no password is provided, a secure default password will be generated
                      </p>
                    </div>
                    <div>
                      <label htmlFor="create-role" className="block text-sm font-semibold text-gray-900 mb-2">
                        User Role *
                      </label>
                      <select
                        id="create-role"
                        value={createForm.role}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Admin users have full access to the system, regular users have limited access
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalSection}>
                <h3 className={styles.sectionTitle}>
                  <User className={styles.sectionIcon} />
                  Account Preview
                </h3>
                <div className={styles.sectionContent}>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {createForm.name || 'User Name'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {createForm.email || 'user@example.com'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Account Type:</span>
                        <span className={`font-medium ${createForm.role === 'admin' ? 'text-red-700' : 'text-green-700'}`}>
                          {createForm.role === 'admin' ? 'Administrator' : 'Customer'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-blue-700">Active</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Join Date:</span>
                        <span className="font-medium text-gray-900">Today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50/80 border-t border-gray-200 p-6 flex flex-wrap gap-3 justify-end">
              <button onClick={cancelCreate} className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </div>
              </button>
              <button onClick={saveCreate} className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create User
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;