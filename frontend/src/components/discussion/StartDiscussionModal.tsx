'use client';

import { useState } from 'react';
import { X, Loader2, MessageSquare, Upload, File, Trash2, Bold, Italic, Underline, List, ListOrdered, Quote } from 'lucide-react';
import { useCreateDiscussion } from '@/hooks/useDiscussions';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/community';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

interface StartDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (discussionId: string) => void;
}

type DiscussionType = 'General' | 'Question' | 'Idea' | 'Teaching Strategy';

const TEACHER_LEVELS = [
  'Primary',
  'Secondary Ed',
  'High School',
  'University',
  'Special Education',
  'Adult Education',
];

export function StartDiscussionModal({
  isOpen,
  onClose,
  onSuccess,
}: StartDiscussionModalProps) {
  const { token, isInitializing } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [discussionType, setDiscussionType] = useState<DiscussionType>('General');
  const [targetLevels, setTargetLevels] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  const createDiscussion = useCreateDiscussion();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: !isInitializing && !!token,
  });

  const toggleLevel = (level: string) => {
    setTargetLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validTypes = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
      const isValidSize = file.size <= maxSize;
      const isValidType = validTypes.some((type) => file.name.toLowerCase().endsWith(type));
      return isValidSize && isValidType;
    });
    setAttachments((prev) => [...prev, ...validFiles].slice(0, 3)); // Max 3 files
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isFormValid = title.trim().length >= 5 && description.trim().length >= 10 && categoryId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    try {
      const result = await createDiscussion.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        tags: targetLevels.length > 0 ? targetLevels : undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategoryId('');
      setDiscussionType('General');
      setTargetLevels([]);
      setAttachments([]);

      onClose();
      onSuccess?.(result.discussion.id);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#043658] shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#043658]">Start a Discussion</h2>
            <p className="text-xs text-slate-500">Network Community</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-4 space-y-3">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Discussion Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Integrating active learning in remote settings..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#043658] focus:border-transparent text-sm transition-all"
                maxLength={200}
                required
              />
              {title.length > 0 && title.length < 5 && (
                <p className="text-xs text-red-500 mt-1">Title must be at least 5 characters ({title.length}/5)</p>
              )}
            </div>

            {/* Topic and Target Levels Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Topic/Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Topic <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#043658] focus:border-transparent text-sm appearance-none bg-white transition-all"
                  required
                >
                  <option value="">Select a primary topic</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Teacher Levels */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Target Teacher Level(s)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TEACHER_LEVELS.slice(0, 2).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleLevel(level)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                        targetLevels.includes(level)
                          ? 'bg-[#043658] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level}
                      {targetLevels.includes(level) && (
                        <X className="w-3 h-3 inline ml-1" />
                      )}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="all"
                    className="flex-1 min-w-[80px] px-2.5 py-1 text-xs border border-slate-200 rounded-full focus:ring-1 focus:ring-[#043658] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Discussion Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Discussion Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(['General', 'Question', 'Idea', 'Teaching Strategy'] as DiscussionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDiscussionType(type)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      discussionType === type
                        ? 'bg-[#043658] text-white shadow-md'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Initial Message */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description / Initial Message <span className="text-red-500">*</span>
              </label>
              
              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 p-1.5 border border-slate-300 border-b-0 rounded-t-lg bg-slate-50">
                <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-600" title="Bold">
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-600" title="Italic">
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-600" title="Underline">
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-600" title="Bullet List">
                  <List className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-600" title="Numbered List">
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-600" title="Quote">
                  <Quote className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share your thoughts, ask a question, or detail your strategy..."
                className="w-full px-3 py-2 border border-slate-300 rounded-b-lg focus:ring-2 focus:ring-[#043658] focus:border-transparent min-h-[120px] resize-y text-sm"
                maxLength={5000}
                required
              />
              {description.length > 0 && description.length < 10 && (
                <p className="text-xs text-red-500 mt-1">Description must be at least 10 characters ({description.length}/10)</p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Attachments
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-[#043658] transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-600">
                    Drag and drop files here, or <span className="text-[#043658] font-semibold underline">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Max size: 10MB per file (PDF, DOCX, JPG, PNG)</p>
                </label>
              </div>

              {/* Attached Files */}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <File className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
          {!isFormValid && (title.length > 0 || description.length > 0 || categoryId) && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
              {!categoryId && "Please select a topic"}
              {categoryId && title.length < 5 && "Title needs at least 5 characters"}
              {categoryId && title.length >= 5 && description.length < 10 && "Description needs at least 10 characters"}
            </p>
          )}
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={createDiscussion.isPending}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid || createDiscussion.isPending}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                !isFormValid && !createDiscussion.isPending
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                  : createDiscussion.isPending
                  ? 'bg-[#043658] text-white opacity-70'
                  : 'bg-gradient-to-r from-[#FFC107] to-yellow-500 text-[#043658] hover:from-yellow-500 hover:to-[#FFC107] shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 transform hover:scale-[1.02]'
              }`}
            >
              {createDiscussion.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Start Discussion
                  <span className="text-base">▶</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
