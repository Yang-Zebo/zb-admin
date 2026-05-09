<!-- ===== 根组件 =====
 Vue 单文件组件（SFC）的最简形式：
 <script setup> — 组合式 API 的语法糖，无需显式 return
 <template> — 模板区域，<router-view /> 是 Vue Router 的占位组件
           它会根据当前 URL 动态渲染匹配的页面组件（如登录页、主页等）
-->
<script setup lang="ts">
</script>

<template>
  <router-view />
</template>
