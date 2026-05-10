import type { Ingredient, Recipe, FamilyMember } from '@/types'

/**
 * 生成用户数据上下文提示词
 * 将用户的食材、菜谱、家庭成员数据转换为AI可读的格式
 */
export function generateUserDataContext(
  ingredients: Ingredient[],
  recipes: Recipe[],
  members: FamilyMember[]
): string {
  let context = ''

  // 添加食材数据
  if (ingredients.length > 0) {
    context += `【用户的食材库】\n`
    ingredients.forEach((ing, index) => {
      context += `${index + 1}. ${ing.name}`
      if (ing.effect) context += ` - 功效: ${ing.effect}`
      if (ing.processingMethod) context += ` - 处理方法: ${ing.processingMethod}`
      context += '\n'
    })
    context += '\n'
  }

  // 添加菜谱数据
  if (recipes.length > 0) {
    context += `【用户的菜谱库】\n`
    recipes.forEach((recipe, index) => {
      context += `${index + 1}. ${recipe.name}`
      if (recipe.taste) context += ` - 口味: ${recipe.taste}`
      if (recipe.difficulty) context += ` - 难度: ${recipe.difficulty}`
      if (recipe.cookingTime) context += ` - 烹饪时间: ${recipe.cookingTime}分钟`
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        context += ` - 食材: ${recipe.ingredients.map(i => i.name).join(', ')}`
      }
      context += '\n'
    })
    context += '\n'
  }

  // 添加家庭成员数据
  if (members.length > 0) {
    context += `【用户的家庭成员】\n`
    members.forEach((member, index) => {
      context += `${index + 1}. ${member.name} - ${member.age}岁 - ${member.gender === 'male' ? '男' : '女'}`
      context += ` - 身高: ${member.height}cm - 体重: ${member.weight}kg`
      if (member.tags && member.tags.length > 0) {
        context += ` - 标签: ${member.tags.join(', ')}`
      }
      context += '\n'
    })
    context += '\n'
  }

  return context
}

/**
 * 生成单个家庭成员的完整信息提示词
 */
export function generateMemberInfoPrompt(member: FamilyMember): string {
  const bmi = member.weight / ((member.height / 100) * (member.height / 100))
  let bmiCategory = ''
  if (bmi < 18.5) bmiCategory = '体重偏轻'
  else if (bmi < 24) bmiCategory = '体重正常'
  else if (bmi < 28) bmiCategory = '超重'
  else bmiCategory = '肥胖'

  let prompt = `请为家庭成员"${member.name}"提供个性化的饮食建议，以下是该成员的完整信息：\n\n`
  prompt += `基本信息：\n`
  prompt += `- 姓名：${member.name}\n`
  prompt += `- 年龄：${member.age}岁\n`
  prompt += `- 性别：${member.gender === 'male' ? '男' : '女'}\n`
  prompt += `- 身高：${member.height}cm\n`
  prompt += `- 体重：${member.weight}kg\n`
  prompt += `- BMI：${bmi.toFixed(1)}（${bmiCategory}）\n\n`

  if (member.tags && member.tags.length > 0) {
    prompt += `重要标签（请重点关注）：\n`
    member.tags.forEach((tag, index) => {
      prompt += `${index + 1}. ${tag}\n`
    })
    prompt += '\n'
  }

  prompt += `请提供以下建议：\n`
  prompt += `1. 适合该成员的日常饮食原则\n`
  prompt += `2. 推荐多吃的食材和需要避免的食材\n`
  prompt += `3. 适合的菜谱类型和口味偏好\n`
  prompt += `4. 根据BMI给出的体重管理建议\n`
  prompt += `5. 基于标签的特殊注意事项（如果有标签）\n`

  return prompt
}

/**
 * 生成AI对话的系统提示词
 */
export function generateSystemPrompt(userDataContext: string): string {
  let prompt = `你是一位专业的饮食健康助手，擅长食材营养分析、菜谱推荐和个性化饮食建议。

你的职责：
1. 基于用户的数据提供个性化的健康饮食建议
2. 回答关于食材功效、烹饪方法的问题
3. 推荐适合用户家庭成员的健康菜谱
4. 根据季节和用户的食材库存给出实用建议

${userDataContext ? userDataContext : '用户还没有添加食材、菜谱或家庭成员数据。'}

请使用友好、专业的语言回答用户问题，回答要简洁明了，重点突出。`

  return prompt
}

/**
 * 生成食材表单自动填写的提示词
 */
export function generateIngredientFormPrompt(ingredientName: string): string {
  return `请为食材"${ingredientName}"生成以下信息，仅返回纯JSON格式，不要包含任何其他文字、markdown标记或说明：

{
  "effect": "食材的功效和营养价值（100-200字）",
  "processingMethod": "食材的处理方法和注意事项（50-100字）"
}

重要要求：
1. 不要添加任何说明文字
2. 不要使用markdown代码块标记
3. 只返回纯JSON文本
4. 确保JSON格式正确，引号使用双引号`
}

/**
 * 生成菜谱表单自动填写的提示词
 */
export function generateRecipeFormPrompt(recipeName: string): string {
  return `请为菜谱"${recipeName}"生成以下信息，仅返回纯JSON格式，不要包含任何其他文字、markdown标记或说明：

{
  "taste": "口味描述（例如：酸甜、麻辣、清淡等）",
  "difficulty": "难度，只能是 'easy'、'medium' 或 'hard' 三者之一",
  "cookingTime": "烹饪时间（分钟，数字）",
  "servings": "份量（人数，数字）",
  "steps": "详细的烹饪步骤（200-500字）",
  "ingredientNames": ["主要食材名称1", "主要食材名称2", "主要食材名称3"]
}

重要要求：
1. 不要添加任何说明文字
2. 不要使用markdown代码块标记
3. 只返回纯JSON文本
4. 确保JSON格式正确，引号使用双引号
5. difficulty只能是'easy'、'medium'或'hard'三个值之一
6. cookingTime和servings必须是数字类型，不要加引号`
}

/**
 * 生成食材/菜谱权威信息查询的提示词
 */
export function generateInfoQueryPrompt(
  name: string,
  type: 'ingredient' | 'recipe'
): string {
  const typeText = type === 'ingredient' ? '食材' : '菜谱'
  return `请提供关于${typeText}"${name}"的权威信息，包括：

1. 适合食用的季节和时段
2. 主要功效和营养价值
3. 食用注意事项和禁忌
4. 搭配建议

请用简洁明了的语言回答，分点说明。`
}
