'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Department, Unit } from '@/types/contest';

export default function AdminDepartmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'units'>('departments');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    try {
      setLoading(true);

      const deptRes = await fetch('/api/admin/departments');
      const deptData = await deptRes.json();
      if (deptData.success) {
        setDepartments(deptData.data || []);
      }

      const unitsRes = await fetch('/api/admin/units');
      const unitsData = await unitsRes.json();
      if (unitsData.success) {
        setUnits(unitsData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDepartment = async (data: any) => {
    try {
      const url = '/api/admin/departments';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem.id, ...data } : data;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (result.success) {
        alert(editingItem ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
        setShowModal(false);
        setEditingItem(null);
        loadData();
      } else {
        alert(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleSaveUnit = async (data: any) => {
    try {
      const url = '/api/admin/units';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem.id, ...data } : data;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (result.success) {
        alert(editingItem ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
        setShowModal(false);
        setEditingItem(null);
        loadData();
      } else {
        alert(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving unit:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (type: 'department' | 'unit', id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    try {
      const url = type === 'department'
        ? `/api/admin/departments?id=${id}`
        : `/api/admin/units?id=${id}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        alert('Xóa thành công!');
        loadData();
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Có lỗi xảy ra');
    }
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Quản lý Đơn vị & Khoa/Phòng</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'departments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Đơn vị ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === 'units'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Khoa/Phòng ({units.length})
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
        >
          + Thêm {activeTab === 'departments' ? 'Đơn vị' : 'Khoa/Phòng'}
        </button>
      </div>

      {activeTab === 'departments' ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Tên đơn vị</th>
                <th className="px-6 py-3 text-left">Mã</th>
                <th className="px-6 py-3 text-center">Trạng thái</th>
                <th className="px-6 py-3 text-center">Số khoa/phòng</th>
                <th className="px-6 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departments.map(dept => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">{dept.name}</td>
                  <td className="px-6 py-4 text-gray-600">{dept.code || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      dept.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dept.is_active ? 'Hoạt động' : 'Tạm ngừng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {units.filter(u => u.department_id === dept.id).length}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setEditingItem(dept);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded mr-2 hover:bg-blue-700"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete('department', dept.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Tên khoa/phòng</th>
                <th className="px-6 py-3 text-left">Thuộc đơn vị</th>
                <th className="px-6 py-3 text-left">Mã</th>
                <th className="px-6 py-3 text-center">Trạng thái</th>
                <th className="px-6 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {units.map(unit => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">{unit.name}</td>
                  <td className="px-6 py-4 text-gray-600">{unit.department?.name || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{unit.code || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      unit.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {unit.is_active ? 'Hoạt động' : 'Tạm ngừng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setEditingItem(unit);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded mr-2 hover:bg-blue-700"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete('unit', unit.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        activeTab === 'departments' ? (
          <DepartmentModal
            department={editingItem}
            onClose={() => {
              setShowModal(false);
              setEditingItem(null);
            }}
            onSave={handleSaveDepartment}
          />
        ) : (
          <UnitModal
            unit={editingItem}
            departments={departments}
            onClose={() => {
              setShowModal(false);
              setEditingItem(null);
            }}
            onSave={handleSaveUnit}
          />
        )
      )}
    </div>
  );
}

function DepartmentModal({ department, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    code: department?.code || '',
    description: department?.description || '',
    is_active: department?.is_active ?? true
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-bold mb-6">{department ? 'Sửa đơn vị' : 'Thêm đơn vị mới'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Tên đơn vị *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Mã</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 border-2 rounded-lg"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold">Hoạt động</span>
            </label>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg">
              Hủy
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UnitModal({ unit, departments, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    code: unit?.code || '',
    department_id: unit?.department_id || '',
    description: unit?.description || '',
    is_active: unit?.is_active ?? true
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-bold mb-6">{unit ? 'Sửa khoa/phòng' : 'Thêm khoa/phòng mới'}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Đơn vị *</label>
            <select
              required
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              className="w-full px-4 py-2 border-2 rounded-lg"
            >
              <option value="">-- Chọn đơn vị --</option>
              {departments.map((d: Department) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Tên khoa/phòng *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Mã</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 border-2 rounded-lg"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold">Hoạt động</span>
            </label>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg">
              Hủy
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



























