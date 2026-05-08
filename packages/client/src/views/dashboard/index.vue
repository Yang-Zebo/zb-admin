<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const userInfo = computed(() => authStore.userInfo)
const permissions = computed(() => authStore.permissions)
</script>

<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>欢迎使用</template>
          <div class="stat-value">{{ userInfo?.nickname || userInfo?.username }}</div>
          <div class="stat-label">当前用户</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>权限数量</template>
          <div class="stat-value">{{ permissions.length }}</div>
          <div class="stat-label">已授权按钮权限</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>系统信息</template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ userInfo?.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ userInfo?.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo?.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ userInfo?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-for="role in userInfo?.roles" :key="role.id" size="small" style="margin-right: 4px">
            {{ role.roleName }}
          </el-tag>
          <span v-if="!userInfo?.roles || userInfo?.roles.length === 0">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="部门">{{ userInfo?.deptName || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1890ff;
}

.stat-label {
  color: #999;
  margin-top: 4px;
}
</style>
