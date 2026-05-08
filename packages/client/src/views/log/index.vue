<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getLogList } from '../../api/log'
import type { LogItem, QueryLogParams } from '../../api/log'

const loading = ref(false)
const list = ref<LogItem[]>([])
const total = ref(0)

const query = reactive<QueryLogParams>({
  page: 1,
  pageSize: 10,
})

const dateRange = ref<[string, string] | null>(null)

const actionTypeMap: Record<string, string> = {
  POST: '新增',
  PUT: '修改',
  DELETE: '删除',
  GET: '查询',
}

const actionTypeTagMap: Record<string, string> = {
  POST: 'success',
  PUT: 'primary',
  DELETE: 'danger',
  GET: 'info',
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getLogList(query)
    list.value = res.list
    total.value = res.total
  } catch {
    ElMessage.error('获取日志列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.userId = undefined
  query.actionType = undefined
  query.module = undefined
  query.startTime = undefined
  query.endTime = undefined
  dateRange.value = null
  query.page = 1
  fetchList()
}

function handleDateChange(val: [string, string] | null) {
  if (val && val.length === 2) {
    query.startTime = val[0]
    query.endTime = val[1]
  } else {
    query.startTime = undefined
    query.endTime = undefined
  }
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

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="log-page">
    <div class="search-bar">
      <el-form :model="query" inline>
        <el-form-item label="操作类型">
          <el-select v-model="query.actionType" placeholder="请选择" clearable style="width: 120px">
            <el-option label="新增" value="POST" />
            <el-option label="修改" value="PUT" />
            <el-option label="删除" value="DELETE" />
            <el-option label="查询" value="GET" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作模块">
          <el-input v-model="query.module" placeholder="请输入操作模块" clearable />
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      border
      stripe
      style="width: 100%"
    >
      <el-table-column prop="actionType" label="操作类型" width="100">
        <template #default="{ row }">
          <el-tag :type="actionTypeTagMap[row.actionType] || 'info'" size="small">
            {{ actionTypeMap[row.actionType] || row.actionType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="操作模块" width="120" />
      <el-table-column prop="description" label="操作描述" min-width="160">
        <template #default="{ row }">
          {{ row.description || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP 地址" width="140">
        <template #default="{ row }">
          {{ row.ip || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="耗时(ms)" width="100">
        <template #default="{ row }">
          <el-tag :type="row.duration > 1000 ? 'danger' : 'success'" size="small">
            {{ row.duration }}ms
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="requestParams" label="请求参数" min-width="160">
        <template #default="{ row }">
          <el-tooltip v-if="row.requestParams" :content="row.requestParams" placement="top">
            <el-tag size="small" type="info">查看</el-tag>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="responseResult" label="返回结果" min-width="160">
        <template #default="{ row }">
          <el-tooltip v-if="row.responseResult" :content="row.responseResult" placement="top">
            <el-tag size="small" type="info">查看</el-tag>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdTime" label="操作时间" width="170">
        <template #default="{ row }">
          {{ row.createdTime.replace('T', ' ').slice(0, 19) }}
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
</template>

<style scoped>
.log-page {
  padding: 20px;
}

.search-bar {
  background: #fff;
  padding: 20px 20px 0;
  border-radius: 8px;
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
