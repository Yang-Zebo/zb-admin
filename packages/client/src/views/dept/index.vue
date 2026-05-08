<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getDeptList,
  getDeptDetail,
  createDept,
  updateDept,
  deleteDept,
} from '../../api/dept'
import type { DeptItem, CreateDeptParams, UpdateDeptParams } from '../../api/dept'

const loading = ref(false)
const deptList = ref<DeptItem[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增部门')
const dialogLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<CreateDeptParams & UpdateDeptParams>({
  deptName: '',
  parentId: 0,
  sort: 0,
  leader: '',
  phone: '',
  status: 1,
})

const rules: FormRules = {
  deptName: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { max: 50, message: '部门名称最长 50 个字符', trigger: 'blur' },
  ],
}

const parentDeptOptions = ref<{ value: number; label: string }[]>([])

function buildParentOptions(depts: DeptItem[], prefix = '') {
  for (const dept of depts) {
    parentDeptOptions.value.push({ value: dept.id, label: prefix + dept.deptName })
    if (dept.children && dept.children.length > 0) {
      buildParentOptions(dept.children, prefix + '├─ ')
    }
  }
}

async function fetchList() {
  loading.value = true
  try {
    const data = await getDeptList()
    deptList.value = data
    parentDeptOptions.value = [{ value: 0, label: '根部门' }]
    buildParentOptions(data)
  } catch {
    ElMessage.error('获取部门列表失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.deptName = ''
  form.parentId = 0
  form.sort = 0
  form.leader = ''
  form.phone = ''
  form.status = 1
  formRef.value?.resetFields()
}

function handleCreate() {
  isEdit.value = false
  editId.value = null
  dialogTitle.value = '新增部门'
  resetForm()
  dialogVisible.value = true
}

async function handleEdit(row: DeptItem) {
  isEdit.value = true
  editId.value = row.id
  dialogTitle.value = '编辑部门'
  dialogLoading.value = true
  dialogVisible.value = true
  try {
    const detail = await getDeptDetail(row.id)
    form.deptName = detail.deptName
    form.parentId = detail.parentId ?? 0
    form.sort = detail.sort
    form.leader = detail.leader ?? ''
    form.phone = detail.phone ?? ''
    form.status = detail.status
  } catch {
    ElMessage.error('获取部门详情失败')
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
      await updateDept(editId.value, {
        deptName: form.deptName,
        parentId: form.parentId,
        sort: form.sort,
        leader: form.leader,
        phone: form.phone,
        status: form.status,
      })
      ElMessage.success('编辑成功')
    } else {
      await createDept(form as CreateDeptParams)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch {
  } finally {
    dialogLoading.value = false
  }
}

async function handleDelete(row: DeptItem) {
  try {
    await ElMessageBox.confirm(`确定要删除部门「${row.deptName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await deleteDept(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
  }
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="dept-page">
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">新增部门</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="deptList"
      row-key="id"
      border
      stripe
      style="width: 100%"
      :tree-props="{ children: 'children' }"
      default-expand-all
    >
      <el-table-column prop="deptName" label="部门名称" min-width="200" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="leader" label="负责人" min-width="120">
        <template #default="{ row }">
          {{ row.leader || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="联系电话" min-width="130">
        <template #default="{ row }">
          {{ row.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">
          {{ row.createTime.replace('T', ' ').slice(0, 19) }}
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
      width="560px"
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
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="form.parentId" placeholder="根部门" style="width: 100%">
            <el-option
              v-for="opt in parentDeptOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.leader" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
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
  </div>
</template>

<style scoped>
.dept-page {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
