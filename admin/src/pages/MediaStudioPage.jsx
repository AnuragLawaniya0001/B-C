import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Film,
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  Pause,
  ExternalLink,
  ShieldAlert,
  Archive,
  Layers,
} from 'lucide-react';
import api from '../services/api';

export default function MediaStudioPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('ALL'); // 'ALL' | 'IMAGE' | 'VIDEO'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [statusMessage, setStatusMessage] = useState(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    display_name: '',
    category: 'CAMPAIGN',
    tags: '',
    alt_text: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Asset Details & Preview Modal State
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetUsage, setAssetUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', alt_text: '', tags: '', description: '' });
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Media Assets
  const fetchAssets = async () => {
    try {
      const res = await api.get('/media?limit=100&include_archived=true');
      const data = res.data || res;
      const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      setAssets(list);
    } catch (err) {
      console.error('Failed to fetch media assets:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load media assets from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Fetch Usage when asset is inspected
  const inspectAsset = async (asset) => {
    setSelectedAsset(asset);
    setEditForm({
      display_name: asset.display_name || '',
      alt_text: asset.alt_text || '',
      tags: Array.isArray(asset.tags) ? asset.tags.join(', ') : '',
      description: asset.description || '',
    });
    setIsEditingMeta(false);
    setAssetUsage(null);
    try {
      setLoadingUsage(true);
      const res = await api.get(`/media/${asset.media_id}/usage`);
      setAssetUsage(res.data || res);
    } catch (err) {
      console.error('Failed to inspect asset usage:', err);
    } finally {
      setLoadingUsage(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 10MB images, 50MB videos
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setStatusMessage({
        type: 'error',
        text: `File exceeds maximum allowed size of ${isVideo ? '50MB' : '10MB'}.`,
      });
      return;
    }

    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    if (!uploadForm.display_name) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadForm((prev) => ({ ...prev, display_name: cleanName }));
    }
  };

  // Upload Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setStatusMessage({ type: 'error', text: 'Please select an image or video file to upload.' });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('display_name', uploadForm.display_name);
      formData.append('category', uploadForm.category);
      formData.append('tags', uploadForm.tags);
      formData.append('alt_text', uploadForm.alt_text);
      formData.append('description', uploadForm.description);

      setUploadProgress(60);
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadProgress(100);

      setStatusMessage({ type: 'success', text: 'Media asset uploaded and processed successfully.' });
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadForm({ display_name: '', category: 'CAMPAIGN', tags: '', alt_text: '', description: '' });
      await fetchAssets();
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Upload failed.';
      setStatusMessage({ type: 'error', text: `Upload failed: ${errMsg}` });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Update Metadata
  const handleSaveMeta = async () => {
    if (!selectedAsset) return;
    try {
      setActionLoading(true);
      const tagList = editForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.put(`/media/${selectedAsset.media_id}`, {
        display_name: editForm.display_name,
        alt_text: editForm.alt_text,
        description: editForm.description,
        tags: tagList,
      });
      setStatusMessage({ type: 'success', text: 'Media metadata updated.' });
      setIsEditingMeta(false);
      await fetchAssets();
      setSelectedAsset((prev) => ({
        ...prev,
        display_name: editForm.display_name,
        alt_text: editForm.alt_text,
        description: editForm.description,
        tags: tagList,
      }));
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update asset metadata.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Replace Asset
  const handleReplaceAsset = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAsset) return;

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/media/${selectedAsset.media_id}/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatusMessage({ type: 'success', text: 'Asset replaced with new file. URL and media ID preserved.' });
      await fetchAssets();
      inspectAsset(res.data || res);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Replacement failed.';
      setStatusMessage({ type: 'error', text: `Replacement failed: ${errMsg}` });
    } finally {
      setActionLoading(false);
    }
  };

  // Archive / Unarchive
  const handleToggleArchive = async () => {
    if (!selectedAsset) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/media/${selectedAsset.media_id}/archive`);
      const updated = res.data || res;
      setStatusMessage({
        type: 'success',
        text: `Asset marked as ${updated.is_archived ? 'Archived' : 'Active'}.`,
      });
      await fetchAssets();
      setSelectedAsset(updated);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update archive status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Asset
  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    if (assetUsage?.is_in_use) {
      setStatusMessage({
        type: 'error',
        text: `Cannot delete: this asset is currently referenced by ${assetUsage.total_references} active section(s) or product(s). Archive or replace it instead.`,
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete "${selectedAsset.display_name}"?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await api.delete(`/media/${selectedAsset.media_id}`);
      setStatusMessage({ type: 'success', text: 'Asset safely deleted.' });
      setSelectedAsset(null);
      await fetchAssets();
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Delete failed.';
      setStatusMessage({ type: 'error', text: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy URL helper
  const copyMediaUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Filtering
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      asset.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.original_filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.tags && asset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesType =
      mediaTypeFilter === 'ALL' ||
      (mediaTypeFilter === 'IMAGE' && asset.media_type === 'image') ||
      (mediaTypeFilter === 'VIDEO' && asset.media_type === 'video');

    return matchesSearch && matchesType;
  });

  const totalBytes = assets.reduce((acc, a) => acc + (a.file_size || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const totalVideos = assets.filter((a) => a.media_type === 'video').length;
  const totalImages = assets.filter((a) => a.media_type === 'image').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Media Studio</h1>
            <Badge variant="primary" className="bg-primary-950 text-white font-bold">Phase 6.3</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Centralized media hub for high-performance campaign imagery, 720p/1080p MP4 videos, poster fallbacks, and usage tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAssets} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={<Upload className="w-4 h-4" />}
            className="bg-primary-900 text-white hover:bg-primary-800"
          >
            Upload Media
          </Button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Assets</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{assets.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">{totalMB} MB total storage</div>
        </Card>
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Campaign Videos</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{totalVideos}</div>
          <div className="text-xs text-slate-500 mt-0.5">MP4 / 720p HD with poster</div>
        </Card>
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">High-Res Images</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalImages}</div>
          <div className="text-xs text-slate-500 mt-0.5">WebP, PNG, JPEG</div>
        </Card>
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Storage Engine</div>
          <div className="text-lg font-black text-slate-800 mt-1">Docker Local</div>
          <div className="text-xs text-slate-500 mt-0.5">S3-Ready Service Layer</div>
        </Card>
      </div>

      {/* Search, Filter & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets by title, filename, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setMediaTypeFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                mediaTypeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMediaTypeFilter('IMAGE')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                mediaTypeFilter === 'IMAGE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Images
            </button>
            <button
              onClick={() => setMediaTypeFilter('VIDEO')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                mediaTypeFilter === 'VIDEO' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Videos
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100'}`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Assets Display */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-2" />
          <p className="text-sm">Loading media assets...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No media assets found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No assets match your search "${searchQuery}".`
              : 'Start by uploading campaign images or sports videos.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="mt-4"
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Upload First Asset
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.media_id}
              onClick={() => inspectAsset(asset)}
              className="group cursor-pointer overflow-hidden border-slate-200 hover:border-primary-400 hover:shadow-md transition-all bg-white flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                {asset.media_type === 'video' ? (
                  <>
                    {asset.poster_url ? (
                      <img
                        src={asset.poster_url}
                        alt={asset.alt_text || asset.display_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <Film className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    {asset.duration_seconds && (
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                        {asset.duration_seconds}s
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.alt_text || asset.display_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}
                {/* Type Badge */}
                <div className="absolute top-1.5 left-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      asset.media_type === 'video' ? 'bg-indigo-600 text-white' : 'bg-slate-900/80 text-white'
                    }`}
                  >
                    {asset.media_type}
                  </span>
                </div>
                {asset.is_archived && (
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold">
                    Archived
                  </div>
                )}
              </div>

              {/* Card Meta */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 truncate" title={asset.display_name}>
                    {asset.display_name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                    {asset.original_filename}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span>{(asset.file_size / 1024).toFixed(0)} KB</span>
                  <span>{asset.width ? `${asset.width}×${asset.height}` : '—'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List Mode Table */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dimensions</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map((asset) => (
                <tr key={asset.media_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 flex items-center gap-3">
                    <div className="w-12 h-9 bg-slate-900 rounded overflow-hidden shrink-0 flex items-center justify-center">
                      {asset.media_type === 'video' ? (
                        <Film className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <img src={asset.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 truncate max-w-xs">{asset.display_name}</div>
                      <div className="text-xs text-slate-400 font-mono truncate max-w-xs">{asset.original_filename}</div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        asset.media_type === 'video' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {asset.media_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs">
                    {asset.width ? `${asset.width}×${asset.height}` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-xs font-mono">{(asset.file_size / 1024).toFixed(0)} KB</td>
                  <td className="py-2.5 px-4 text-xs">
                    {asset.tags?.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="mr-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                        {t}
                      </span>
                    ))}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-400">
                    {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => inspectAsset(asset)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          UPLOAD MODAL
          ========================================================================= */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900">Upload Media Asset</h3>
                <p className="text-xs text-slate-500">
                  Accepts WebP, PNG, JPEG (≤10MB) & MP4/WebM videos (≤50MB).
                </p>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-primary-500 transition-colors bg-slate-50">
                {uploadPreview ? (
                  <div className="space-y-3">
                    <div className="max-h-48 rounded-lg overflow-hidden flex items-center justify-center bg-black">
                      {uploadFile?.type.startsWith('video/') ? (
                        <video src={uploadPreview} controls className="max-h-48 w-auto" />
                      ) : (
                        <img src={uploadPreview} alt="Preview" className="max-h-48 object-contain" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center justify-center gap-2">
                      <span className="font-bold text-slate-800">{uploadFile.name}</span>
                      <span>({(uploadFile.size / 1024).toFixed(0)} KB)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFile(null);
                          setUploadPreview(null);
                        }}
                        className="text-red-500 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-6">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <span className="text-sm font-bold text-primary-600 hover:text-primary-700">
                      Click to choose a file
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">or drag and drop sports imagery / video</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.display_name}
                    onChange={(e) => setUploadForm({ ...uploadForm, display_name: e.target.value })}
                    placeholder="e.g. Hero Sports Campaign"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="CAMPAIGN">Hero / Campaign</option>
                    <option value="COLLECTION">Collection</option>
                    <option value="EDITORIAL">Editorial Showcase</option>
                    <option value="PRODUCT">Product Merchandising</option>
                    <option value="COMMUNITY">Athlete Community</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alt Text (Accessibility) *</label>
                <input
                  type="text"
                  required
                  value={uploadForm.alt_text}
                  onChange={(e) => setUploadForm({ ...uploadForm, alt_text: e.target.value })}
                  placeholder="Descriptive text for screen readers & SEO"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="e.g. hero, 720p, running, cricket, autumn"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Processing file on server...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="md" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={uploading}
                  disabled={!uploadFile}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Upload & Register
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ASSET DETAILS & PREVIEW MODAL
          ========================================================================= */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    selectedAsset.media_type === 'video' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                  }`}
                >
                  {selectedAsset.media_type}
                </span>
                <h3 className="font-black text-lg text-slate-900 truncate max-w-md">
                  {selectedAsset.display_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Media Preview Box */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                {selectedAsset.media_type === 'video' ? (
                  <video
                    src={selectedAsset.url}
                    poster={selectedAsset.poster_url || undefined}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedAsset.url}
                    alt={selectedAsset.alt_text || selectedAsset.display_name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* URL & Quick Copy */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-mono text-slate-600 truncate flex-1 pl-2">
                  {selectedAsset.url}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyMediaUrl(selectedAsset.url)}
                  leftIcon={copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedUrl ? 'Copied' : 'Copy URL'}
                </Button>
                <a
                  href={selectedAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-900"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Metadata & Usage Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tech Specs */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-800 uppercase tracking-wider mb-2">Technical Specs</div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Media ID</span>
                    <span className="font-mono text-slate-800 font-bold">{selectedAsset.media_id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">MIME Type</span>
                    <span className="font-mono text-slate-800">{selectedAsset.mime_type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Dimensions</span>
                    <span className="font-mono text-slate-800">
                      {selectedAsset.width ? `${selectedAsset.width} × ${selectedAsset.height} px` : 'Auto'}
                    </span>
                  </div>
                  {selectedAsset.duration_seconds && (
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-mono text-slate-800">{selectedAsset.duration_seconds} seconds</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">File Size</span>
                    <span className="font-mono text-slate-800">
                      {(selectedAsset.file_size / 1024).toFixed(0)} KB ({(selectedAsset.file_size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                </div>

                {/* Usage Inspector */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider">Storefront Usage</span>
                    {loadingUsage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : assetUsage?.is_in_use ? (
                      <Badge variant="primary" className="bg-emerald-600 text-white text-[10px]">
                        Active ({assetUsage.total_references} refs)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 text-[10px]">
                        Unused
                      </Badge>
                    )}
                  </div>

                  {loadingUsage ? (
                    <p className="text-slate-400 py-4 text-center">Checking storefront references...</p>
                  ) : assetUsage?.is_in_use ? (
                    <div className="space-y-2">
                      <p className="text-slate-600">
                        This media is active on the storefront. Deletion is protected to avoid breaking customer journeys:
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {assetUsage.storefront_sections?.map((sec, idx) => (
                          <div key={idx} className="p-1.5 bg-white rounded border border-slate-200 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">{sec.title}</span>
                            <span className="text-[10px] text-slate-400">({sec.type})</span>
                          </div>
                        ))}
                        {assetUsage.products?.map((prod, idx) => (
                          <div key={idx} className="p-1.5 bg-white rounded border border-slate-200 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">{prod.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-slate-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <span>Not currently referenced by any active section or product.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Editable Metadata Form */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-sm text-slate-800">Asset Metadata & SEO</div>
                  {!isEditingMeta ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingMeta(true)}>
                      Edit Metadata
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingMeta(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSaveMeta} isLoading={actionLoading}>
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>

                {isEditingMeta ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Display Title</label>
                      <input
                        type="text"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Alt Text (Accessibility)</label>
                      <input
                        type="text"
                        value={editForm.alt_text}
                        onChange={(e) => setEditForm({ ...editForm, alt_text: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tags</label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Alt Text:</span>
                      <span className="text-slate-800 font-medium">{selectedAsset.alt_text || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {selectedAsset.tags?.length ? (
                          selectedAsset.tags.map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-[10px]">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {/* Safe Replace Action */}
                <label className="cursor-pointer">
                  <span className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Replace File
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleReplaceAsset}
                    disabled={actionLoading}
                    className="hidden"
                  />
                </label>

                {/* Archive Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleArchive}
                  isLoading={actionLoading}
                  leftIcon={<Archive className="w-3.5 h-3.5" />}
                >
                  {selectedAsset.is_archived ? 'Unarchive' : 'Archive'}
                </Button>
              </div>

              {/* Safe Delete */}
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAsset}
                isLoading={actionLoading}
                disabled={assetUsage?.is_in_use}
                title={assetUsage?.is_in_use ? 'Cannot delete asset while referenced by active sections' : 'Delete asset'}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Asset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
