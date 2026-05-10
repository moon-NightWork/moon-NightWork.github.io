import { ref, onMounted } from 'vue'
import { useAIStore } from '@/stores/useAIStore'
import { useIngredientStore } from '@/stores/useIngredientStore'
import { useRecipeStore } from '@/stores/useRecipeStore'
import { useUserStore } from '@/stores/useUserStore'
import { generateId } from '@/utils/helpers'
import {
  generateUserDataContext,
  generateSystemPrompt,
  generateIngredientFormPrompt,
  generateRecipeFormPrompt,
  generateInfoQueryPrompt,
  generateMemberInfoPrompt
} from '@/utils/ai-prompt'
import type { AIChatMessage } from '@/types'
import type { FamilyMember } from '@/types'

export function useAIChat() {
  const aiStore = useAIStore()
  const ingredientStore = useIngredientStore()
  const recipeStore = useRecipeStore()
  const userStore = useUserStore()
  const isLoading = ref(false)
  
  // 确保数据已加载
  onMounted(async () => {
    await Promise.all([
      ingredientStore.fetchAll(),
      recipeStore.fetchAll(),
      userStore.fetchMembers()
    ])
  })
  const error = ref<string | null>(null)

  // 流式更新的回调
  let onStreamUpdate: (() => void) | null = null
  let onStreamComplete: (() => void) | null = null

  // 设置回调
  function setStreamCallbacks(update: () => void, complete: () => void) {
    onStreamUpdate = update
    onStreamComplete = complete
  }

  /**
   * 读取文件内容
   */
  async function loadFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          let content = e.target?.result as string
          
          // 如果是JSON文件，尝试解析后格式化
          if (file.name.endsWith('.json')) {
            try {
              const jsonData = JSON.parse(content)
              content = JSON.stringify(jsonData, null, 2)
            } catch {
              // 如果解析失败，保持原始文本
            }
          }
          
          resolve(content)
        } catch (err) {
          reject(new Error('文件读取失败'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsText(file)
    })
  }

  /**
   * 获取带有用户数据的系统提示词
   */
  function getEnhancedSystemPrompt(): string {
    const userDataContext = generateUserDataContext(
      ingredientStore.ingredients,
      recipeStore.recipes,
      userStore.members
    )
    return generateSystemPrompt(userDataContext)
  }

  async function sendMessage(content: string) {
    if (!aiStore.settings?.apiKey) {
      throw new Error('请先配置API Key')
    }

    isLoading.value = true
    error.value = null

    try {
      // 创建助手消息占位符
      const assistantMsg: AIChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      }

      if (aiStore.currentSession) {
        aiStore.currentSession.messages.push(assistantMsg)
        aiStore.streamingMessageId = assistantMsg.id
      }

      // 调用API
      await streamChat(content, assistantMsg.id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '发送消息失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * AI自动填写食材表单
   */
  async function fillIngredientForm(ingredientName: string): Promise<{
    effect: string
    processingMethod: string
  }> {
    if (!aiStore.settings?.apiKey) {
      throw new Error('请先配置API Key')
    }

    isLoading.value = true
    error.value = null

    try {
      const prompt = generateIngredientFormPrompt(ingredientName)
      const response = await callAI(prompt)
      
      console.log('AI原始响应:', response) // 添加调试日志
      
      // 解析JSON响应 - 增强容错性
      let jsonStr = response.trim()
      
      // 移除可能的markdown代码块标记（支持多种格式）
      jsonStr = jsonStr.replace(/^```[\s\S]*?\n/g, '') // 移除开头的 ```json 或 ```
      jsonStr = jsonStr.replace(/```$/g, '') // 移除结尾的 ```
      
      // 尝试提取JSON部分
      let jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        // 尝试其他匹配方式
        const firstBrace = jsonStr.indexOf('{')
        const lastBrace = jsonStr.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonMatch = [jsonStr.slice(firstBrace, lastBrace + 1)]
        }
      }
      
      if (!jsonMatch) {
        console.error('无法提取JSON，原始响应:', response)
        throw new Error('AI返回格式错误，请重试')
      }
      
      const jsonToParse = jsonMatch[0].trim()
      console.log('尝试解析的JSON:', jsonToParse)
      
      // 尝试解析JSON
      try {
        const result = JSON.parse(jsonToParse)
        console.log('解析成功的结果:', result)
        
        // 确保返回的数据包含必需的字段
        if (!result.effect || !result.processingMethod) {
          console.error('返回数据缺少必需字段:', result)
          throw new Error('AI返回的数据不完整')
        }
        return result
      } catch (parseErr) {
        console.error('JSON解析失败:', parseErr, '尝试解析的内容:', jsonToParse)
        
        // 降级方案：尝试清理常见格式问题
        let cleanedJson = jsonToParse
          .replace(/,\s*}/g, '}') // 移除末尾多余逗号
          .replace(/,\s*]/g, ']') // 移除数组末尾多余逗号
          .replace(/(['"])?(\w+)(['"])?\s*:/g, '"$2":') // 确保键都有引号
        
        try {
          const result = JSON.parse(cleanedJson)
          console.log('降级解析成功的结果:', result)
          if (!result.effect || !result.processingMethod) {
            throw new Error('AI返回的数据不完整')
          }
          return result
        } catch {
          throw new Error('AI返回格式错误，请重试')
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取食材信息失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * AI自动填写菜谱表单
   */
  async function fillRecipeForm(recipeName: string): Promise<{
    taste: string
    difficulty: 'easy' | 'medium' | 'hard'
    cookingTime: number
    servings: number
    steps: string
    ingredientNames: string[]
  }> {
    if (!aiStore.settings?.apiKey) {
      throw new Error('请先配置API Key')
    }

    isLoading.value = true
    error.value = null

    try {
      const prompt = generateRecipeFormPrompt(recipeName)
      const response = await callAI(prompt)
      
      console.log('AI原始响应(菜谱):', response) // 添加调试日志
      
      // 解析JSON响应 - 增强容错性
      let jsonStr = response.trim()
      
      // 移除可能的markdown代码块标记（支持多种格式）
      jsonStr = jsonStr.replace(/^```[\s\S]*?\n/g, '') // 移除开头的 ```json 或 ```
      jsonStr = jsonStr.replace(/```$/g, '') // 移除结尾的 ```
      
      // 尝试提取JSON部分
      let jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        // 尝试其他匹配方式
        const firstBrace = jsonStr.indexOf('{')
        const lastBrace = jsonStr.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonMatch = [jsonStr.slice(firstBrace, lastBrace + 1)]
        }
      }
      
      if (!jsonMatch) {
        console.error('无法提取JSON(菜谱)，原始响应:', response)
        throw new Error('AI返回格式错误，请重试')
      }
      
      const jsonToParse = jsonMatch[0].trim()
      console.log('尝试解析的JSON(菜谱):', jsonToParse)
      
      // 尝试解析JSON
      try {
        const result = JSON.parse(jsonToParse)
        console.log('解析成功的结果(菜谱):', result)
        
        // 确保返回的数据包含必需的字段
        if (!result.taste || !result.difficulty || !result.cookingTime || 
            !result.servings || !result.steps || !result.ingredientNames) {
          console.error('返回数据缺少必需字段(菜谱):', result)
          throw new Error('AI返回的数据不完整')
        }
        return result
      } catch (parseErr) {
        console.error('JSON解析失败(菜谱):', parseErr, '尝试解析的内容:', jsonToParse)
        
        // 降级方案：尝试清理常见格式问题
        let cleanedJson = jsonToParse
          .replace(/,\s*}/g, '}') // 移除末尾多余逗号
          .replace(/,\s*]/g, ']') // 移除数组末尾多余逗号
          .replace(/(['"])?(\w+)(['"])?\s*:/g, '"$2":') // 确保键都有引号
        
        try {
          const result = JSON.parse(cleanedJson)
          console.log('降级解析成功的结果(菜谱):', result)
          if (!result.taste || !result.difficulty || !result.cookingTime || 
              !result.servings || !result.steps || !result.ingredientNames) {
            throw new Error('AI返回的数据不完整')
          }
          return result
        } catch {
          throw new Error('AI返回格式错误，请重试')
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取菜谱信息失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * AI查询食材/菜谱权威信息（流式输出）
   */
  async function streamQueryInfo(
    name: string, 
    type: 'ingredient' | 'recipe',
    onChunk: (chunk: string) => Promise<void> | void
  ): Promise<void> {
    if (!aiStore.settings?.apiKey) {
      throw new Error('请先配置API Key')
    }

    isLoading.value = true
    error.value = null

    try {
      const prompt = generateInfoQueryPrompt(name, type)
      await streamCallAI(prompt, onChunk)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '查询信息失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * AI查询家庭成员的个性化饮食建议（流式输出）
   */
  async function streamQueryMemberInfo(
    member: FamilyMember,
    onChunk: (chunk: string) => Promise<void> | void
  ): Promise<void> {
    if (!aiStore.settings?.apiKey) {
      throw new Error('请先配置API Key')
    }

    isLoading.value = true
    error.value = null

    try {
      const prompt = generateMemberInfoPrompt(member)
      await streamCallAI(prompt, onChunk)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '查询信息失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * AI查询食材/菜谱权威信息（保留非流式版本）
   */
  async function queryInfo(name: string, type: 'ingredient' | 'recipe'): Promise<string> {
    if (!aiStore.settings?.apiKey) {
      throw new Error('请先配置API Key')
    }

    isLoading.value = true
    error.value = null

    try {
      const prompt = generateInfoQueryPrompt(name, type)
      return await callAI(prompt)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '查询信息失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * AI查询家庭成员的个性化饮食建议（保留非流式版本）
   */
  async function queryMemberInfo(member: FamilyMember): Promise<string> {
    if (!aiStore.settings?.apiKey) {
      throw new Error('请先配置API Key')
    }

    isLoading.value = true
    error.value = null

    try {
      const prompt = generateMemberInfoPrompt(member)
      return await callAI(prompt)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '查询信息失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 调用AI API（流式）
   */
  async function streamCallAI(
    prompt: string,
    onChunk: (chunk: string) => Promise<void> | void
  ): Promise<void> {
    if (!aiStore.settings) throw new Error('AI设置未配置')

    const { apiKey, baseUrl, model, temperature } = aiStore.settings

    const messages = [
      { role: 'system', content: '你是一位专业的饮食健康助手。' },
      { role: 'user', content: prompt }
    ]

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: true
      })
    })

    if (!response.ok) {
      let errorMsg = `请求失败: ${response.status}`
      try {
        const errorData = await response.json()
        errorMsg += ` - ${errorData.error?.message || JSON.stringify(errorData)}`
      } catch {
        errorMsg += ` - ${response.statusText}`
      }
      throw new Error(errorMsg)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应')

    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let chunkCount = 0

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      
      // 立即尝试解析可用的data lines
      while (buffer.includes('\n')) {
        const newlineIndex = buffer.indexOf('\n')
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        
        if (!line) continue
        if (!line.startsWith('data: ')) continue
        
        const dataStr = line.slice(6).trim()
        if (dataStr === '[DONE]') {
          continue
        }

        try {
          const data = JSON.parse(dataStr)
          const delta = data.choices?.[0]?.delta?.content
          if (delta) {
            chunkCount++
            await onChunk(delta) // 等待async回调
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  /**
   * 调用AI API（非流式）
   */
  async function callAI(prompt: string): Promise<string> {
    if (!aiStore.settings) throw new Error('AI设置未配置')

    const { apiKey, baseUrl, model, temperature } = aiStore.settings

    const messages = [
      { role: 'system', content: '你是一位专业的饮食健康助手。' },
      { role: 'user', content: prompt }
    ]

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: false
      })
    })

    if (!response.ok) {
      let errorMsg = `请求失败: ${response.status}`
      try {
        const errorData = await response.json()
        errorMsg += ` - ${errorData.error?.message || JSON.stringify(errorData)}`
      } catch {
        errorMsg += ` - ${response.statusText}`
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }

  async function streamChat(userContent: string, messageId: string) {
    if (!aiStore.settings) return

    const { apiKey, baseUrl, model, temperature } = aiStore.settings

    const messages = [
      { role: 'system', content: getEnhancedSystemPrompt() },
      ...(aiStore.currentSession?.messages
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content })) || [])
    ]

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          stream: true
        })
      })

      if (!response.ok) {
        let errorMsg = `请求失败: ${response.status}`
        try {
          const errorData = await response.json()
          errorMsg += ` - ${errorData.error?.message || JSON.stringify(errorData)}`
        } catch {
          errorMsg += ` - ${response.statusText}`
        }
        throw new Error(errorMsg)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应')

      const decoder = new TextDecoder('utf-8')
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        
        // 优化解析逻辑：处理所有可用的data行
        while (true) {
          const newlineIndex = buffer.indexOf('\n')
          if (newlineIndex === -1) break
          
          const line = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)
          
          if (!line) continue
          
          // 兼容有空格和无空格的data前缀
          let dataStr = ''
          if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            dataStr = line.slice(5).trim()
          } else {
            continue
          }
          
          if (dataStr === '[DONE]') continue

          try {
            const data = JSON.parse(dataStr)
            const delta = data.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              // 不等待，直接更新，确保实时性
              aiStore.updateStreamingMessage(messageId, fullContent)
              onStreamUpdate?.()
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      await aiStore.finishStreamingMessage(messageId)
      onStreamComplete?.()
    } catch {
      await normalChat(userContent, messageId)
      onStreamComplete?.()
    }
  }

  async function normalChat(userContent: string, messageId: string) {
    if (!aiStore.settings) return

    const { apiKey, baseUrl, model, systemPrompt, temperature } = aiStore.settings

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(aiStore.currentSession?.messages
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content })) || [])
    ]

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: true
      })
    })

    if (!response.ok) {
      let errorMsg = `请求失败: ${response.status}`
      try {
        const errorData = await response.json()
        errorMsg += ` - ${errorData.error?.message || JSON.stringify(errorData)}`
      } catch {
        errorMsg += ` - ${response.statusText}`
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '抱歉，我无法回答这个问题。'

    await aiStore.updateStreamingMessage(messageId, content)
    await aiStore.finishStreamingMessage(messageId)
  }

  return {
    isLoading,
    error,
    sendMessage,
    setStreamCallbacks,
    fillIngredientForm,
    fillRecipeForm,
    queryInfo,
    queryMemberInfo,
    streamQueryInfo,
    streamQueryMemberInfo,
    loadFileContent
  }
}
