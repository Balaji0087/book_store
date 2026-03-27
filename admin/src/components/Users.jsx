// File: src/components/Users.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Search, ChevronDown, ChevronUp, User, Mail, Calendar,
  Edit, X, Trash2, Plus, Check, AlertCircle, Users as UsersIcon
} from "lucide-react";
import { styles } from "../assets/dummyStyles";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:4000";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/user/all`);
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
      await axios.put(`${API_BASE}/api/user/${selectedUser._id}`, editForm);
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
      await axios.delete(`${API_BASE}/api/user/${userId}`);
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
    setCreateForm({ name: "", email: "", password: "" });
    setIsCreating(true);
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setCreateForm({ name: "", email: "", password: "" });
  };

  const saveCreate = async () => {
    if (!createForm.name || !createForm.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/user/create`, createForm);
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
    { label: "Active Users", value: users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length, icon: User, color: "bg-green-100", iconColor: "text-green-600" }
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
                  {["name", "email", "createdAt"].map(key => (
                    <th key={key} className={styles.tableHeader} onClick={() => handleSort(key)}>
                      <div className={styles.tableHeaderContent}>
                        {key === "createdAt" ? "Joined Date" : key.charAt(0).toUpperCase() + key.slice(1)}
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortConfig.key === key ?
                            (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) :
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          }
                        </span>
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>
                  {isEditing ? 'Edit User' : 'User Details'}
                </h2>
                <p className={styles.modalSubtitle}>
                  {isEditing ? 'Update user information' : `User ID: ${selectedUser._id}`}
                </p>
              </div>
              <button onClick={cancelEdit} className={styles.closeButton}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalSection}>
                <h3 className={styles.sectionTitle}>
                  <User className={styles.sectionIcon} />
                  {isEditing ? 'Edit User Information' : 'User Profile'}
                </h3>
                <div className={styles.sectionContent}>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="space-y-5">
                        {[
                          { icon: User, label: "Full Name", value: selectedUser.name },
                          { icon: Mail, label: "Email Address", value: selectedUser.email },
                          { icon: Calendar, label: "Account Created", value: new Date(selectedUser.createdAt).toLocaleDateString() },
                          { icon: Calendar, label: "Registration Time", value: new Date(selectedUser.createdAt).toLocaleTimeString() }
                        ].map((item, idx) => (
                          <div key={idx} className={styles.infoItem}>
                            <item.icon className={styles.infoIcon} />
                            <div className="flex-1">
                              <p className={styles.infoLabel}>{item.label}</p>
                              <p className={styles.infoValue}>{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {!isEditing && (
                <div className={styles.modalSection}>
                  <h3 className={styles.sectionTitle}>
                    <Mail className={styles.sectionIcon} />
                    Account Statistics
                  </h3>
                  <div className={styles.sectionContent}>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {Math.floor((new Date() - new Date(selectedUser.createdAt)) / (1000 * 60 * 60 * 24))}
                        </div>
                        <p className="text-sm text-blue-700 font-medium">Days as Member</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-green-900">Account Status</p>
                          <p className="text-xs text-green-700">Active Member</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button onClick={cancelEdit} className={styles.footerButtonClose}>
                {isEditing ? 'Cancel' : 'Close'}
              </button>
              {isEditing && (
                <button onClick={saveEdit} className={styles.footerButtonSave}>
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreating && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Create New User</h2>
                <p className={styles.modalSubtitle}>Add a new user to the system</p>
              </div>
              <button onClick={cancelCreate} className={styles.closeButton}>
                <X className="w-6 h-6" />
              </button>
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
                        onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
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
                        onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
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
                        onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="Enter password (min 8 characters)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 If no password is provided, a secure default password will be generated
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
                        <span className="font-medium text-green-700">Customer</span>
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

            <div className={styles.modalFooter}>
              <button onClick={cancelCreate} className={styles.footerButtonClose}>
                Cancel
              </button>
              <button onClick={saveCreate} className={styles.footerButtonSave}>
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;