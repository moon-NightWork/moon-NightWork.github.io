import { ref } from 'vue'

export function useImageUpload() {
  const image = ref('')

  async function handleFileSelect(file: File) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        resolve(result)
      }
      reader.readAsDataURL(file)
    })
  }

  function clearImage() {
    image.value = ''
  }

  return {
    image,
    handleFileSelect,
    clearImage
  }
}
