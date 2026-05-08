import request from '../utils/request'

export interface LogItem {
  id: number
  userId: number | null
  ip: string | null
  actionType: string
  module: string
  description: string | null
  requestParams: string | null
  responseResult: string | null
  duration: number
  createdTime: string
}

export interface QueryLogParams {
  page?: number
  pageSize?: number
  userId?: number
  actionType?: string
  module?: string
  startTime?: string
  endTime?: string
}

export function getLogList(params: QueryLogParams): Promise<{ list: LogItem[]; total: number; page: number; pageSize: number }> {
  return request.get('/log/list', { params }).then((res) => res.data)
}
