import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, CheckSquare, Square, Check, X } from 'lucide-react';
import api from '../../services/api';

export default function ProductList({ businessType }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  
  // New States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const limit = 100;

  const location = useLocation();
  const navigate = useNavigate();

  // Determine base path for links based on current route
  const basePath = location.pathname.includes('/sablon') ? '/admin/sablon/products' : '/admin/retail/products';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { 
        limit, 
        page,
        sortBy,
        sortOrder
      };
      
      if (businessType === 'SABLON_SERVICE') {
        params.productType = 'SABLON_TEMPLATE';
      } else {
        params.businessType = businessType;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/products', { params });
      setProducts(response.data?.data || []);
      setTotalPages(response.data?.meta?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setError(err?.response?.data?.message || 'Gagal memuat produk dari database.');
    } finally {
      setLoading(false);
    }
  };

  // Reset selectedIds when page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page]);

  // Reset page to 1 when search or sorting changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    // Adding a slight debounce for search
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [businessType, page, sortBy, sortOrder, searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Gagal menghapus produk');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} produk terpilih?`)) return;
    try {
      setBulkLoading(true);
      await api.post('/products/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      alert('Gagal menghapus produk secara massal');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatus = async (isActive) => {
    const actionText = isActive ? 'mengaktifkan' : 'menonaktifkan';
    if (!window.confirm(`Yakin ingin ${actionText} ${selectedIds.length} produk terpilih?`)) return;
    try {
      setBulkLoading(true);
      await api.patch('/products/bulk-status', { ids: selectedIds, isActive });
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      alert(`Gagal ${actionText} produk secara massal`);
    } finally {
      setBulkLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'createdAt' ? 'desc' : 'asc'); // Default order for new column
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowDown className="w-3 h-3 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-aria-charcoal" /> : <ArrowDown className="w-3 h-3 ml-1 text-aria-charcoal" />;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manajemen Produk {businessType === 'SABLON_SERVICE' ? 'Sablon' : 'Retail'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola katalog produk, harga, dan stok dari database Anda.
          </p>
        </div>
        <Link 
          to={`${basePath}/add`}
          className="inline-flex items-center justify-center bg-aria-charcoal hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {businessType === 'SABLON_SERVICE' ? 'Tambah Bahan' : 'Tambah Produk'}
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar: Search and Bulk Actions */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Cari nama produk atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aria-charcoal focus:border-transparent outline-none transition-all"
            />
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-sm font-medium text-gray-600 mr-2 bg-gray-200 px-2 py-1 rounded-md">{selectedIds.length} Terpilih</span>
              <button 
                onClick={() => handleBulkStatus(true)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Aktifkan
              </button>
              <button 
                onClick={() => handleBulkStatus(false)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-orange-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Non-aktifkan
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {/* Table Container */}
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-600 border-b border-gray-200 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-aria-charcoal focus:ring-aria-charcoal cursor-pointer"
                  />
                </th>
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 group transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center">Produk <SortIcon column="name" /></div>
                </th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 group transition-colors"
                  onClick={() => toggleSort('price')}
                >
                  <div className="flex items-center">Harga <SortIcon column="price" /></div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-50 group transition-colors"
                  onClick={() => toggleSort('stock')}
                >
                  <div className="flex items-center">Stok <SortIcon column="stock" /></div>
                </th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aria-charcoal mb-4"></div>
                      <p className="font-medium text-gray-600">Memuat data produk...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Search className="w-12 h-12 mb-3 text-gray-300" />
                      <p className="text-base font-medium text-gray-600">Tidak ada produk ditemukan</p>
                      <p className="text-sm mt-1">Coba sesuaikan pencarian Anda atau tambahkan produk baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50/80 transition-colors ${selectedIds.includes(product.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product.id)}
                        onChange={() => handleSelectOne(product.id)}
                        className="w-4 h-4 rounded border-gray-300 text-aria-charcoal focus:ring-aria-charcoal cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {(() => {
                            let imgSrc = product.imageUrl;
                            if (!imgSrc && product.imageUrls) {
                              try {
                                const parsed = typeof product.imageUrls === 'string' ? JSON.parse(product.imageUrls) : product.imageUrls;
                                if (Array.isArray(parsed) && parsed.length > 0) imgSrc = parsed[0];
                              } catch(e) {}
                            }
                            if (imgSrc) {
                              if (imgSrc.startsWith('/')) {
                                imgSrc = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + imgSrc : imgSrc;
                              }
                              return <img src={imgSrc} alt={product.productName} className="h-full w-full object-cover" />;
                            }
                            return <ImageIcon className="w-5 h-5 text-gray-400" />;
                          })()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">{product.productName}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">{product.description || 'Tidak ada deskripsi'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {product.categoryName || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* // TODO: Implementasikan kolom unit/satuan di tabel produk di masa depan agar bisa menangani variasi (meter, ml, pack, dll) */}
                      {(() => {
                        const isBawaSendiri = product.productName?.toLowerCase().includes('bawa sendiri');
                        const isUntracked = isBawaSendiri || product.trackStock === false || product.trackStock === 0;
                        return (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isUntracked ? 'bg-gray-100 text-gray-600 border border-gray-200' : product.stockQuantity > 10 ? 'bg-green-100 text-green-800' : product.stockQuantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {isUntracked ? 'Tanpa Batas' : `${product.stockQuantity} ${product.unit || 'pcs'}`}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${product.isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {product.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`${basePath}/edit/${product.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 0 && (
          <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Menampilkan Halaman <span className="font-semibold text-gray-900">{page}</span> dari <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
