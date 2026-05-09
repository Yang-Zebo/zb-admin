// ===== 菜单管理 API 接口 =====
// 菜单使用树形结构，menuType: 0=目录, 1=菜单页面, 2=按钮
import request from '../utils/request'

export interface MenuItem {
  id: number
  menuName: string
  parentId: number | null
  menuType: number
  routePath: string | null
  componentPath: string | null
  permission: string | null
  icon: string | null
  sort: number
  isVisible: number
  isCache: number
  isExternal: number
  createTime: string
  updateTime: string
  children: MenuItem[]
}

export interface CreateMenuParams {
  menuName: string
  parentId?: number
  menuType: number
  routePath?: string
  componentPath?: string
  permission?: string
  icon?: string
  sort?: number
  isVisible?: number
  isCache?: number
  isExternal?: number
}

export interface UpdateMenuParams {
  menuName?: string
  parentId?: number
  menuType?: number
  routePath?: string
  componentPath?: string
  permission?: string
  icon?: string
  sort?: number
  isVisible?: number
  isCache?: number
  isExternal?: number
}

export function getMenuList(): Promise<MenuItem[]> {
  return request.get('/menu/list').then((res) => res.data)
}

export function getMenuTree(): Promise<MenuItem[]> {
  return request.get('/menu/tree').then((res) => res.data)
}

export function getMenuDetail(id: number): Promise<MenuItem> {
  return request.get(`/menu/${id}`).then((res) => res.data)
}

export function createMenu(data: CreateMenuParams): Promise<MenuItem> {
  return request.post('/menu', data).then((res) => res.data)
}

export function updateMenu(id: number, data: UpdateMenuParams): Promise<MenuItem> {
  return request.put(`/menu/${id}`, data).then((res) => res.data)
}

export function deleteMenu(id: number): Promise<{ message: string }> {
  return request.delete(`/menu/${id}`).then((res) => res.data)
}
