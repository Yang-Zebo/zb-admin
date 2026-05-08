<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  assignRoleMenus,
} from '../../api/role'
import { getMenuTree } from '../../api/menu'
import type { RoleItem, QueryRoleParams, CreateRoleParams, UpdateRoleParams } from '../../api/role'
import type { MenuItem } from '../../api/menu'

const loading = ref(false)
const list = ref<RoleItem[]>([])
const total = ref(0)

const query = reactive<QueryRoleParams>({
  page: 1,
  pageSize: 10,
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const dialogLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<CreateRoleParams & UpdateRoleParams>({
  roleName: '',
  roleKey: '',
  sort: 0,
  status: 1,
})

const rules: FormRules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 50, message: '角色名称最长 50 个字符', trigger: 'blur' },
  ],
  roleKey: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { max: 50, message: '角色标识最长 50 个字符', trigger: 'blur' },
  ],
}

const statusMap: Record<number, string> = { 1: '启用', 0: '停用' }

async function fetchList() {
  loading.value = true
  try {
    const res = await getRoleList(query)
    list.value = res.list
    total.value = res.total
  } catch {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.roleName = undefined
  query.roleKey = undefined
  query.status = undefined
  query.page = 1
  fetchList()
}

function handlePageChange(page: number) {
  query.page = page
  fetchList()
}

function handleSizeChange(size: number) {
  query.pageSize = size
  query.page = 1
  fetchList()
}

function resetForm() {
  form.roleName = ''
  form.roleKey = ''
  form.sort = 0
  form.status = 1
  formRef.value?.resetFields()
}

function handleCreate() {
  isEdit.value = false
  editId.value = null
  dialogTitle.value = '新增角色'
  resetForm()
  dialogVisible.value = true
}

async function handleEdit(row: RoleItem) {
  isEdit.value = true
  editId.value = row.id
  dialogTitle.value = '编辑角色'
  resetForm()
  dialogLoading.value = true
  dialogVisible.value = true
  try {
    form.roleName = row.roleName
    form.roleKey = row.roleKey
    form.sort = row.sort
    form.status = row.status
  } catch {
    ElMessage.error('获取角色详情失败')
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
      await updateRole(editId.value, {
        roleName: form.roleName,
        roleKey: form.roleKey,
        sort: form.sort,
        status: form.status,
      })
      ElMessage.success('编辑成功')
    } else {
      await createRole(form as CreateRoleParams)
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

async function handleDelete(row: RoleItem) {
  try {
    await ElMessageBox.confirm(`确定要删除角色「${row.roleName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // cancelled
  }
}

const assignDialogVisible = ref(false)
const assignRoleId = ref<number | null>(null)
const assignRoleName = ref('')
const assignLoading = ref(false)
const menuTree = ref<MenuItem[]>([])
const checkedMenuIds = ref<number[]>([])

async function handleAssign(row: RoleItem) {
  assignRoleId.value = row.id
  assignRoleName.value = row.roleName
  assignLoading.value = true
  assignDialogVisible.value = true
  try {
    const [tree, detail] = await Promise.all([
      getMenuTree(),
      getRoleDetail(row.id),
    ])
    menuTree.value = tree
    checkedMenuIds.value = detail.menuIds
  } catch {
    ElMessage.error('获取菜单数据失败')
    assignDialogVisible.value = false
  } finally {
    assignLoading.value = false
  }
}

function handleNodeCheck(_node: any, checked: { checkedKeys: number[]; halfCheckedKeys: number[] }) {
  checkedMenuIds.value = [...checked.checkedKeys, ...checked.halfCheckedKeys]
}

async function handleAssignSubmit() {
  if (assignRoleId.value === null) return
  assignLoading.value = true
  try {
    await assignRoleMenus(assignRoleId.value, checkedMenuIds.value)
    ElMessage.success('菜单权限分配成功')
    assignDialogVisible.value = false
    fetchList()
  } catch {
    // error handled by interceptor
  } finally {
    assignLoading.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="role-page">
    <div class="search-bar">
      <el-form :model="query" inline>
        <el-form-item label="角色名称">
          <el-input v-model="query.roleName" placeholder="请输入角色名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="角色标识">
          <el-input v-model="query.roleKey" placeholder="请输入角色标识" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">新增角色</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="roleName" label="角色名称" min-width="120" />
      <el-table-column prop="roleKey" label="角色标识" min-width="140" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="userCount" label="关联用户" width="90">
        <template #default="{ row }">
          <el-tag size="small">{{ row.userCount }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ statusMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">
          {{ row.createTime.replace('T', ' ').slice(0, 19) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="warning" link @click="handleAssign(row)">分配权限</el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        v-loading="dialogLoading"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色标识" prop="roleKey">
          <el-input v-model="form.roleKey" placeholder="请输入角色标识" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="assignDialogVisible"
      :title="`分配菜单权限 — ${assignRoleName}`"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-loading="assignLoading">
        <el-tree
          :data="menuTree"
          show-checkbox
          node-key="id"
          :props="{ label: 'menuName', children: 'children' }"
          :default-expand-all="true"
          :default-checked-keys="checkedMenuIds"
          @check="handleNodeCheck"
        />
      </div>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="assignLoading" @click="handleAssignSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.role-page {
  padding: 20px;
}

.search-bar {
  background: #fff;
  padding: 20px 20px 0;
  border-radius: 8px;
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
}
</style>
