'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Users, Tag, X, Shield, ShieldOff, Trash2, Search, Store, Phone, MapPin, CreditCard, FileText, UserCog } from 'lucide-react'
import Image from 'next/image'
import type { PriceGroup, Branch, UserBranch } from '@/types'

export interface UserWithGroups {
    id: string
    name: string
    email: string
    image: string
    is_admin: boolean
    is_operator: boolean
    created_at: string
    shop_name?: string
    phone?: string
    address?: string
    bank_account?: string
    bank_name?: string
    note?: string
    user_group_access: {
        id: string
        price_group_id: string
        price_groups: {
            id: string
            name: string
        }
    }[]
    user_branches?: UserBranch[]
}

interface UsersManagementProps {
    initialUsers: UserWithGroups[]
    initialPriceGroups: PriceGroup[]
    initialBranches: Branch[]
}

export function UsersManagement({ initialUsers, initialPriceGroups, initialBranches }: UsersManagementProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState<UserWithGroups[]>(initialUsers)
    const [priceGroups] = useState<PriceGroup[]>(initialPriceGroups)
    const [branches] = useState<Branch[]>(initialBranches)
    const [editingUser, setEditingUser] = useState<UserWithGroups | null>(null)
    const [selectedGroups, setSelectedGroups] = useState<string[]>([])
    const [editingBranches, setEditingBranches] = useState<UserWithGroups | null>(null)
    const [selectedBranches, setSelectedBranches] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)
    const [groupSearch, setGroupSearch] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'operator'>('all')
    const [branchFilter, setBranchFilter] = useState<string>('all')
    const [editingDetails, setEditingDetails] = useState<UserWithGroups | null>(null)
    const [detailsForm, setDetailsForm] = useState({
        shop_name: '',
        phone: '',
        address: '',
        bank_name: '',
        bank_account: '',
        note: ''
    })

    const isPrivileged = !!session?.user?.isAdmin

    const logAction = async (action: string, details: any) => {
        try {
            await fetch('/api/user-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, details })
            })
        } catch (error) {
            console.error('Error logging action:', error)
        }
    }

    const fetchData = async () => {
        try {
            setError(null)
            const usersRes = await fetch('/api/admin/users')

            if (usersRes.ok) {
                const data = await usersRes.json()
                setUsers(data || [])
            } else {
                const errData = await usersRes.json()
                setError(`Error: ${errData.error || usersRes.statusText}`)
            }
        } catch (err) {
            console.error('Error fetching data:', err)
            setError('ไม่สามารถโหลดข้อมูลได้')
        }
    }

    const handleEditGroups = (user: UserWithGroups) => {
        setEditingUser(user)
        setSelectedGroups(user.user_group_access.map(a => a.price_group_id))
        setGroupSearch('')
    }

    const filteredGroups = priceGroups.filter(group =>
        group.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(groupSearch.toLowerCase()))
    )

    const filteredUsers = users
        .filter(user =>
            (user.name && user.name.toLowerCase().includes(userSearch.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase())) ||
            (user.shop_name && user.shop_name.toLowerCase().includes(userSearch.toLowerCase())) ||
            (user.phone && user.phone.includes(userSearch))
        )
        .filter(user => {
            if (roleFilter === 'admin') return user.is_admin
            if (roleFilter === 'operator') return user.is_operator
            return true
        })
        .filter(user => {
            if (branchFilter === 'all') return true
            if (branchFilter === 'none') return !user.user_branches || user.user_branches.length === 0
            return user.user_branches?.some(ub => ub.branch_id === branchFilter)
        })
        .slice(0, 50)

    const handleEditDetails = (user: UserWithGroups) => {
        setEditingDetails(user)
        setDetailsForm({
            shop_name: user.shop_name || '',
            phone: user.phone || '',
            address: user.address || '',
            bank_name: user.bank_name || '',
            bank_account: user.bank_account || '',
            note: user.note || ''
        })
    }

    const handleSaveDetails = async () => {
        if (!editingDetails) return

        try {
            const res = await fetch(`/api/admin/users/${editingDetails.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(detailsForm)
            })

            if (res.ok) {
                logAction('edit_user', {
                    message: `แก้ไขข้อมูลของ ${editingDetails.name}`,
                    changes: detailsForm
                })
                setEditingDetails(null)
                fetchData()
            }
        } catch (error) {
            console.error('Error saving details:', error)
        }
    }

    const handleSaveGroups = async () => {
        if (!editingUser) return

        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}/groups`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_ids: selectedGroups })
            })

            if (res.ok) {
                logAction('edit_user', {
                    message: `แก้ไขกลุ่มของ ${editingUser.name}`,
                    groups: selectedGroups
                })
                setEditingUser(null)
                fetchData()
            }
        } catch (error) {
            console.error('Error saving groups:', error)
        }
    }

    const handleEditBranches = (user: UserWithGroups) => {
        setEditingBranches(user)
        setSelectedBranches((user.user_branches || []).map(b => b.branch_id))
    }

    const handleSaveBranches = async () => {
        if (!editingBranches) return

        try {
            const res = await fetch(`/api/admin/users/${editingBranches.id}/branches`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branchIds: selectedBranches })
            })

            if (res.ok) {
                logAction('edit_user', {
                    message: `แก้ไขสาขาของ ${editingBranches.name}`,
                    branches: selectedBranches
                })
                setEditingBranches(null)
                fetchData()
            }
        } catch (error) {
            console.error('Error saving branches:', error)
        }
    }

    const handleRemoveFromBranch = async (userId: string, branchId: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/branches?branchId=${branchId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                const user = users.find(u => u.id === userId)
                logAction('edit_user', {
                    message: `ลบสาขาออกจากผู้ใช้ ${user?.name || userId}`,
                    branchId
                })
                fetchData()
            }
        } catch (error) {
            console.error('Error removing branch:', error)
        }
    }

    const handleRemoveFromGroup = async (userId: string, groupId: string) => {
        if (!confirm('ลบผู้ใช้ออกจากกลุ่มนี้?')) return

        try {
            const res = await fetch(`/api/admin/users/${userId}/groups?group_id=${groupId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                const user = users.find(u => u.id === userId)
                logAction('edit_user', {
                    message: `ลบกลุ่มออกจากผู้ใช้ ${user?.name || userId}`,
                    groupId
                })
                fetchData()
            }
        } catch (error) {
            console.error('Error removing from group:', error)
        }
    }

    const handleToggleAdmin = async (user: UserWithGroups) => {
        if (!confirm(user.is_admin ? 'ยกเลิกสิทธิ์ Admin?' : 'ให้สิทธิ์ Admin?')) return

        try {
            await fetch(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_admin: !user.is_admin })
            })

            logAction('grant_admin', {
                message: `${!user.is_admin ? 'ให้' : 'ยกเลิก'}สิทธิ์ Admin แก่ ${user.name}`
            })
            fetchData()
        } catch (error) {
            console.error('Error toggling admin:', error)
        }
    }

    const handleToggleOperator = async (user: UserWithGroups) => {
        if (!confirm(user.is_operator ? 'ยกเลิกสิทธิ์ Operator?' : 'ให้สิทธิ์ Operator?')) return

        try {
            await fetch(`/api/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_operator: !user.is_operator })
            })

            logAction('edit_user', {
                message: `${!user.is_operator ? 'ให้' : 'ยกเลิก'}สิทธิ์ Operator แก่ ${user.name}`
            })
            fetchData()
        } catch (error) {
            console.error('Error toggling operator:', error)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('ลบผู้ใช้นี้? ข้อมูลทั้งหมดจะถูกลบ')) return

        try {
            await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
            const user = users.find(u => u.id === userId)
            logAction('edit_user', {
                message: `ลบผู้ใช้ ${user?.name || userId}`
            })
            fetchData()
        } catch (error) {
            console.error('Error deleting user:', error)
        }
    }

    return (
        <>
            {/* Error */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล)..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-line/50 shadow-sm"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'operator')}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-line/50 shadow-sm text-sm"
                    aria-label="กรองตามบทบาท"
                >
                    <option value="all">ทั้งหมด</option>
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                </select>
                <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-line/50 shadow-sm text-sm"
                    aria-label="กรองตามสาขา"
                >
                    <option value="all">ทุกสาขา</option>
                    <option value="none">ไม่มีสาขา</option>
                    {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 border-b bg-gray-50 text-sm text-gray-600">
                    แสดง {filteredUsers.length} จาก {users.length} รายการ {filteredUsers.length === 50 && '(จำกัด 50 รายการ)'}
                </div>
                {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>{userSearch ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้'}</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {user.image ? (
                                            <Image
                                                src={user.image}
                                                alt={user.name || ''}
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Users className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-gray-900">{user.name || 'ไม่มีชื่อ'}</p>
                                            {user.is_admin && (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                    Admin
                                                </span>
                                            )}
                                            {user.is_operator && (
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                                    Operator
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{user.email}</p>

                                        {(user.shop_name || user.phone) && (
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600">
                                                {user.shop_name && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Store className="w-3 h-3" />
                                                        {user.shop_name}
                                                    </span>
                                                )}
                                                {user.phone && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {user.phone}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Groups */}
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-1">กลุ่มราคา:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {user.user_group_access.map((access) => (
                                                    <span
                                                        key={access.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-line/10 text-line text-xs rounded-full"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        {access.price_groups?.name}
                                                        <button
                                                            onClick={() => handleRemoveFromGroup(user.id, access.price_group_id)}
                                                            className="ml-1 hover:text-red-500"
                                                            aria-label="ลบออกจากกลุ่ม"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                {user.user_group_access.length === 0 && (
                                                    <span className="text-xs text-gray-400">ไม่มีกลุ่ม</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Branches */}
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-1">สาขา:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(user.user_branches || []).map((ub) => (
                                                    <span
                                                        key={ub.id}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                                    >
                                                        <MapPin className="w-3 h-3" />
                                                        {ub.branch?.name}
                                                        <button
                                                            onClick={() => handleRemoveFromBranch(user.id, ub.branch_id)}
                                                            className="ml-1 hover:text-red-500"
                                                            aria-label="ลบออกจากสาขา"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                                {(!user.user_branches || user.user_branches.length === 0) && (
                                                    <span className="text-xs text-gray-400">ไม่มีสาขา</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditDetails(user)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                            title="แก้ไขรายละเอียด"
                                            aria-label="แก้ไขรายละเอียด"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEditBranches(user)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg"
                                            title="แก้ไขสาขา"
                                            aria-label="แก้ไขสาขา"
                                        >
                                            <MapPin className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEditGroups(user)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                            title="แก้ไขกลุ่ม"
                                            aria-label="แก้ไขกลุ่ม"
                                        >
                                            <Tag className="w-4 h-4" />
                                        </button>
                                        {isPrivileged && (
                                            <>
                                                <button
                                                    onClick={() => handleToggleOperator(user)}
                                                    className={`p-2 rounded-lg ${user.is_operator
                                                        ? 'text-orange-600 hover:bg-orange-100'
                                                        : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                    title={user.is_operator ? 'ยกเลิก Operator' : 'ให้สิทธิ์ Operator'}
                                                    aria-label={user.is_operator ? 'ยกเลิก Operator' : 'ให้สิทธิ์ Operator'}
                                                >
                                                    <UserCog className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleAdmin(user)}
                                                    className={`p-2 rounded-lg ${user.is_admin
                                                        ? 'text-purple-600 hover:bg-purple-100'
                                                        : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                    title={user.is_admin ? 'ยกเลิก Admin' : 'ให้สิทธิ์ Admin'}
                                                    aria-label={user.is_admin ? 'ยกเลิก Admin' : 'ให้สิทธิ์ Admin'}
                                                >
                                                    {user.is_admin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                                    title="ลบผู้ใช้"
                                                    aria-label="ลบผู้ใช้"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Groups Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">แก้ไขกลุ่มของ {editingUser.name}</h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                aria-label="ปิด"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-600 mb-3">เลือกกลุ่มที่ต้องการให้เข้าถึง:</p>
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหากลุ่ม..."
                                    value={groupSearch}
                                    onChange={(e) => setGroupSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line/50"
                                />
                            </div>
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                {filteredGroups.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4">ไม่พบกลุ่มที่ค้นหา</p>
                                ) : (
                                    filteredGroups.map((group) => (
                                        <label
                                            key={group.id}
                                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${selectedGroups.includes(group.id) ? 'border-line bg-line/5' : ''
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.includes(group.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedGroups([...selectedGroups, group.id])
                                                    } else {
                                                        setSelectedGroups(selectedGroups.filter(id => id !== group.id))
                                                    }
                                                }}
                                                className="w-4 h-4 text-line rounded"
                                            />
                                            <div>
                                                <span className="font-medium">{group.name}</span>
                                                {group.description && (
                                                    <p className="text-xs text-gray-500">{group.description}</p>
                                                )}
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveGroups}
                                className="flex-1 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Details Modal */}
            {editingDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold">รายละเอียดผู้ใช้</h3>
                            <button
                                onClick={() => setEditingDetails(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                aria-label="ปิด"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                    {editingDetails.image ? (
                                        <Image
                                            src={editingDetails.image}
                                            alt={editingDetails.name || ''}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Users className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">{editingDetails.name}</p>
                                    <p className="text-sm text-gray-500">{editingDetails.email}</p>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <Store className="w-4 h-4" />
                                    ชื่อร้าน
                                </label>
                                <input
                                    type="text"
                                    value={detailsForm.shop_name}
                                    onChange={(e) => setDetailsForm({ ...detailsForm, shop_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line/50"
                                    placeholder="ชื่อร้านค้า"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="w-4 h-4" />
                                    เบอร์โทรศัพท์
                                </label>
                                <input
                                    type="tel"
                                    value={detailsForm.phone}
                                    onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line/50"
                                    placeholder="0xx-xxx-xxxx"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <MapPin className="w-4 h-4" />
                                    ที่อยู่
                                </label>
                                <textarea
                                    value={detailsForm.address}
                                    onChange={(e) => setDetailsForm({ ...detailsForm, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line/50"
                                    rows={2}
                                    placeholder="ที่อยู่สำหรับจัดส่ง"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        <CreditCard className="w-4 h-4" />
                                        ธนาคาร
                                    </label>
                                    <input
                                        type="text"
                                        value={detailsForm.bank_name}
                                        onChange={(e) => setDetailsForm({ ...detailsForm, bank_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line/50"
                                        placeholder="ชื่อธนาคาร"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">เลขบัญชี</label>
                                    <input
                                        type="text"
                                        value={detailsForm.bank_account}
                                        onChange={(e) => setDetailsForm({ ...detailsForm, bank_account: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line/50"
                                        placeholder="xxx-x-xxxxx-x"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
                                <textarea
                                    value={detailsForm.note}
                                    onChange={(e) => setDetailsForm({ ...detailsForm, note: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-line/50"
                                    rows={2}
                                    placeholder="หมายเหตุเพิ่มเติม"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 border-t sticky bottom-0 bg-white">
                            <button
                                onClick={() => setEditingDetails(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveDetails}
                                className="flex-1 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Branches Modal */}
            {editingBranches && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold">แก้ไขสาขาของ {editingBranches.name}</h3>
                            <button
                                onClick={() => setEditingBranches(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                                aria-label="ปิด"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-600 mb-3">เลือกสาขาที่ผู้ใช้สามารถเข้าถึงได้:</p>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {branches.map((branch) => (
                                    <label
                                        key={branch.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedBranches.includes(branch.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedBranches([...selectedBranches, branch.id])
                                                } else {
                                                    setSelectedBranches(selectedBranches.filter(id => id !== branch.id))
                                                }
                                            }}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-indigo-600" />
                                            <div>
                                                <span className="font-medium">{branch.name}</span>
                                                <span className="text-xs text-gray-500 ml-2">({branch.code})</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setEditingBranches(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveBranches}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
