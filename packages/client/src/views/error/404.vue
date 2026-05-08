<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="error-page">
    <h1>404</h1>
    <p>页面不存在</p>
    <el-button type="primary" @click="router.push('/')">返回首页</el-button>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.error-page h1 {
  font-size: 80px;
  color: #dcdfe6;
  margin: 0;
}
.error-page p {
  font-size: 20px;
  color: #909399;
  margin: 16px 0 32px;
}
</style>
