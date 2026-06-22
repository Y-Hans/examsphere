'use client';

import { useState, useEffect } from 'react';
import { getTenantsAction, updateTenantStatusAction } from '@/modules/super-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';

export default function TenantsManagementPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    const res = await getTenantsAction({ search, type: typeFilter || undefined, page: 1, pageSize: 50 });
    if (res.success) setTenants(res.data?.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const delay = setTimeout(fetchTenants, 300);
    return () => clearTimeout(delay);
  }, [search, typeFilter]);

  const handleStatusChange = async (tenantId: string, status: string) => {
    setUpdatingId(tenantId);
    const formData = new FormData();
    formData.append('tenantId', tenantId);
    formData.append('status', status);
    
    const res = await updateTenantStatusAction(formData);
    if (res.success) {
      fetchTenants();
    } else {
      alert(res.error?.message);
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name or subdomain..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
            <SelectItem value="INSTITUTE">Institute</SelectItem>
            <SelectItem value="SCHOOL">School</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    <div className="text-sm text-gray-500">{tenant.subdomain}.examsphere.com</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant._count.users}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      tenant.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {updatingId === tenant.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Select onValueChange={(value) => handleStatusChange(tenant.id, value)} defaultValue={tenant.status}>
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Activate</SelectItem>
                          <SelectItem value="SUSPENDED">Suspend</SelectItem>
                          <SelectItem value="TERMINATED">Terminate</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}