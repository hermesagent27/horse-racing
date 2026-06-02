<script setup lang="ts">
const file = ref<File | null>(null)
const uploading = ref(false)
const status = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
const extractedRaces = ref<any[]>([])
const extractedDate = ref('')
const extractedTrack = ref('')

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    file.value = input.files[0]
    status.value = null
    extractedRaces.value = []
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const droppedFile = event.dataTransfer?.files[0]
  if (droppedFile?.type === 'application/pdf') {
    file.value = droppedFile
    status.value = null
    extractedRaces.value = []
  } else {
    status.value = { type: 'error', message: 'Please drop a PDF file' }
  }
}

function clearFile() {
  file.value = null
  status.value = null
  extractedRaces.value = []
  extractedDate.value = ''
  extractedTrack.value = ''
}

async function processPDF() {
  if (!file.value) return
  
  uploading.value = true
  status.value = { type: 'info', message: 'Extracting races from PDF...' }
  
  const formData = new FormData()
  formData.append('file', file.value)
  
  try {
    const result = await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    extractedRaces.value = result.races || []
    extractedDate.value = result.date || ''
    extractedTrack.value = result.trackCode || 'RP'
    
    status.value = { 
      type: 'success', 
      message: `Extracted ${result.races?.length || 0} races` 
    }
  } catch (e: any) {
    status.value = { 
      type: 'error', 
      message: e.message || 'Failed to process PDF' 
    }
  } finally {
    uploading.value = false
  }
}

async function saveToGitHub() {
  if (extractedRaces.value.length === 0) return
  
  uploading.value = true
  status.value = { type: 'info', message: 'Saving to GitHub...' }
  
  try {
    const result = await $fetch('/api/races', {
      method: 'POST',
      body: {
        date: extractedDate.value,
        races: extractedRaces.value
      }
    })
    
    status.value = { 
      type: 'success', 
      message: `Saved ${result.races} races for ${extractedDate.value}` 
    }
    
    // Clear after success
    setTimeout(() => {
      clearFile()
    }, 2000)
  } catch (e: any) {
    status.value = { 
      type: 'error', 
      message: e.message || 'Failed to save to GitHub' 
    }
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">
      <Icon name="lucide:upload" class="w-8 h-8 inline mr-2" />
      Upload Race Program
    </h1>
    
    <!-- Upload Area -->
    <div
      v-if="!extractedRaces.length"
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
        
        <!-- Process Button -->
        <div v-if="file" class="mt-6">
          <button
            class="btn btn-primary w-full"
            :class="{ 'loading': uploading }"
            :disabled="uploading"
            @click="processPDF"
          >
            <Icon v-if="!uploading" name="lucide:scan" class="mr-2" />
            <span v-if="uploading">Extracting...</span>
            <span v-else>Extract Races from PDF</span>
          </button>
        </div>
        
        <!-- Status Message -->
        <div v-if="status" class="mt-4">
          <div 
            class="alert"
            :class="{
              'alert-success': status.type === 'success',
              'alert-error': status.type === 'error',
              'alert-info': status.type === 'info'
            }"
          >
            <span>{{ status.message }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Extracted Races Preview -->
    <div v-if="extractedRaces.length" class="card bg-base-100 shadow mb-6">
      <div class="card-body">
        <h2 class="card-title">
          <Icon name="lucide:check-circle" class="w-5 h-5 text-success" />
          Extracted {{ extractedRaces.length }} Races
        </h2>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Date</span>
            </label>
            <input v-model="extractedDate" type="date" class="input input-bordered" />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Track</span>
            </label>
            <input v-model="extractedTrack" class="input input-bordered" placeholder="RP, LS, etc." />
          </div>
        </div>
        
        <!-- Race List -->
        <div class="space-y-2 mb-4">
          <div
            v-for="race in extractedRaces"
            :key="race.id"
            class="flex items-center justify-between p-3 bg-base-200 rounded"
          >
            <div class="flex items-center gap-3">
              <span class="badge badge-primary">Race {{ race.number }}</span>
              <span>{{ race.distance }}</span>
              <span class="badge badge-outline">{{ race.type }}</span>
            </div>
            
            <span class="text-sm text-base-content/50">{{ race.entries?.length || 0 }} entries</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button class="btn btn-ghost" @click="clearFile">Cancel</button>
          
          <button
            class="btn btn-primary flex-1"
            :class="{ 'loading': uploading }"
            :disabled="uploading || !extractedDate"
            @click="saveToGitHub"
          >
            <Icon name="lucide:save" class="mr-2" />
            Save to GitHub
          </button>
        </div>
        
        <div v-if="status" class="mt-4">
          <div 
            class="alert"
            :class="{
              'alert-success': status.type === 'success',
              'alert-error': status.type === 'error',
              'alert-info': status.type === 'info'
            }"
          >
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
          <li>The system extracts race date, track, and entries</li>
          <li>Review and edit extracted data if needed</li>
          <li>Save to GitHub (persists across sessions)</li>
        </ol>
      </div>
    </div>
  </div>
</template>
