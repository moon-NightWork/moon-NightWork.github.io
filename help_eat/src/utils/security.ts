/**
 * 简单的安全工具 - 用于混淆存储
 * 注意：这不是真正的加密，只是防止直接在浏览器中显示明文
 */

const XOR_KEY = 0x5A
const SALT = 'one-day-three-meals-v1'

export function obfuscate(text: string): string {
  if (!text) return text
  
  const xorResult = Array.from(text).map(char => 
    String.fromCharCode(char.charCodeAt(0) ^ XOR_KEY)
  ).join('')
  
  const salted = SALT + xorResult + SALT
  return btoa(encodeURIComponent(salted))
}

export function deobfuscate(encoded: string): string {
  if (!encoded) return encoded
  
  try {
    const salted = decodeURIComponent(atob(encoded))
    if (!salted.startsWith(SALT) || !salted.endsWith(SALT)) {
      return encoded // 不是混淆的，直接返回
    }
    
    const xorResult = salted.slice(SALT.length, -SALT.length)
    return Array.from(xorResult).map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ XOR_KEY)
    ).join('')
  } catch {
    return encoded // 解码失败，返回原值
  }
}
