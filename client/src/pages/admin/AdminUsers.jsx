import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  Calendar,
  Mail,
  Phone,
  CalendarCheck2
} from 'lucide-react';
import { getAdminUsers } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data.data || []))
      .catch((err) => console.error('Failed to load admin users', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((u) => {
    return (
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/admin" className="hover:text-teal-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Admin Overview
        </Link>
        <span>/</span>
        <span className="text-navy-900 font-bold">Registered Users</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Registered Users Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Directory of registered traveler accounts, roles, registration timestamps, and booking metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-navy-900 bg-teal-50 px-4 py-2 rounded-2xl border border-teal-100">
          <Users className="w-4 h-4 text-teal-600" />
          <span>Total Accounts: {users.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Users Table / Responsive Cards */}
      {loading ? (
        <LoadingSpinner message="Retrieving user accounts..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Bookings Made</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-navy-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-navy-900 text-teal-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <ShieldCheck className="w-3 h-3 text-teal-400" />
                        ) : (
                          <UserCheck className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {u.phone || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-900 inline-flex items-center gap-1">
                        <CalendarCheck2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>{u.bookingCount || 0} reservation(s)</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
