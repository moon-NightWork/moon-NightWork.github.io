<template>
  <el-dialog
    v-model="dialogVisible"
    title="AI设置"
    width="500px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="API提供商">
        <el-select v-model="form.provider" @change="handleProviderChange">
          <el-option label="OpenAI" value="openai" />
          <el-option label="智谱AI" value="zhipu" />
          <el-option label="文心一言" value="wenxin" />
          <el-option label="通义千问" value="tongyi" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>

      <el-form-item label="API Key">
        <el-input
          v-model="form.apiKey"
          type="password"
          show-password
          placeholder="请输入API Key"
        />
      </el-form-item>

      <el-form-item label="Base URL">
        <el-input
          v-model="form.baseUrl"
          placeholder="请输入API地址"
        />
      </el-form-item>

      <el-form-item label="模型">
        <el-input
          v-model="form.model"
          placeholder="请输入模型名称"
        />
      </el-form-item>

      <el-form-item label="温度">
        <el-slider
          v-model="form.temperature"
          :min="0"
          :max="1"
          :step="0.1"
          show-input
        />
      </el-form-item>

      <el-form-item label="系统提示">
        <el-input
          v-model="form.systemPrompt"
          type="textarea"
          :rows="4"
          placeholder="设置AI的角色定位"
        />
      </el-form-item>
    </el-form>

    <div class="config-tips">
      <el-divider content-position="left">配置说明</el-divider>
      
      <div class="security-warning">
        <el-alert
          title="安全提示"
          type="warning"
          :closable="false"
          show-icon
        >
          <div class="alert-content">
            <p>⚠️ API Key 会保存在浏览器本地存储中</p>
            <p>• 请在安全的网络环境下使用</p>
            <p>• 不要分享你的 API Key</p>
            <p>• 建议使用 API Key 的最小权限</p>
            <p>• 不用时可以清除 API Key</p>
          </div>
        </el-alert>
      </div>

      <div v-if="form.provider === 'zhipu'" class="tips-content">
        <p><strong>智谱AI配置指南：</strong></p>
        <ul>
          <li>📌 API Key：在 <a href="https://open.bigmodel.cn/usercenter/apikeys" target="_blank">https://open.bigmodel.cn</a> 获取</li>
          <li>API Key格式：<code>sk.xxxxx.xxxxx</code>（需要包含两段，用点分隔）</li>
          <li>Base URL：<code>https://open.bigmodel.cn/api/paas/v4</code></li>
          <li>常用模型：</li>
          <ul>
            <li><code>glm-3-turbo</code> - 经济高效，推荐</li>
            <li><code>glm-4</code> - 标准能力</li>
            <li><code>glm-4-plus</code> - 高级能力</li>
          </ul>
          <li><strong>配置后请点击"测试连接"按钮验证</strong></li>
        </ul>
      </div>
      <div v-else-if="form.provider === 'openai'" class="tips-content">
        <p><strong>OpenAI配置指南：</strong></p>
        <ul>
          <li>API Key：在 <a href="https://platform.openai.com/api-keys" target="_blank">https://platform.openai.com</a> 获取</li>
          <li>Base URL：<code>https://api.openai.com/v1</code></li>
          <li>常用模型：</li>
          <ul>
            <li><code>gpt-3.5-turbo</code></li>
            <li><code>gpt-4</code></li>
            <li><code>gpt-4-turbo</code></li>
          </ul>
        </ul>
      </div>
      <div v-else-if="form.provider === 'tongyi'" class="tips-content">
        <p><strong>通义千问配置指南：</strong></p>
        <ul>
          <li>API Key：在 <a href="https://dashscope.console.aliyun.com/apiKey" target="_blank">https://dashscope.console.aliyun.com</a> 获取</li>
          <li>Base URL：<code>https://dashscope.aliyuncs.com/compatible-mode/v1</code></li>
          <li>常用模型：</li>
          <ul>
            <li><code>qwen-turbo</code></li>
            <li><code>qwen-plus</code></li>
            <li><code>qwen-max</code></li>
          </ul>
        </ul>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClearApiKey" type="danger" v-if="form.apiKey">清除API Key</el-button>
      <el-button @click="handleClose">取消</el-button>
      <el-button @click="handleTestConnection">测试连接</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import type { AISettings } from '@/types'

const props = defineProps<{
  modelValue: boolean
  settings?: AISettings | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [settings: AISettings]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultSettings: AISettings = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  systemPrompt: '你是一个专业的饮食健康助手',
  temperature: 0.7
}

const form = ref<AISettings>({ ...defaultSettings })

watch(() => props.settings, (val) => {
  if (val) {
    form.value = { ...val }
  }
}, { immediate: true })

function handleProviderChange(provider: string) {
  switch (provider) {
    case 'openai':
      form.value.baseUrl = 'https://api.openai.com/v1'
      form.value.model = 'gpt-3.5-turbo'
      break
    case 'zhipu':
      form.value.baseUrl = 'https://open.bigmodel.cn/api/paas/v4'
      form.value.model = 'glm-3-turbo'
      break
    case 'wenxin':
      form.value.baseUrl = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1'
      form.value.model = 'ERNIE-Bot'
      break
    case 'tongyi':
      form.value.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      form.value.model = 'qwen-turbo'
      break
  }
}

function handleSave() {
  emit('save', { ...form.value })
  dialogVisible.value = false
}

async function handleTestConnection() {
  if (!form.value.apiKey) {
    ElMessage.warning('请先填写API Key')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在测试连接...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const response = await fetch(`${form.value.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${form.value.apiKey}`
      },
      body: JSON.stringify({
        model: form.value.model,
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
        max_tokens: 10
      })
    })

    if (!response.ok) {
      let errorText = ''
      try {
        const errorData = await response.json()
        errorText = JSON.stringify(errorData)
      } catch {
        errorText = await response.text()
      }
      throw new Error(`状态码 ${response.status}: ${errorText}`)
    }

    await response.json()
    ElMessage.success('连接成功！配置正确')
  } catch (err) {
    ElMessage.error(`连接失败: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.close()
  }
}

async function handleClearApiKey() {
  try {
    await ElMessageBox.confirm(
      '确定要清除API Key吗？清除后需要重新配置才能使用AI功能。',
      '清除API Key',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    form.value.apiKey = ''
    ElMessage.success('API Key已清除')
  } catch {
    // 用户取消
  }
}

function handleClose() {
  dialogVisible.value = false
}
</script>

<style scoped lang="scss">
.config-tips {
  background: var(--el-fill-color-lighter);
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;

  .security-warning {
    margin-bottom: 16px;

    .alert-content {
      p {
        margin: 4px 0;
        font-size: 13px;
        line-height: 1.6;
      }
    }
  }

  .tips-content {
    p {
      margin: 0 0 8px 0;
      font-weight: 600;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        line-height: 1.8;
        color: var(--el-text-color-regular);
      }
    }

    code {
      background: var(--el-fill-color);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
      color: var(--el-color-primary);
    }

    a {
      color: var(--el-color-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
