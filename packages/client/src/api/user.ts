// ===== 用户管理 API 接口 =====
// 用户 CRUD + 角色关联 + 密码重置 + 状态切换
import request from '../utils/request';

export interface UserItem {
  id: number;
  username: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  gender: number | null;
  status: number;
  deptId: number | null;
  deptName: string | null;
  roles: { id: number; roleName: string }[];
  createTime: string;
  updateTime: string;
}

export interface UserListResult {
  list: UserItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserDetail extends UserItem {
  roleIds: number[];
}

export interface QueryUserParams {
  page?: number;
  pageSize?: number;
  username?: string;
  phone?: string;
  status?: number;
  deptId?: number;
}

export interface CreateUserParams {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: number;
  deptId?: number;
  roleIds?: number[];
}

export interface UpdateUserParams {
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: number;
  deptId?: number;
  roleIds?: number[];
}

export function getUserList(params: QueryUserParams): Promise<UserListResult> {
  return request.get('/user/list', { params }).then((res) => res.data);
}

export function getUserDetail(id: number): Promise<UserDetail> {
  return request.get(`/user/${id}`).then((res) => res.data);
}

export function createUser(data: CreateUserParams): Promise<{ id: number; username: string }> {
  return request.post('/user', data).then((res) => res.data);
}

export function updateUser(id: number, data: UpdateUserParams): Promise<{ id: number; username: string }> {
  return request.put(`/user/${id}`, data).then((res) => res.data);
}

export function deleteUser(id: number): Promise<{ message: string }> {
  return request.delete(`/user/${id}`).then((res) => res.data);
}

export function deleteUsers(ids: number[]): Promise<{ message: string }> {
  return request.post('/user/batch-delete', { ids }).then((res) => res.data);
}

export function resetUserPassword(id: number): Promise<{ message: string }> {
  return request.put(`/user/${id}/reset-password`).then((res) => res.data);
}

export function toggleUserStatus(id: number): Promise<{ message: string; status: number }> {
  return request.put(`/user/${id}/toggle-status`).then((res) => res.data);
}
