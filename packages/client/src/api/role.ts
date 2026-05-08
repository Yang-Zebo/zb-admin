import request from '../utils/request'

export interface RoleItem {
  id: number
  roleName: string
  roleKey: string
  status: number
  sort: number
  userCount: number
  createTime: string
  updateTime: string
}

export interface RoleListResult {
  list: RoleItem[]
  total: number
  page: number
  pageSize: number
}

export interface RoleSimple {
  id: number
  roleName: string
  roleKey: string
}

export interface RoleDetail extends RoleItem {
  menuIds: number[]
}

export interface QueryRoleParams {
  page?: number
  pageSize?: number
  roleName?: string
  roleKey?: string
  status?: number
}

export interface CreateRoleParams {
  roleName: string
  roleKey: string
  sort?: number
  status?: number
}

export interface UpdateRoleParams {
  roleName?: string
  roleKey?: string
  sort?: number
  status?: number
}

export function getRoleList(params: QueryRoleParams): Promise<RoleListResult> {
  return request.get('/role/list', { params }).then((res) => res.data)
}

export function getAllRoles(): Promise<RoleSimple[]> {
  return request.get('/role/all').then((res) => res.data)
}

export function getRoleDetail(id: number): Promise<RoleDetail> {
  return request.get(`/role/${id}`).then((res) => res.data)
}

export function createRole(data: CreateRoleParams): Promise<RoleItem> {
  return request.post('/role', data).then((res) => res.data)
}

export function updateRole(id: number, data: UpdateRoleParams): Promise<RoleItem> {
  return request.put(`/role/${id}`, data).then((res) => res.data)
}

export function deleteRole(id: number): Promise<{ message: string }> {
  return request.delete(`/role/${id}`).then((res) => res.data)
}

export function assignRoleMenus(id: number, menuIds: number[]): Promise<{ message: string }> {
  return request.put(`/role/${id}/menus`, { menuIds }).then((res) => res.data)
}
