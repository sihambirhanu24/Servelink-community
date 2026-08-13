'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Plus, MoreVertical, Send, Clock, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: 'INFORMATION' | 'WARNING' | 'ALERT' | 'ANNOUNCEMENT';
  targetAudience: string;
  recipientCount: number;
  status: 'DELIVERED' | 'PARTIAL' | 'FAILED';
  channels: string[];
  deliveredAt: string;
  deliveryRate: number;
}

// Mock data for demonstration
const MOCK_BROADCASTS: Broadcast[] = [
  {
    id: '1',
    title: 'Quarterly Community Guidelines Update',
    message: 'New community guidelines have been implemented. Please review the updated policies to ensure compliance.',
    type: 'ANNOUNCEMENT',
    targetAudience: 'All Users',
    recipientCount: 12450,
    status: 'DELIVERED',
    channels: ['In-App Notification', 'Email Push'],
    deliveredAt: '2 hours ago',
    deliveryRate: 98.5,
  },
  {
    id: '2',
    title: 'Level 5 Certification Renewals',
    message: 'Level 5 Certification renewals are now open. Complete your renewal by the end of the month.',
    type: 'INFORMATION',
    targetAudience: 'Level 5 Only',
    recipientCount: 320,
    status: 'DELIVERED',
    channels: ['Email Push', 'In-App Notification'],
    deliveredAt: '5 hours ago',
    deliveryRate: 100,
  },
  {
    id: '3',
    title: 'Emergency Server Maintenance',
    message: 'Emergency server maintenance is scheduled for tonight 10 PM - 2 AM. Services may be unavailable.',
    type: 'ALERT',
    targetAudience: 'All Users',
    recipientCount: 12450,
    status: 'PARTIAL',
    channels: ['Email Push', 'SMS', 'In-App Notification'],
    deliveredAt: '1 day ago',
    deliveryRate: 95.2,
  },
  {
    id: '4',
    title: 'New Teacher Onboarding Program',
    message: 'Check out our new interactive onboarding program for teachers. Get certified in 30 minutes!',
    type: 'INFORMATION',
    targetAudience: 'New Teachers',
    recipientCount: 2340,
    status: 'DELIVERED',
    channels: ['In-App Notification'],
    deliveredAt: '3 days ago',
    deliveryRate: 87.3,
  },
];

interface NotificationHistoryItem {
  title: string;
  status: 'DELIVERED' | 'PARTIAL' | 'FAILED';
  audience: string;
  recipientCount: number;
  sentAt: string;
}

const NOTIFICATION_HISTORY: NotificationHistoryItem[] = [
  {
    title: 'Quarterly Community Guidelines Up...',
    status: 'DELIVERED',
    audience: 'All Users',
    recipientCount: 12450,
    sentAt: '2 hours ago',
  },
  {
    title: 'Level 5 Certification Renewals',
    status: 'DELIVERED',
    audience: 'Level 5 Only',
    recipientCount: 320,
    sentAt: '5 hours ago',
  },
  {
    title: 'Emergency Server Maintenance',
    status: 'PARTIAL',
    audience: 'All Users',
    recipientCount: 11850,
    sentAt: '1 day ago',
  },
  {
    title: 'New Teacher Onboarding Program',
    status: 'DELIVERED',
    audience: 'New Teachers',
    recipientCount: 2340,
    sentAt: '3 days ago',
  },
];

const ITEMS_PER_PAGE = 10;

export default function AdminNotificationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isComposing, setIsComposing] = useState(false);

  // Filter broadcasts
  const filteredBroadcasts = useMemo(() => {
    return MOCK_BROADCASTS.filter((broadcast) => {
      const matchesSearch =
        broadcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        broadcast.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || broadcast.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || broadcast.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, selectedType, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredBroadcasts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBroadcasts = filteredBroadcasts.slice(startIndex, endIndex);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'INFORMATION':
        return <Zap className="h-4 w-4 text-blue-600" />;
      case 'ANNOUNCEMENT':
        return <Send className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INFORMATION: 'bg-blue-100 text-blue-700',
      WARNING: 'bg-amber-100 text-amber-700',
      ALERT: 'bg-red-100 text-red-700',
      ANNOUNCEMENT: 'bg-green-100 text-green-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'DELIVERED') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'PARTIAL') return <AlertCircle className="h-4 w-4 text-amber-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DELIVERED: 'text-green-700',
      PARTIAL: 'text-amber-700',
      FAILED: 'text-red-700',
    };
    return colors[status] || 'text-slate-700';
  };

  const getDeliveredCount = () => MOCK_BROADCASTS.filter(b => b.status === 'DELIVERED').length;
  const getPartialCount = () => MOCK_BROADCASTS.filter(b => b.status === 'PARTIAL').length;
  const getFailedCount = () => MOCK_BROADCASTS.filter(b => b.status === 'FAILED').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#043658]">Notifications Management</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Broadcast alerts and view delivery history across the ServeLink network.</p>
          </div>
          <button
            onClick={() => setIsComposing(true)}
            className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Send Broadcast
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Delivered</p>
            <p className="text-3xl font-bold text-green-700">{getDeliveredCount()}</p>
            <p className="text-xs text-[#6B7C93] mt-1">100% successful</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Partial</p>
            <p className="text-3xl font-bold text-amber-700">{getPartialCount()}</p>
            <p className="text-xs text-[#6B7C93] mt-1">Needs review</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Failed</p>
            <p className="text-3xl font-bold text-red-700">{getFailedCount()}</p>
            <p className="text-xs text-[#6B7C93] mt-1">Action required</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Broadcast Composer */}
          <div className="lg:col-span-1 rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#043658]">Broadcast Notification</h2>
            </div>

            <div className="space-y-4">
              {/* Notification Type */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Alert Type</label>
                <select className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40">
                  <option value="INFORMATION">Information</option>
                  <option value="WARNING">Warning</option>
                  <option value="ALERT">Alert</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Target Audience</label>
                <select className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40">
                  <option value="ALL">All Users</option>
                  <option value="LEVEL5">Level 5 Only</option>
                  <option value="NEW">New Teachers</option>
                  <option value="REGION">By Region</option>
                </select>
              </div>

              {/* Notification Title */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Title</label>
                <input
                  type="text"
                  placeholder="e.g., System Maintenance Update"
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                />
              </div>

              {/* Message Content */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Message Content</label>
                <textarea
                  placeholder="Enter the detailed message here..."
                  rows={4}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none resize-none"
                />
              </div>

              {/* Channels */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Delivery Channels</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-[#D9E2EC]" />
                    <span className="text-sm text-[#043658]">In-App Notification</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-[#D9E2EC]" />
                    <span className="text-sm text-[#043658]">Email Push</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#D9E2EC]" />
                    <span className="text-sm text-[#043658]">SMS</span>
                  </label>
                </div>
              </div>

              {/* Send Button */}
              <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors">
                <Send className="h-4 w-4" />
                Send Broadcast
              </button>
            </div>
          </div>

          {/* Notification History */}
          <div className="lg:col-span-2 rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#043658] mb-4">Notification History</h2>

            {/* Search & Filters */}
            <div className="space-y-4 mb-4">
              {/* Search */}
              <div>
                <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-[#6B7C93]" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                  />
                </div>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Type */}
                <div>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                  >
                    <option value="all">All Types</option>
                    <option value="INFORMATION">Information</option>
                    <option value="WARNING">Warning</option>
                    <option value="ALERT">Alert</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                  >
                    <option value="all">All Statuses</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Broadcasts List */}
            <div className="space-y-3">
              {paginatedBroadcasts.length === 0 ? (
                <div className="p-8 text-center">
                  <Filter className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
                  <p className="text-sm font-semibold text-[#043658]">No broadcasts found</p>
                </div>
              ) : (
                paginatedBroadcasts.map((broadcast) => (
                  <div key={broadcast.id} className="p-4 rounded-lg border border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        {getTypeIcon(broadcast.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#043658] truncate">{broadcast.title}</p>
                          <p className="text-xs text-[#6B7C93] mt-0.5">
                            {broadcast.targetAudience} • {broadcast.recipientCount.toLocaleString()} recipients
                          </p>
                        </div>
                      </div>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-bold ${getTypeColor(broadcast.type)}`}>
                        {broadcast.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E8EEF3]">
                      <div className="flex items-center gap-2 text-xs">
                        {getStatusIcon(broadcast.status)}
                        <span className={`font-semibold ${getStatusColor(broadcast.status)}`}>
                          {broadcast.status}
                        </span>
                        <span className="text-[#6B7C93]">•</span>
                        <span className="text-[#6B7C93]">{broadcast.deliveryRate}%</span>
                      </div>
                      <span className="text-xs text-[#6B7C93]">{broadcast.deliveredAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-[#E8EEF3] mt-4 pt-4 flex items-center justify-between">
                <button
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`h-8 w-8 rounded text-sm font-semibold ${
                        currentPage === i + 1
                          ? 'bg-[#043658] text-white'
                          : 'text-[#043658] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
