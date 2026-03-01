<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const { can }  = useAuth()

type ListTab = 'active' | 'unsubscribed'
const activeTab   = ref<ListTab>('active')

// ── Active subscribers ────────────────────────────────────────────────────────
const active      = ref<any[]>([])
const activeTotal = ref(0)
const activePage  = ref(1)
const activePages = ref(1)
const loadingA    = ref(false)
const searchA     = ref('')

// ── Unsubscribed ──────────────────────────────────────────────────────────────
const unsub       = ref<any[]>([])
const unsubTotal  = ref(0)
const unsubPage   = ref(1)
const unsubPages  = ref(1)
const loadingU    = ref(false)
const searchU     = ref('')

// ── Delete confirm ────────────────────────────────────────────────────────────
const deleting    = ref<number | null>(null)

const fetchActive = async () => {
  loadingA.value = true
  try {
    const { data } = await $api.get('/v1/mailing-list', {
      params: { search: searchA.value || undefined, page: activePage.value }
    })
    active.value      = data.data.data ?? data.data
    activeTotal.value = data.data.total ?? active.value.length
    activePages.value = data.data.last_page ?? 1
  } finally { loadingA.value = false }
}

const fetchUnsub = async () => {
  loadingU.value = true
  try {
    const { data } = await $api.get('/v1/mailing-list/unsubscribed', {
      params: { search: searchU.value || undefined, page: unsubPage.value }
    })
    unsub.value      = data.data.data ?? data.data
    unsubTotal.value = data.data.total ?? unsub.value.length
    unsubPages.value = data.data.last_page ?? 1
  } finally { loadingU.value = false }
}

let timerA: ReturnType<typeof setTimeout>
let timerU: ReturnType<typeof setTimeout>
watch(searchA, () => { clearTimeout(timerA); timerA = setTimeout(() => { activePage.value = 1; fetchActive() }, 400) })
watch(searchU, () => { clearTimeout(timerU); timerU = setTimeout(() => { unsubPage.value  = 1; fetchUnsub()  }, 400) })

onMounted(() => { fetchActive(); fetchUnsub() })

const removeSubscriber = async (id: number) => {
  if (!confirm('Permanently remove this subscriber from the database?')) return
  deleting.value = id
  try {
    await $api.delete(`/v1/mailing-list/${id}`)
    fetchActive()
    fetchUnsub()
  } finally { deleting.value = null }
}

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
</script>

<template>
  <div class="p-4 md:p-6 space-y-5">

    <!-- Header -->
    <div>
      <h1 class="text-lg font-semibold text-gray-900">Mailing List</h1>
      <p class="text-xs text-gray-400 mt-0.5">People who have subscribed to receive updates from EzzyRide</p>
    </div>

   <div class="bg-white rounded shadow p-4 flex flex-col gap-4">
     <!-- Stats chips -->
     <div class="flex gap-3 flex-wrap">
       <div class="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
         <i class="fa-solid fa-circle-check text-green-500 text-sm"></i>
         <div>
           <p class="text-lg font-bold text-green-700 leading-none">{{ activeTotal }}</p>
           <p class="text-xs text-green-600 mt-0.5">Active</p>
         </div>
       </div>
       <div class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
         <i class="fa-solid fa-circle-xmark text-gray-400 text-sm"></i>
         <div>
           <p class="text-lg font-bold text-gray-600 leading-none">{{ unsubTotal }}</p>
           <p class="text-xs text-gray-400 mt-0.5">Unsubscribed</p>
         </div>
       </div>
     </div>

     <!-- Tabs -->
     <div class="flex border-b border-gray-100">
       <button
           @click="activeTab = 'active'"
           class="px-4 py-2.5 text-sm font-medium border-b-2 cursor-pointer -mb-px transition-colors"
           :class="activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'"
       >
         <i class="fa-solid fa-envelope text-xs mr-1.5"></i>
         Active Subscribers
       </button>
       <button
           @click="activeTab = 'unsubscribed'"
           class="px-4 py-2.5 text-sm cursor-pointer font-medium border-b-2 -mb-px transition-colors"
           :class="activeTab === 'unsubscribed' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'"
       >
         <i class="fa-solid fa-envelope-open text-xs mr-1.5"></i>
         Unsubscribed
       </button>
     </div>

     <!-- ── Active tab ──────────────────────────────────────────────────────── -->
     <div v-if="activeTab === 'active'" class="space-y-4">
       <div class="relative max-w-sm">
         <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
         <input v-model="searchA" type="text" placeholder="Search by email…"
                class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
       </div>

       <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <div v-if="loadingA" class="flex items-center justify-center py-16">
           <i class="fa-solid fa-spinner fa-spin text-primary text-2xl"></i>
         </div>
         <template v-else>
           <div class="overflow-x-auto">
             <table class="w-full text-sm">
               <thead class="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th class="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                 <th class="px-4 py-3 text-left font-medium text-gray-500">Subscribed</th>
                 <th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
               </tr>
               </thead>
               <tbody class="divide-y divide-gray-50">
               <tr v-for="s in active" :key="s.id" class="hover:bg-gray-50/50">
                 <td class="px-4 py-3">
                   <div class="flex items-center gap-2.5">
                     <div class="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                       <i class="fa-solid fa-envelope text-green-600 text-xs"></i>
                     </div>
                     <span class="text-gray-800 font-medium">{{ s.email }}</span>
                   </div>
                 </td>
                 <td class="px-4 py-3 text-gray-500">{{ fmtDate(s.created_at) }}</td>
                 <td class="px-4 py-3 text-right">
                   <button v-if="can('mailing-list.delete')"
                           @click="removeSubscriber(s.id)"
                           :disabled="deleting === s.id"
                           class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                           title="Remove permanently">
                     <i v-if="deleting === s.id" class="fa-solid fa-spinner fa-spin text-xs"></i>
                     <i v-else class="fa-solid fa-trash text-xs"></i>
                   </button>
                 </td>
               </tr>
               <tr v-if="active.length === 0">
                 <td colspan="3" class="py-12 text-center text-gray-400 text-sm">No active subscribers</td>
               </tr>
               </tbody>
             </table>
           </div>
           <div v-if="activePages > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
             <span>{{ activeTotal }} subscribers</span>
             <div class="flex gap-1">
               <button v-for="p in activePages" :key="p" @click="activePage = p; fetchActive()"
                       :class="p === activePage ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'"
                       class="w-7 h-7 rounded-md text-xs font-medium">{{ p }}</button>
             </div>
           </div>
         </template>
       </div>
     </div>

     <!-- ── Unsubscribed tab ────────────────────────────────────────────────── -->
     <div v-if="activeTab === 'unsubscribed'" class="space-y-4">
       <div class="relative max-w-sm">
         <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
         <input v-model="searchU" type="text" placeholder="Search by email…"
                class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
       </div>

       <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <div v-if="loadingU" class="flex items-center justify-center py-16">
           <i class="fa-solid fa-spinner fa-spin text-primary text-2xl"></i>
         </div>
         <template v-else>
           <div class="overflow-x-auto">
             <table class="w-full text-sm">
               <thead class="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th class="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                 <th class="px-4 py-3 text-left font-medium text-gray-500">Unsubscribed</th>
                 <th class="px-4 py-3 text-left font-medium text-gray-500">Reason</th>
                 <th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
               </tr>
               </thead>
               <tbody class="divide-y divide-gray-50">
               <tr v-for="s in unsub" :key="s.id" class="hover:bg-gray-50/50">
                 <td class="px-4 py-3">
                   <div class="flex items-center gap-2.5">
                     <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                       <i class="fa-solid fa-envelope-open text-gray-400 text-xs"></i>
                     </div>
                     <span class="text-gray-600">{{ s.email }}</span>
                   </div>
                 </td>
                 <td class="px-4 py-3 text-gray-500">{{ fmtDate(s.unsubscribed_at) }}</td>
                 <td class="px-4 py-3 text-gray-500 max-w-xs">
                   <span v-if="s.unsubscribe_reason" class="text-xs italic">{{ s.unsubscribe_reason }}</span>
                   <span v-else class="text-gray-300 text-xs">No reason given</span>
                 </td>
                 <td class="px-4 py-3 text-right">
                   <button v-if="can('mailing-list.delete')"
                           @click="removeSubscriber(s.id)"
                           :disabled="deleting === s.id"
                           class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                           title="Remove permanently">
                     <i v-if="deleting === s.id" class="fa-solid fa-spinner fa-spin text-xs"></i>
                     <i v-else class="fa-solid fa-trash text-xs"></i>
                   </button>
                 </td>
               </tr>
               <tr v-if="unsub.length === 0">
                 <td colspan="4" class="py-12 text-center text-gray-400 text-sm">No unsubscribed contacts</td>
               </tr>
               </tbody>
             </table>
           </div>
           <div v-if="unsubPages > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
             <span>{{ unsubTotal }} records</span>
             <div class="flex gap-1">
               <button v-for="p in unsubPages" :key="p" @click="unsubPage = p; fetchUnsub()"
                       :class="p === unsubPage ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'"
                       class="w-7 h-7 rounded-md text-xs font-medium">{{ p }}</button>
             </div>
           </div>
         </template>
       </div>
     </div>
   </div>

  </div>
</template>
