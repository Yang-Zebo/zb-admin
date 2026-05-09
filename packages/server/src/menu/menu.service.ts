// ===== 菜单管理服务 =====
// 封装菜单 CRUD 和菜单树构建
// buildTree 方法将扁平菜单数据转为层级树结构（用于前端侧边栏渲染）
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateMenuDto } from './dto/create-menu.dto.js'
import { UpdateMenuDto } from './dto/update-menu.dto.js'

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const menus = await this.prisma.sysMenu.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    })
    return this.buildTree(menus)
  }

  async findTree() {
    const menus = await this.prisma.sysMenu.findMany({
      where: { isVisible: 1 },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        menuName: true,
        parentId: true,
      },
    })
    return this.buildTree(menus)
  }

  async findOne(id: number) {
    const menu = await this.prisma.sysMenu.findUnique({ where: { id } })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }
    return menu
  }

  async create(dto: CreateMenuDto) {
    return this.prisma.sysMenu.create({
      data: {
        menuName: dto.menuName,
        parentId: dto.parentId ?? 0,
        menuType: dto.menuType,
        routePath: dto.routePath ?? '',
        componentPath: dto.componentPath ?? '',
        permission: dto.permission ?? '',
        icon: dto.icon ?? '',
        sort: dto.sort ?? 0,
        isVisible: dto.isVisible ?? 1,
        isCache: dto.isCache ?? 0,
        isExternal: dto.isExternal ?? 0,
      },
    })
  }

  async update(id: number, dto: UpdateMenuDto) {
    const menu = await this.prisma.sysMenu.findUnique({ where: { id } })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }

    const data: Record<string, unknown> = {}
    if (dto.menuName !== undefined) data['menuName'] = dto.menuName
    if (dto.parentId !== undefined) data['parentId'] = dto.parentId
    if (dto.menuType !== undefined) data['menuType'] = dto.menuType
    if (dto.routePath !== undefined) data['routePath'] = dto.routePath
    if (dto.componentPath !== undefined) data['componentPath'] = dto.componentPath
    if (dto.permission !== undefined) data['permission'] = dto.permission
    if (dto.icon !== undefined) data['icon'] = dto.icon
    if (dto.sort !== undefined) data['sort'] = dto.sort
    if (dto.isVisible !== undefined) data['isVisible'] = dto.isVisible
    if (dto.isCache !== undefined) data['isCache'] = dto.isCache
    if (dto.isExternal !== undefined) data['isExternal'] = dto.isExternal

    return this.prisma.sysMenu.update({
      where: { id },
      data: data as any,
    })
  }

  async remove(id: number) {
    const menu = await this.prisma.sysMenu.findUnique({ where: { id } })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }

    const children = await this.prisma.sysMenu.count({ where: { parentId: id } })
    if (children > 0) {
      throw new BadRequestException('存在子菜单，无法删除')
    }

    await this.prisma.sysRoleMenu.deleteMany({ where: { menuId: id } })
    await this.prisma.sysMenu.delete({ where: { id } })

    return { message: '删除成功' }
  }

  private buildTree(menus: any[]) {
    const list = JSON.parse(JSON.stringify(menus))
    const map: Record<number, any> = {}
    const tree: any[] = []

    for (const menu of list) {
      map[menu.id] = menu
      menu.children = []
    }

    for (const menu of list) {
      if (menu.parentId && menu.parentId !== 0 && map[menu.parentId]) {
        map[menu.parentId].children.push(menu)
      } else if (!menu.parentId || menu.parentId === 0) {
        tree.push(menu)
      }
    }

    return tree
  }
}
