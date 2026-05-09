// ===== 字典管理 API 接口 =====
// 字典系统用于管理可配置的枚举数据，前端通过 dictType 获取对应选项列表
import request from '../utils/request'

export interface DictItem {
  id: number
  dictName: string
  dictType: string
  dictLabel: string
  dictValue: string
  sort: number
  status: number
  createTime: string
  updateTime: string
}

export interface DictType {
  dictType: string
  dictName: string
}

export interface QueryDictParams {
  page?: number
  pageSize?: number
  dictName?: string
  dictType?: string
  status?: number
}

export interface CreateDictParams {
  dictName: string
  dictType: string
  dictLabel: string
  dictValue: string
  sort?: number
  status?: number
}

export interface UpdateDictParams {
  dictName?: string
  dictType?: string
  dictLabel?: string
  dictValue?: string
  sort?: number
  status?: number
}

export function getDictList(params: QueryDictParams): Promise<{ list: DictItem[]; total: number; page: number; pageSize: number }> {
  return request.get('/dict/list', { params }).then((res) => res.data)
}

export function getDictTypes(): Promise<DictType[]> {
  return request.get('/dict/types').then((res) => res.data)
}

export function getDictByType(dictType: string): Promise<DictItem[]> {
  return request.get(`/dict/type/${dictType}`).then((res) => res.data)
}

export function getDictDetail(id: number): Promise<DictItem> {
  return request.get(`/dict/${id}`).then((res) => res.data)
}

export function createDict(data: CreateDictParams): Promise<DictItem> {
  return request.post('/dict', data).then((res) => res.data)
}

export function updateDict(id: number, data: UpdateDictParams): Promise<DictItem> {
  return request.put(`/dict/${id}`, data).then((res) => res.data)
}

export function deleteDict(id: number): Promise<{ message: string }> {
  return request.delete(`/dict/${id}`).then((res) => res.data)
}
