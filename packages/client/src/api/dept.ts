// ===== 部门管理 API 接口 =====
// 定义部门相关的 TypeScript 类型和请求函数
// 部门使用树形结构，getDeptList 返回带 children 的完整树
import request from '../utils/request'

export interface DeptItem {
  id: number
  deptName: string
  parentId: number | null
  sort: number
  leader: string | null
  phone: string | null
  status: number
  createTime: string
  updateTime: string
  children: DeptItem[]
}

export interface DeptTreeItem {
  id: number
  deptName: string
  parentId: number | null
  children: DeptTreeItem[]
}

export interface CreateDeptParams {
  deptName: string
  parentId?: number
  sort?: number
  leader?: string
  phone?: string
  status?: number
}

export interface UpdateDeptParams {
  deptName?: string
  parentId?: number
  sort?: number
  leader?: string
  phone?: string
  status?: number
}

export function getDeptList(): Promise<DeptItem[]> {
  return request.get('/dept/list').then((res) => res.data)
}

export function getDeptTree(): Promise<DeptTreeItem[]> {
  return request.get('/dept/tree').then((res) => res.data)
}

export function getDeptDetail(id: number): Promise<DeptItem> {
  return request.get(`/dept/${id}`).then((res) => res.data)
}

export function createDept(data: CreateDeptParams): Promise<DeptItem> {
  return request.post('/dept', data).then((res) => res.data)
}

export function updateDept(id: number, data: UpdateDeptParams): Promise<DeptItem> {
  return request.put(`/dept/${id}`, data).then((res) => res.data)
}

export function deleteDept(id: number): Promise<{ message: string }> {
  return request.delete(`/dept/${id}`).then((res) => res.data)
}
