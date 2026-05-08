<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  deleteUsers,
  resetUserPassword,
  toggleUserStatus,
} from '../../api/user'
import type { UserItem, QueryUserParams, CreateUserParams, UpdateUserParams } from '../../api/user'
import { getDeptTree } from '../../api/dept'
import type { DeptTreeItem } from '../../api/dept'

const loading = ref(false)
const deptTree = ref<DeptTreeItem[]>([])
const list = ref<UserItem[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])

const query = reactive<QueryUserParams>({
  page: 1,
  pageSize: 10,
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const dialogLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<CreateUserParams & UpdateUserParams>({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  gender: undefined,
  deptId: undefined,
  roleIds: [],
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' },
  ],
}

const passwordRules: FormRules = {
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
}

const statusMap: Record<number, string> = { 1: '启用', 0: '停用' }
const genderMap: Record<number, string> = { 1: '男', 0: '女' }

async function fetchList() {
  loading.value = true
  try {
    const res = await getUserList(query)
    list.value = res.list
    total.value = res.total
  } catch {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.username = undefined
  query.phone = undefined
  query.status = undefined
  query.deptId = undefined
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

async function fetchDeptTree() {
  try {
    deptTree.value = await getDeptTree()
  } catch {
    // silently fail
  }
}

function resetForm() {
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.email = ''
  form.phone = ''
  form.gender = undefined
  form.deptId = undefined
  form.roleIds = []
  formRef.value?.resetFields()
}

function handleCreate() {
  isEdit.value = false
  editId.value = null
  dialogTitle.value = '新增用户'
  resetForm()
  dialogVisible.value = true
}

async function handleEdit(row: UserItem) {
  isEdit.value = true
  editId.value = row.id
  dialogTitle.value = '编辑用户'
  dialogLoading.value = true
  dialogVisible.value = true
  try {
    const detail = await getUserDetail(row.id)
    form.nickname = detail.nickname ?? ''
    form.email = detail.email ?? ''
    form.phone = detail.phone ?? ''
    form.gender = detail.gender ?? undefined
    form.deptId = detail.deptId ?? undefined
    form.roleIds = detail.roleIds ?? []
  } catch {
    ElMessage.error('获取用户详情失败')
    dialogVisible.value = false
  } finally {
    dialogLoading.value = false
  }
}

async function handleSubmit() {
  if (isEdit.value) {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
  } else {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    if (!form.password) {
      ElMessage.warning('请输入密码')
      return
    }
  }

  dialogLoading.value = true
  try {
    if (isEdit.value && editId.value !== null) {
      await updateUser(editId.value, {
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        gender: form.gender,
        deptId: form.deptId,
        roleIds: form.roleIds,
      })
      ElMessage.success('编辑成功')
    } else {
      await createUser(form as CreateUserParams)
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

async function handleDelete(row: UserItem) {
  try {
    await ElMessageBox.confirm(`确定要删除用户「${row.nickname || row.username}」吗？该操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // cancelled
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的用户')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个用户吗？该操作不可恢复。`, '批量删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await deleteUsers(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchList()
  } catch {
    // cancelled
  }
}

async function handleResetPassword(row: UserItem) {
  try {
    await ElMessageBox.confirm(`确定要重置用户「${row.nickname || row.username}」的密码为 123456 吗？`, '重置密码确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await resetUserPassword(row.id)
    ElMessage.success('密码重置成功')
  } catch {
    // cancelled
  }
}

async function handleToggleStatus(row: UserItem) {
  const action = row.status === 1 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}用户「${row.nickname || row.username}」吗？`, `${action}确认`, {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    const res = await toggleUserStatus(row.id)
    ElMessage.success(res.message)
    fetchList()
  } catch {
    // cancelled
  }
}

function handleSelectionChange(selection: UserItem[]) {
  selectedIds.value = selection.map((item) => item.id)
}

onMounted(() => {
  fetchList()
  fetchDeptTree()
})
</script>

<template>
  <div class="user-page">
    <div class="search-bar">
      <el-form :model="query" inline>
        <el-form-item label="用户名">
          <el-input v-model="query.username" placeholder="请输入用户名" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="query.phone" placeholder="请输入手机号" clearable @keyup.enter="handleSearch" />
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
      <el-button type="primary" @click="handleCreate">新增用户</el-button>
      <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
        批量删除
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      border
      stripe
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="nickname" label="昵称" min-width="120">
        <template #default="{ row }">
          {{ row.nickname || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" min-width="130">
        <template #default="{ row }">
          {{ row.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="160">
        <template #default="{ row }">
          {{ row.email || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="gender" label="性别" width="70">
        <template #default="{ row }">
          {{ genderMap[row.gender ?? -1] || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="deptName" label="部门" min-width="120">
        <template #default="{ row }">
          {{ row.deptName || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="roles" label="角色" min-width="140">
        <template #default="{ row }">
          <el-tag v-for="role in row.roles" :key="role.id" size="small" style="margin-right: 4px">
            {{ role.roleName }}
          </el-tag>
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
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="warning" link @click="handleResetPassword(row)">重置密码</el-button>
          <el-button
            size="small"
            :type="row.status === 1 ? 'danger' : 'success'"
            link
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
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
      width="560px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="isEdit ? rules : { ...rules, ...passwordRules }"
        label-width="80px"
        v-loading="dialogLoading"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（默认 123456）"
            show-password
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.gender" placeholder="请选择" style="width: 100%">
            <el-option label="未知" :value="0" />
            <el-option label="男" :value="1" />
            <el-option label="女" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-tree-select
            v-model="form.deptId"
            :data="deptTree"
            :render-after-expand="false"
            check-strictly
            node-key="id"
            :props="{ label: 'deptName', children: 'children' }"
            placeholder="请选择部门"
            clearable
            style="width: 100%"
          />
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
.user-page {
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
