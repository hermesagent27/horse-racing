<script setup lang="ts">
const file = ref<File | null>(null)
const trackCode = ref('RP')
const raceDate = ref(getToday())
const uploading = ref(false)
const status = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const tracks = [
  { code: 'RP', name: 'Remington Park' },
  { code: 'LS', name: 'Lone Star Park' },
  { code: 'RP', name: 'Ruidoso Downs' },
  { code: 'FG', name: 'Fair Grounds' },
]

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    file.value = input.files[0]
    status.value = null
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const droppedFile = event.dataTransfer?.files[0]
  if (droppedFile?.type === 'application/pdf') {
    file.value = droppedFile
    status.value = null
  } else {
    status.value = { type: 'error', message: 'Please drop a PDF file' }
  }
}

function clearFile() {
  file.value = null
  status.value = null
}

async function uploadPDF() {
  if (!file.value) return
  
  uploading.value = true
  status.value = null
  
  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('trackCode', trackCode.value)
  formData.append('date', raceDate.value)
  
  try {
    const result = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    status.value = { 
      type: 'success', 
      message: `Processed ${result.races} races. Data saved for ${result.date}` 
    }
    clearFile()
  } catch (e: any) {
    status.value = { 
      type: 'error', 
      message: e.message || 'Failed to process PDF' 
    }
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">
      <Icon name="lucide:upload" class="w-8 h-8 inline mr-2" /
      Upload Race Program
    </h1>
    
    <!-- Upload Area -->
    <div
      class="card bg-base-100 shadow mb-6"
      @dragover.prevent
      @drop="handleDrop"
    >
      <div class="card-body">
        <!-- File Drop Zone -->
        <div
          v-if="!file"
          class="border-2 border-dashed border-base-300 rounded-lg p-12 text-center hover:border-primary cursor-pointer transition-colors"
          @click="$refs.fileInput?.click()"
        >
          <Icon name="lucide:file-up" class="w-12 h-12 mx-auto mb-4 text-base-content/50" />
          
          <p class="text-lg font-medium mb-2">Drop PDF here or click to browse</p>
          
          <p class="text-sm text-base-content/50">Supported: PDF race programs</p>
          
          <input
            ref="fileInput"
            type="file"
            accept="application/pdf"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>
        
        <!-- Selected File -->
        <div v-else class="bg-base-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Icon name="lucide:file-text" class="w-8 h-8 text-primary" />
              
              <div>
                <p class="font-medium">{{ file.name }}</p>
                
                <p class="text-sm text-base-content/50">{{ (file.size / 1024).toFixed(1) }} KB</p>
              </div>
            </div>
            
            <button class="btn btn-ghost btn-sm" @click="clearFile">
              <Icon name="lucide:x" />
            </button>
          </div>
        </div>
        
        <!-- Metadata Form -->
        <div v-if="file" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Track</span>
            </label>
            
            <select v-model="trackCode" class="select select-bordered">
              <option v-for="track in tracks" :key="track.code" :value="track.code">
                {{ track.name }}
              </option>
            </select>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Race Date</span>
            </label>
            
            <input v-model="raceDate" type="date" class="input input-bordered" />
          </div>
        </div>
        
        <!-- Upload Button -->
        <div v-if="file" class="mt-6">
          <button
            class="btn btn-primary w-full"
            :class="{ 'loading': uploading }"
            :disabled="uploading"
            @click="uploadPDF"
          >
            <Icon v-if="!uploading" name="lucide:upload" class="mr-2" />
            
            <span v-if="uploading">Processing PDF...</span>
            
            <span v-else>Upload and Extract Races</span>
          </button>
        </div>
        
        <!-- Status Message -->
        <div v-if="status" class="mt-4">
          <div 
            class="alert"
            :class="status.type === 'success' ? 'alert-success' : 'alert-error'"
          >
            <Icon 
              :name="status.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'" 
              class="w-5 h-5" 
            />
            
            <span>{{ status.message }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Instructions -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title"><Icon name="lucide:info" class="w-5 h-5" /> How it works</h2>
        
        <ol class="list-decimal list-inside space-y-2 text-base-content/70">
          <li>Upload the PDF race program (from track website or email)</li>
          <li>Select the correct track and race date</li>
          <li>The system extracts horse entries, odds, and past performances</li>
          <li>Races appear on the dashboard for analysis and betting</li>
        </ol>
        
        <p class="mt-4 text-sm text-base-content/50">
          Supports Remington Park, Lone Star, Ruidoso Downs, and more.
        </p>
      </div>
    </div>
  </div>
</template>
