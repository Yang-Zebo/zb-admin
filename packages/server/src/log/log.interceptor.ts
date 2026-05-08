import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request } from 'express'
import { LogService } from '../log/log.service.js'

const ACTION_TYPE_MAP: Record<string, string> = {
  POST: '新增',
  PUT: '修改',
  DELETE: '删除',
  GET: '查询',
}

const MODULE_MAP: Record<string, string> = {
  user: '用户管理',
  role: '角色管理',
  menu: '菜单管理',
  dept: '部门管理',
  dict: '字典管理',
  log: '操作日志',
  auth: '认证授权',
}

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(private readonly logService: LogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>()
    const method = req.method
    const url = req.path
    const startTime = Date.now()

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const pathParts = url.replace('/api/', '').split('/')
          const moduleKey = pathParts[0] || ''

          const actionType = ACTION_TYPE_MAP[method] || method
          const moduleName = MODULE_MAP[moduleKey] || moduleKey

          const user = (req as any).user
          const userId = user?.userId ?? null

          const duration = Date.now() - startTime

          await this.logService.create({
            userId,
            ip: req.ip || req.socket.remoteAddress || '',
            actionType,
            module: moduleName,
            description: `${actionType}${moduleName}`,
            requestParams: method !== 'GET' ? JSON.stringify(req.body) : '',
            responseResult: response ? JSON.stringify(response).slice(0, 2000) : '',
            duration,
          })
        } catch {
          // silently fail
        }
      }),
    )
  }
}
