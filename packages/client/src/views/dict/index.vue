<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getDictList,
  getDictTypes,
  getDictDetail,
  createDict,
  updateDict,
  deleteDict,
} from '../../api/dict'
import type { DictItem, DictType, QueryDictParams, CreateDictParams, UpdateDictParams } from '../../api/dict'

const loading = ref(false)
const list = ref<DictItem[]>([])
const total = ref(0)
const dictTypes = ref<DictType[]>([])
const selectedDictType = ref('')

const query = reactive<QueryDictParams>({
  page: 1,
  pageSize: 10,
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增字典')
const dialogLoading = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<CreateDictParams & UpdateDictParams>({
  dictName: '',
  dictType: '',
  dictLabel: '',
  dictValue: '',
  sort: 0,
  status: 1,
})

const rules: FormRules = {
  dictName: [
    { required: true, message: '请输入字典名称', trigger: 'blur' },
  ],
  dictType: [
    { required: true, message: '请输入字典类型', trigger: 'blur' },
  ],
  dictLabel: [
    { required: true, message: '请输入字典标签', trigger: 'blur' },
  ],
  dictValue: [
    { required: true, message: '请输入字典值', trigger: 'blur' },
  ],
}

async function fetchDictTypes() {
  try {
    dictTypes.value = await getDictTypes()
  } catch {
  }
}

async function fetchList() {
  loading.value = true
  try {
    query.dictType = selectedDictType.value || undefined
    const res = await getDictList(query)
    list.value = res.list
    total.value = res.total
  } catch {
    ElMessage.error('获取字典列表失败')
  } finally {
    loading.value = false
  }
}

function handleTypeChange(type: string) {
  selectedDictType.value = type
  query.page = 1
  fetchList()
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.dictName = undefined
  query.dictType = undefined
  query.status = undefined
  query.page = 1
  selectedDictType.value = ''
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
  form.dictName = ''
  form.dictType = selectedDictType.value || ''
  form.dictLabel = ''
  form.dictValue = ''
  form.sort = 0
  form.status = 1
  formRef.value?.resetFields()
}

function handleCreate() {
  isEdit.value = false
  editId.value = null
  dialogTitle.value = '新增字典'
  resetForm()
  dialogVisible.value = true
}

async function handleEdit(row: DictItem) {
  isEdit.value = true
  editId.value = row.id
  dialogTitle.value = '编辑字典'
  dialogLoading.value = true
  dialogVisible.value = true
  try {
    const detail = await getDictDetail(row.id)
    form.dictName = detail.dictName
    form.dictType = detail.dictType
    form.dictLabel = detail.dictLabel
    form.dictValue = detail.dictValue
    form.sort = detail.sort
    form.status = detail.status
  } catch {
    ElMessage.error('获取字典详情失败')
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
      await updateDict(editId.value, form as UpdateDictParams)
      ElMessage.success('编辑成功')
    } else {
      await createDict(form as CreateDictParams)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchDictTypes()
    fetchList()
  } catch {
  } finally {
    dialogLoading.value = false
  }
}

async function handleDelete(row: DictItem) {
  try {
    await ElMessageBox.confirm(`确定要删除字典「${row.dictLabel}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await deleteDict(row.id)
    ElMessage.success('删除成功')
    fetchDictTypes()
    fetchList()
  } catch {
  }
}

onMounted(() => {
  fetchDictTypes()
  fetchList()
})
</script>

<template>
  <div class="dict-page">
    <div class="left-panel">
      <div class="panel-title">字典类型</div>
      <el-menu :default-active="selectedDictType" @select="handleTypeChange">
        <el-menu-item index="">
          <span>全部类型</span>
        </el-menu-item>
        <el-menu-item
          v-for="t in dictTypes"
          :key="t.dictType"
          :index="t.dictType"
        >
          <span>{{ t.dictName }} ({{ t.dictType }})</span>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="right-panel">
      <div class="search-bar">
        <el-form :model="query" inline>
          <el-form-item label="字典名称">
            <el-input v-model="query.dictName" placeholder="请输入" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="请选择" clearable style="width: 100px">
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
        <el-button type="primary" @click="handleCreate">新增字典</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="dictName" label="字典名称" min-width="140" />
        <el-table-column prop="dictType" label="字典类型" min-width="140">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.dictType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dictLabel" label="字典标签" min-width="120" />
        <el-table-column prop="dictValue" label="字典值" min-width="120" />
        <el-table-column prop="sort" label="排序" width="80" />
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
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
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
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="form.dictName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model="form.dictType" placeholder="例如 sys_user_status" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="字典标签" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="例如 启用" />
        </el-form-item>
        <el-form-item label="字典值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="例如 1" />
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
  </div>
</template>

<style scoped>
.dict-page {
  display: flex;
  gap: 16px;
  padding: 20px;
  height: calc(100vh - 80px);
}

.left-panel {
  width: 240px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 0;
  flex-shrink: 0;
  overflow-y: auto;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  padding: 0 16px 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
}

.right-panel {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 0 0 16px;
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
}
</style>
