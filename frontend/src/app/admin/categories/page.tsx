'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Plus, MoreVertical, X, Archive, Edit2, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { useAdminCategories } from '@/hooks/useAdminCategories';
import { createCategory, deleteCategory } from '@/services/admin';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function AdminCategoriesPage() {
  const { data: categoriesData, isLoading, error } = useAdminCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use real data from API
  const categories = categoriesData?.data || categoriesData || [];

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter((category: any) => {
      const matchesSearch =
        (category.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (category.slug?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (category.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

      const matchesStatus = selectedStatus === 'all' || category.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-green-100 text-green-700'
      : 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ACTIVE') return <span className="h-2 w-2 rounded-full bg-green-500" />;
    return <span className="h-2 w-2 rounded-full bg-slate-500" />;
  };

  const handleSelectCategory = (category: any) => {
    setSelectedCategory(category);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-[#043658]">Loading categories...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-red-600">Error loading categories</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#043658]">Category Management</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Manage and organize educational content categories across the platform.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors">
            <Plus className="h-4 w-4" />
            New Category
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Categories List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters Card */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-semibold text-[#043658] mb-2 block">Filter categories...</label>
                  <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
                    <Search className="h-4 w-4 text-[#6B7C93]" />
                    <input
                      type="text"
                      placeholder="Search by name or description"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-semibold text-[#043658] mb-2 block">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                  >
                    <option value="all">All Categories</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Categories Table Card */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="border-b border-[#E8EEF3] bg-[#F8FAFC] px-6 py-3">
                <p className="text-sm font-semibold text-[#043658]">
                  Showing {filteredCategories.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length} categories
                </p>
              </div>

              {/* Table Body */}
              {paginatedCategories.length === 0 ? (
                <div className="p-12 text-center">
                  <Filter className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
                  <p className="text-sm font-semibold text-[#043658]">No categories found</p>
                  <p className="text-xs text-[#6B7C93] mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E8EEF3]">
                  {paginatedCategories.map((category: any) => (
                    <div
                      key={category.id}
                      onClick={() => handleSelectCategory(category)}
                      className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer border-l-4 border-transparent hover:border-[#043658]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#043658]">{category.name}</p>
                          <p className="text-xs text-[#6B7C93] mt-0.5">{category.slug}</p>
                          <p className="text-xs text-[#6B7C93] mt-1 line-clamp-2">{category.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(category.status)}`}>
                            {getStatusIcon(category.status)}
                            {category.status}
                          </span>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Are you sure you want to delete "${category.name}"?\n\nThis action cannot be undone.`)) {
                                return;
                              }
                              
                              setIsDeleting(true);
                              try {
                                await deleteCategory(category.id);
                                toast.success('Category Deleted!', {
                                  description: `${category.name} has been removed`
                                });
                                window.location.reload();
                              } catch (error: any) {
                                console.error('Failed to delete category:', error);
                                toast.error('Cannot Delete Category', {
                                  description: error.response?.data?.message || error.message || 'This category may be in use'
                                });
                              } finally {
                                setIsDeleting(false);
                              }
                            }}
                            disabled={isDeleting}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#043658]">{category.postsCount || 0} posts</span>
                        <span className="text-xs text-[#6B7C93]">Created {new Date(category.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-[#E8EEF3] bg-[#F8FAFC] px-6 py-4 flex items-center justify-between">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`h-8 w-8 rounded text-sm font-semibold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#043658] text-white'
                              : 'text-[#043658] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-sm text-[#6B7C93]">...</span>}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details Panel */}
          {selectedCategory ? (
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm sticky top-24">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E8EEF3] bg-[#F8FAFC] px-6 py-4">
                  <h2 className="text-sm font-bold text-[#043658]">{selectedCategory.name}</h2>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="rounded p-1 hover:bg-white transition-colors"
                  >
                    <X className="h-4 w-4 text-[#6B7C93]" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Status & Posts */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-[#6B7C93] mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusColor(selectedCategory.status)}`}>
                        {getStatusIcon(selectedCategory.status)}
                        {selectedCategory.status === 'ACTIVE' ? '✓ Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#6B7C93] mb-1">Associated Posts</p>
                      <p className="text-2xl font-bold text-[#043658]">{(selectedCategory.postsCount || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold text-[#6B7C93] mb-2">Description</p>
                    <p className="text-sm text-[#043658] leading-relaxed">{selectedCategory.description}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-[#E8EEF3]">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-semibold text-[#043658] hover:bg-[#F8FAFC] transition-colors"
                      title="Archive category"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#043658] px-3 py-2 text-sm font-semibold text-[#043658] hover:bg-[#043658]/5 transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center rounded-lg bg-[#043658] px-3 py-2 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors"
                      title="Save changes"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-[#D9E2EC] border-dashed bg-white shadow-sm p-6 text-center">
                <p className="text-sm font-semibold text-[#043658]">Select a category</p>
                <p className="text-xs text-[#6B7C93] mt-1">Choose a category from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-[#043658] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create New Category</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCategoryName('');
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Mathematics, Science, History"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20 outline-none transition-all"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Category name should be unique and descriptive
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    if (!newCategoryName.trim()) {
                      toast.error('Category Name Required', {
                        description: 'Please enter a category name'
                      });
                      return;
                    }
                    
                    setIsCreating(true);
                    try {
                      await createCategory(newCategoryName.trim());
                      toast.success('Category Created!', {
                        description: `${newCategoryName} has been added successfully`
                      });
                      setShowCreateModal(false);
                      setNewCategoryName('');
                      window.location.reload();
                    } catch (error: any) {
                      console.error('Failed to create category:', error);
                      toast.error('Failed to Create Category', {
                        description: error.response?.data?.message || error.message || 'Please try again'
                      });
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  disabled={isCreating}
                  className="flex-1 px-5 py-2.5 bg-[#043658] text-white rounded-lg hover:bg-[#05456F] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {isCreating ? 'Creating...' : 'Create Category'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCategoryName('');
                  }}
                  disabled={isCreating}
                  className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
