<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getMenuList,
  getMenuDetail,
  createMenu,
  updateMenu,
  deleteMenu,
} from '../../api/menu'
import type { MenuItem, CreateMenuParams, UpdateMenuParams } from '../../api/menu'

const loading = ref(false)
const menuList = ref<MenuItem[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增菜单')
const dialogLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<CreateMenuParams & UpdateMenuParams>({
  menuName: '',
  parentId: 0,
  menuType: 0,
  routePath: '',
  componentPath: '',
  permission: '',
  icon: '',
  sort: 0,
  isVisible: 1,
  isCache: 0,
  isExternal: 0,
})

const rules: FormRules = {
  menuName: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { max: 50, message: '菜单名称最长 50 个字符', trigger: 'blur' },
  ],
  menuType: [
    { required: true, message: '请选择菜单类型', trigger: 'change' },
  ],
}

const menuTypeMap: Record<number, string> = { 0: '目录', 1: '菜单', 2: '按钮' }
const menuTypeTagMap: Record<number, string> = { 0: '', 1: 'success', 2: 'warning' }

const parentMenuOptions = ref<{ value: number; label: string }[]>([])

function buildParentOptions(menus: MenuItem[], prefix = '') {
  for (const menu of menus) {
    parentMenuOptions.value.push({ value: menu.id, label: prefix + menu.menuName })
    if (menu.children && menu.children.length > 0) {
      buildParentOptions(menu.children, prefix + '├─ ')
    }
  }
}

async function fetchList() {
  loading.value = true
  try {
    const data = await getMenuList()
    menuList.value = data
    parentMenuOptions.value = [{ value: 0, label: '根目录' }]
    buildParentOptions(data)
  } catch {
    ElMessage.error('获取菜单列表失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.menuName = ''
  form.parentId = 0
  form.menuType = 0
  form.routePath = ''
  form.componentPath = ''
  form.permission = ''
  form.icon = ''
  form.sort = 0
  form.isVisible = 1
  form.isCache = 0
  form.isExternal = 0
  formRef.value?.resetFields()
}

function handleCreate() {
  isEdit.value = false
  editId.value = null
  dialogTitle.value = '新增菜单'
  resetForm()
  dialogVisible.value = true
}

async function handleEdit(row: MenuItem) {
  isEdit.value = true
  editId.value = row.id
  dialogTitle.value = '编辑菜单'
  dialogLoading.value = true
  dialogVisible.value = true
  try {
    const detail = await getMenuDetail(row.id)
    form.menuName = detail.menuName
    form.parentId = detail.parentId ?? 0
    form.menuType = detail.menuType
    form.routePath = detail.routePath ?? ''
    form.componentPath = detail.componentPath ?? ''
    form.permission = detail.permission ?? ''
    form.icon = detail.icon ?? ''
    form.sort = detail.sort
    form.isVisible = detail.isVisible
    form.isCache = detail.isCache
    form.isExternal = detail.isExternal
  } catch {
    ElMessage.error('获取菜单详情失败')
    dialogVisible.value = false
  } finally {
    dialogLoading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  dialogLoading.value = true
  try {
    if (isEdit.value && editId.value !== null) {
      await updateMenu(editId.value, {
        menuName: form.menuName,
        parentId: form.parentId,
        menuType: form.menuType,
        routePath: form.routePath,
        componentPath: form.componentPath,
        permission: form.permission,
        icon: form.icon,
        sort: form.sort,
        isVisible: form.isVisible,
        isCache: form.isCache,
        isExternal: form.isExternal,
      })
      ElMessage.success('编辑成功')
    } else {
      await createMenu(form as CreateMenuParams)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch {
    // error handled by interceptor
  } finally {
    dialogLoading.value = false
  }
}

async function handleDelete(row: MenuItem) {
  try {
    await ElMessageBox.confirm(`确定要删除菜单「${row.menuName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await deleteMenu(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // cancelled
  }
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="menu-page">
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">新增菜单</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="menuList"
      row-key="id"
      border
      stripe
      style="width: 100%"
      :tree-props="{ children: 'children' }"
    >
      <el-table-column prop="menuName" label="菜单名称" min-width="200" />
      <el-table-column prop="icon" label="图标" width="80">
        <template #default="{ row }">
          <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="menuType" label="菜单类型" width="90">
        <template #default="{ row }">
          <el-tag :type="menuTypeTagMap[row.menuType]" size="small">
            {{ menuTypeMap[row.menuType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="permission" label="权限标识" min-width="160">
        <template #default="{ row }">
          <el-tag v-if="row.permission" size="small" type="info">{{ row.permission }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="routePath" label="路由路径" min-width="140">
        <template #default="{ row }">
          {{ row.routePath || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="componentPath" label="组件路径" min-width="160">
        <template #default="{ row }">
          {{ row.componentPath || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="70" />
      <el-table-column prop="isVisible" label="可见" width="70">
        <template #default="{ row }">
          <el-tag :type="row.isVisible === 1 ? 'success' : 'info'" size="small">
            {{ row.isVisible === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isCache" label="缓存" width="70">
        <template #default="{ row }">
          <el-tag :type="row.isCache === 1 ? 'success' : 'info'" size="small">
            {{ row.isCache === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="dialogLoading"
      >
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio :value="0">目录</el-radio>
            <el-radio :value="1">菜单</el-radio>
            <el-radio :value="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="上级菜单">
          <el-select v-model="form.parentId" placeholder="根目录" style="width: 100%">
            <el-option
              v-for="opt in parentMenuOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.menuType !== 2" label="路由路径">
          <el-input v-model="form.routePath" placeholder="例如 /system/user" />
        </el-form-item>
        <el-form-item v-if="form.menuType === 1" label="组件路径">
          <el-input v-model="form.componentPath" placeholder="例如 system/user/index" />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.permission" placeholder="例如 sys:user:list" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="Element Plus 图标名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="是否可见">
          <el-radio-group v-model="form.isVisible">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否缓存">
          <el-radio-group v-model="form.isCache">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否外链">
          <el-radio-group v-model="form.isExternal">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.menu-page {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
