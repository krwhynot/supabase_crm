<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200">
    <!-- Repository Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-medium text-gray-900">Document Repository</h3>
        <p class="mt-1 text-sm text-gray-500">Manage files and documents for this organization</p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- Category Filter -->
        <select
          v-model="selectedCategory"
          class="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        
        <!-- Upload Button -->
        <label class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 cursor-pointer">
          <CloudArrowUpIcon class="h-4 w-4 mr-2" />
          Upload Document
          <input
            ref="fileInput"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.csv,.xlsx,.xls"
            @change="handleFileUpload"
            class="sr-only"
          >
        </label>
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploadProgress.length > 0" class="px-6 py-4 border-b border-gray-200 bg-blue-50">
      <h4 class="text-sm font-medium text-gray-900 mb-3">Uploading Files</h4>
      <div class="space-y-2">
        <div
          v-for="upload in uploadProgress"
          :key="upload.fileName"
          class="flex items-center justify-between"
        >
          <div class="flex items-center space-x-3 min-w-0 flex-1">
            <div class="flex-shrink-0">
              <DocumentIcon class="h-5 w-5 text-gray-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">{{ upload.fileName }}</p>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${upload.progress}%` }"
                />
              </div>
            </div>
          </div>
          <div class="flex-shrink-0 ml-4">
            <span class="text-sm text-gray-500">{{ upload.progress }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Repository Content -->
    <div class="px-6 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-flex items-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span class="text-gray-600">Loading documents...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-600 mb-4">
          <ExclamationTriangleIcon class="h-8 w-8 mx-auto" />
        </div>
        <h4 class="text-lg font-medium text-gray-900 mb-2">Error Loading Documents</h4>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          @click="loadDocuments"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredDocuments.length === 0" class="text-center py-8">
        <FolderOpenIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 class="text-lg font-medium text-gray-900 mb-2">
          {{ selectedCategory ? 'No documents in this category' : 'No documents yet' }}
        </h4>
        <p class="text-gray-600 mb-4">
          {{ selectedCategory ? 'Try selecting a different category or upload documents.' : 'Upload documents to get started.' }}
        </p>
        <label class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
          <CloudArrowUpIcon class="h-4 w-4 mr-2" />
          Upload Documents
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.csv,.xlsx,.xls"
            @change="handleFileUpload"
            class="sr-only"
          >
        </label>
      </div>

      <!-- Documents Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="document in filteredDocuments"
          :key="document.id"
          class="relative group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          @click="previewDocument(document)"
        >
          <!-- Document Icon -->
          <div class="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg"
               :class="getFileTypeColor(document.file_type)">
            <component :is="getFileTypeIcon(document.file_type)" class="h-6 w-6 text-white" />
          </div>

          <!-- Document Info -->
          <div class="text-center">
            <h4 class="text-sm font-medium text-gray-900 truncate" :title="document.name">
              {{ document.name }}
            </h4>
            <p class="text-xs text-gray-500 mt-1">
              {{ document.category }} • {{ formatFileSize(document.size) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              {{ formatDate(document.created_at) }}
            </p>
          </div>

          <!-- Category Badge -->
          <span
            class="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            :class="getCategoryColor(document.category)"
          >
            {{ document.category }}
          </span>

          <!-- Actions Menu -->
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="relative inline-block text-left">
              <button
                @click.stop="toggleActionsMenu(document.id)"
                class="p-1 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <EllipsisVerticalIcon class="h-4 w-4 text-gray-600" />
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="activeMenu === document.id"
                v-click-outside="() => activeMenu = null"
                class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div class="py-1">
                  <button
                    @click.stop="downloadDocument(document)"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowDownTrayIcon class="h-4 w-4 inline mr-2" />
                    Download
                  </button>
                  <button
                    @click.stop="editDocument(document)"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <PencilIcon class="h-4 w-4 inline mr-2" />
                    Edit Details
                  </button>
                  <button
                    @click.stop="deleteDocument(document.id)"
                    class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon class="h-4 w-4 inline mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Preview Modal -->
    <div
      v-if="previewModal.show"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="closePreview"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <div class="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{{ previewModal.document?.name }}</h3>
              <p class="text-sm text-gray-500">
                {{ previewModal.document?.category }} • {{ formatFileSize(previewModal.document?.size || 0) }}
              </p>
            </div>
            <button
              @click="closePreview"
              class="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <!-- Modal Content -->
          <div class="px-6 py-6">
            <div class="text-center py-12">
              <DocumentIcon class="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 class="text-lg font-medium text-gray-900 mb-2">Document Preview</h4>
              <p class="text-gray-600 mb-6">
                Document preview functionality would be implemented here based on file type.
              </p>
              <div class="space-x-4">
                <button
                  @click="downloadDocument(previewModal.document!)"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowDownTrayIcon class="h-4 w-4 mr-2" />
                  Download
                </button>
                <button
                  @click="closePreview"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  FolderOpenIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  TableCellsIcon,
  FilmIcon,
  MusicalNoteIcon
} from '@heroicons/vue/24/outline'

/**
 * Document Repository Component
 * Manages file uploads, categorization, and document storage for an organization
 */

interface Props {
  organizationId: string
}

interface Document {
  id: string
  organization_id: string
  name: string
  file_type: string
  file_url: string
  category: string
  size: number
  created_at: string
  updated_at: string
}

interface UploadProgress {
  fileName: string
  progress: number
}

interface PreviewModal {
  show: boolean
  document: Document | null
}

const props = defineProps<Props>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const documents = ref<Document[]>([])
const selectedCategory = ref('')
const activeMenu = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()
const uploadProgress = ref<UploadProgress[]>([])

const previewModal = reactive<PreviewModal>({
  show: false,
  document: null
})

// Categories
const categories = [
  'Contract',
  'Proposal',
  'Invoice',
  'Presentation',
  'Legal',
  'Marketing',
  'Technical',
  'Other'
]

// Computed
const filteredDocuments = computed(() => {
  if (!selectedCategory.value) return documents.value
  return documents.value.filter(doc => doc.category === selectedCategory.value)
})

// Methods
const loadDocuments = async () => {
  loading.value = true
  error.value = null
  
  try {
    // In a real implementation, this would call an API
    // For now, we'll simulate with empty data
    documents.value = []
  } catch (err) {
    console.error('Error loading documents:', err)
    error.value = 'Failed to load documents. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) return

  // Process each file
  for (const file of Array.from(files)) {
    await uploadFile(file)
  }

  // Clear the input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const uploadFile = async (file: File) => {
  // Add to upload progress
  const progressItem: UploadProgress = {
    fileName: file.name,
    progress: 0
  }
  uploadProgress.value.push(progressItem)

  try {
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      progressItem.progress += Math.random() * 30
      if (progressItem.progress >= 100) {
        progressItem.progress = 100
        clearInterval(progressInterval)
        
        // Add to documents list
        const newDocument: Document = {
          id: `doc_${Date.now()}_${Math.random()}`,
          organization_id: props.organizationId,
          name: file.name,
          file_type: file.type || getFileTypeFromName(file.name),
          file_url: URL.createObjectURL(file),
          category: 'Other',
          size: file.size,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        documents.value.unshift(newDocument)
        
        // Remove from upload progress after a delay
        setTimeout(() => {
          const index = uploadProgress.value.findIndex(p => p.fileName === file.name)
          if (index > -1) {
            uploadProgress.value.splice(index, 1)
          }
        }, 1000)
      }
    }, 200)

    // In a real implementation, this would upload to a storage service
    console.log('Uploading file:', file.name)
    
  } catch (err) {
    console.error('Error uploading file:', err)
    alert(`Failed to upload ${file.name}. Please try again.`)
    
    // Remove from upload progress
    const index = uploadProgress.value.findIndex(p => p.fileName === file.name)
    if (index > -1) {
      uploadProgress.value.splice(index, 1)
    }
  }
}

const getFileTypeFromName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const typeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel'
  }
  return typeMap[extension || ''] || 'application/octet-stream'
}

const previewDocument = (document: Document) => {
  previewModal.document = document
  previewModal.show = true
}

const closePreview = () => {
  previewModal.show = false
  previewModal.document = null
}

const downloadDocument = (document: Document) => {
  // In a real implementation, this would download from the storage service
  const link = window.document.createElement('a')
  link.href = document.file_url
  link.download = document.name
  link.click()
}

const editDocument = (document: Document) => {
  // In a real implementation, this would open an edit modal
  const newName = prompt('Enter new document name:', document.name)
  if (newName && newName.trim()) {
    document.name = newName.trim()
    document.updated_at = new Date().toISOString()
  }
}

const deleteDocument = async (id: string) => {
  const document = documents.value.find(d => d.id === id)
  if (!document) return

  if (confirm(`Are you sure you want to delete "${document.name}"? This action cannot be undone.`)) {
    try {
      documents.value = documents.value.filter(d => d.id !== id)
      activeMenu.value = null
    } catch (err) {
      console.error('Error deleting document:', err)
      alert('Failed to delete document. Please try again.')
    }
  }
}

const toggleActionsMenu = (documentId: string) => {
  activeMenu.value = activeMenu.value === documentId ? null : documentId
}

const getFileTypeIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return PhotoIcon
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv') return TableCellsIcon
  if (fileType.startsWith('video/')) return FilmIcon
  if (fileType.startsWith('audio/')) return MusicalNoteIcon
  return DocumentTextIcon
}

const getFileTypeColor = (fileType: string): string => {
  if (fileType.startsWith('image/')) return 'bg-green-500'
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv') return 'bg-emerald-500'
  if (fileType.startsWith('video/')) return 'bg-purple-500'
  if (fileType.startsWith('audio/')) return 'bg-pink-500'
  if (fileType === 'application/pdf') return 'bg-red-500'
  return 'bg-blue-500'
}

const getCategoryColor = (category: string): string => {
  const colors = {
    Contract: 'bg-blue-100 text-blue-800',
    Proposal: 'bg-purple-100 text-purple-800',
    Invoice: 'bg-green-100 text-green-800',
    Presentation: 'bg-orange-100 text-orange-800',
    Legal: 'bg-red-100 text-red-800',
    Marketing: 'bg-pink-100 text-pink-800',
    Technical: 'bg-gray-100 text-gray-800',
    Other: 'bg-gray-100 text-gray-800'
  }
  return colors[category as keyof typeof colors] || colors.Other
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Click outside directive
const vClickOutside = {
  beforeMount: (el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }, binding: any) => {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    window.document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted: (el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }) => {
    if (el.clickOutsideEvent) {
      window.document.removeEventListener('click', el.clickOutsideEvent)
    }
  }
}

// Lifecycle
onMounted(() => {
  loadDocuments()
})
</script>