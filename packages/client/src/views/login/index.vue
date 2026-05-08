<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const captchaSvg = ref('')
const captchaId = ref('')

const form = ref({
  username: 'admin',
  password: 'admin123',
  captcha: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

async function refreshCaptcha() {
  try {
    const result = await authStore.fetchCaptcha()
    captchaSvg.value = result.captchaSvg
    captchaId.value = result.captchaId
  } catch {
    ElMessage.error('获取验证码失败')
  }
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authStore.login({
      username: form.value.username,
      password: form.value.password,
      captcha: form.value.captcha,
      captchaId: captchaId.value,
    })
    ElMessage.success('登录成功')
    router.push('/')
  } catch (err: any) {
    refreshCaptcha()
    form.value.captcha = ''
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
})
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">通用后台管理系统</h2>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="'User'"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="form.captcha"
              placeholder="验证码"
              style="flex: 1"
            />
            <div
              class="captcha-svg"
              v-html="captchaSvg"
              @click="refreshCaptcha"
              title="点击刷新验证码"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  margin-bottom: 32px;
  font-size: 24px;
  color: #303133;
  letter-spacing: 2px;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-svg {
  cursor: pointer;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
}

.captcha-svg :deep(svg) {
  height: 40px;
  border-radius: 6px;
}
</style>
