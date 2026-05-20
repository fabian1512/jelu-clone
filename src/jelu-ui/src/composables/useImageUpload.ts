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

  function reset() {
    imageUrl.value = null
    imagePath.value = null
    file.value = null
    uploadType.value = 'web'
    uploadPercentage.value = 0
    errorMessage.value = ""
    progress.value = false
  }

  const canApplyUpload = computed(() => {
    return (StringUtils.isNotBlank(imageUrl.value) && uploadType.value === 'web') ||
           (StringUtils.isNotBlank(imagePath.value) && uploadType.value === 'server') ||
           (file.value != null && uploadType.value === 'computer')
  })

  interface WebPayload { type: 'web'; url: string }
  interface ComputerPayload { type: 'computer'; file: File }
  interface ServerPayload { type: 'server'; path: string }
  type UploadPayload = WebPayload | ComputerPayload | ServerPayload | null

  function getUploadPayload(): UploadPayload {
    if (!canApplyUpload.value) return null
    if (uploadType.value === 'web' && StringUtils.isNotBlank(imageUrl.value)) {
      const url = imageUrl.value
      imageUrl.value = ''
      return { type: 'web', url }
    }
    if (uploadType.value === 'computer' && file.value != null) {
      return { type: 'computer', file: file.value }
    }
    if (uploadType.value === 'server' && StringUtils.isNotBlank(imagePath.value)) {
      const path = imagePath.value
      imagePath.value = ''
      return { type: 'server', path }
    }
    return null
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
    reset,
    canApplyUpload,
    getUploadPayload,
  }
}
