import { computed, Ref, ref } from "vue"
import { StringUtils } from "../utils/StringUtils"

export function useImageUpload() {
  const imageUrl = ref<string | null>(null)
  const imagePath = ref<string | null>(null)
  const file: Ref<File | null> = ref(null)
  const uploadType = ref('web')
  const uploadPercentage = ref(0)
  const errorMessage = ref("")
  const progress: Ref<boolean> = ref(false)

  function handleFileUpload(event: any) {
    file.value = event.target.files[0]
  }

  function clearImageField() {
    imageUrl.value = ""
  }

  const canApplyUpload = computed(() => {
    return (StringUtils.isNotBlank(imageUrl.value) && uploadType.value === 'web') ||
           (StringUtils.isNotBlank(imagePath.value) && uploadType.value === 'server') ||
           (file.value != null && uploadType.value === 'computer')
  })

  function applyCoverUpload(userbook: { book: { image: string | null } }, onProgress?: (percent: number) => void) {
    if (!canApplyUpload.value) return

    if (uploadType.value === 'web' && StringUtils.isNotBlank(imageUrl.value)) {
      userbook.book.image = imageUrl.value
      imageUrl.value = ''
    } else if (uploadType.value === 'computer' && file.value != null) {
      progress.value = true
      return { file: file.value, onProgress, uploadPercentage }
    } else if (uploadType.value === 'server' && StringUtils.isNotBlank(imagePath.value)) {
      userbook.book.image = imagePath.value
      imagePath.value = ''
    }
    return undefined
  }

  return {
    imageUrl,
    imagePath,
    file,
    uploadType,
    uploadPercentage,
    errorMessage,
    progress,
    handleFileUpload,
    clearImageField,
    canApplyUpload,
    applyCoverUpload,
  }
}
