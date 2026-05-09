<!-- ===== 403 无权限页面 =====
 当用户访问没有权限的路由时显示（路由守卫中判断 meta.permission）
-->
<script setup lang="ts">
</script>

<template>
  <div class="forbidden-page">
    <div class="forbidden-content">
      <h1>403</h1>
      <p>抱歉，您没有权限访问此页面</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<style scoped>
.forbidden-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f2f5;
}

.forbidden-content {
  text-align: center;
}

.forbidden-content h1 {
  font-size: 96px;
  color: #e6a23c;
  margin: 0 0 16px;
  font-weight: bold;
}

.forbidden-content p {
  font-size: 18px;
  color: #606266;
  margin-bottom: 24px;
}
</style>
