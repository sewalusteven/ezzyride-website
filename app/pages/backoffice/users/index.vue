<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const { $api } = useNuxtApp()
const { can }  = useAuth()

// ── State ────────────────────────────────────────────────────────────────────
const users        = ref<any[]>([])
const roles        = ref<string[]>([])
const loading      = ref(true)
const search       = ref('')
const currentPage  = ref(1)
const lastPage     = ref(1)
const total        = ref(0)

// Modals
const showCreate   = ref(false)
const showEdit     = ref(false)
const showDelete   = ref(false)
const submitting   = ref(false)
const modalError   = ref('')
const selectedUser = ref<any>(null)

const createForm   = ref({ name: '', email: '', phone: '', role: '' })
const editForm     = ref({ name: '', phone: '', status: '', role: '' })

// ── Load ─────────────────────────────────────────────────────────────────────
const fetchUsers = async () => {
  loading.value = true
  try {
    const { data } = await $api.get('/v1/users', {
      params: { search: search.value || undefined, page: currentPage.value }
    })
    users.value     = data.data.data ?? data.data
    currentPage.value = data.data.current_page ?? 1
    lastPage.value  = data.data.last_page ?? 1
    total.value     = data.data.total ?? users.value.length
  } catch { /* handled globally */ }
  finally { loading.value = false }
}

const fetchRoles = async () => {
  try {
    const { data } = await $api.get('/v1/roles')
    roles.value = data.data.roles.map((r: any) => r.name)
  } catch { /* ignore */ }
}

let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchUsers() }, 400)
})

onMounted(() => { fetchUsers(); fetchRoles() })

// ── Create ────────────────────────────────────────────────────────────────────
const openCreate = () => {
  createForm.value = { name: '', email: '', phone: '', role: roles.value[0] ?? '' }
  modalError.value = ''
  showCreate.value = true
}

const submitCreate = async () => {
  submitting.value = true
  modalError.value = ''
  try {
    await $api.post('/v1/users', createForm.value)
    showCreate.value = false
    fetchUsers()
  } catch (err: any) {
    const d = err.response?.data
    modalError.value = d?.errors ? Object.values(d.errors).flat().join(' ') : (d?.message ?? 'Failed to invite user.')
  } finally { submitting.value = false }
}

// ── Edit ──────────────────────────────────────────────────────────────────────
const openEdit = (u: any) => {
  selectedUser.value = u
  editForm.value = { name: u.name, phone: u.phone ?? '', status: u.status, role: u.role ?? '' }
  modalError.value = ''
  showEdit.value = true
}

const submitEdit = async () => {
  submitting.value = true
  modalError.value = ''
  try {
    await $api.patch(`/v1/users/${selectedUser.value.id}`, editForm.value)
    showEdit.value = false
    fetchUsers()
  } catch (err: any) {
    const d = err.response?.data
    modalError.value = d?.errors ? Object.values(d.errors).flat().join(' ') : (d?.message ?? 'Failed to update user.')
  } finally { submitting.value = false }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const openDelete = (u: any) => {
  selectedUser.value = u
  modalError.value = ''
  showDelete.value = true
}

const confirmDelete = async () => {
  submitting.value = true
  modalError.value = ''
  try {
    await $api.delete(`/v1/users/${selectedUser.value.id}`)
    showDelete.value = false
    fetchUsers()
  } catch (err: any) {
    const d = err.response?.data
    modalError.value = d?.message ?? 'Failed to delete user.'
  } finally { submitting.value = false }
}

// ── Resend invite ─────────────────────────────────────────────────────────────
const resendInvite = async (u: any) => {
  try {
    await $api.post(`/v1/users/${u.id}/resend-invite`)
  } catch { /* ignore */ }
}

// ── Status badge ─────────────────────────────────────────────────────────────
const statusClass = (status: string) => ({
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  pending:  'bg-amber-100 text-amber-700',
}[status] ?? 'bg-gray-100 text-gray-500')
</script>

<template>
  <div class="p-4 md:p-6 space-y-5">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold text-gray-900">Users</h1>
        <p class="text-xs text-gray-400 mt-0.5">Manage who has access to the admin panel</p>
      </div>
      <button v-if="can('users.add')" @click="openCreate"
        class="inline-flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
        <i class="fa-solid fa-user-plus"></i> Invite User
      </button>
    </div>

   <div class="bg-white p-4 shadow rounded flex flex-col gap-2">
     <!-- Search -->
     <div class="relative max-w-sm">
       <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
       <input v-model="search" type="text" placeholder="Search users…"
              class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
     </div>

     <!-- Table -->
     <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
       <div v-if="loading" class="flex items-center justify-center py-16">
         <i class="fa-solid fa-spinner fa-spin text-primary text-2xl"></i>
       </div>

       <template v-else>
         <div class="overflow-x-auto">
           <table class="w-full text-sm">
             <thead class="bg-gray-50 border-b border-gray-100">
             <tr>
               <th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
               <th class="px-4 py-3 text-left font-medium text-gray-500">Email</th>
               <th class="px-4 py-3 text-left font-medium text-gray-500">Role</th>
               <th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
               <th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
             </tr>
             </thead>
             <tbody class="divide-y divide-gray-50">
             <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50/50">
               <td class="px-4 py-3">
                 <div class="flex items-center gap-2.5">
                   <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold shrink-0">
                     {{ u.name?.charAt(0).toUpperCase() }}
                   </div>
                   <div>
                     <p class="font-medium text-gray-900">{{ u.name }}</p>
                     <p v-if="u.phone" class="text-xs text-gray-400">{{ u.phone }}</p>
                   </div>
                 </div>
               </td>
               <td class="px-4 py-3 text-gray-600">{{ u.email }}</td>
               <td class="px-4 py-3">
                  <span class="inline-block bg-secondary/10 text-secondary text-xs font-medium px-2 py-0.5 rounded-full capitalize">
                    {{ u.role ?? '—' }}
                  </span>
               </td>
               <td class="px-4 py-3">
                  <span :class="statusClass(u.status)" class="inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize">
                    {{ u.status }}
                  </span>
               </td>
               <td class="px-4 py-3">
                 <div class="flex items-center justify-end gap-1">
                   <button v-if="can('users.edit') && u.status === 'pending'" @click="resendInvite(u)"
                           class="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Resend invitation">
                     <i class="fa-solid fa-paper-plane text-xs"></i>
                   </button>
                   <button v-if="can('users.edit')" @click="openEdit(u)"
                           class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Edit user">
                     <i class="fa-solid fa-pen text-xs"></i>
                   </button>
                   <button v-if="can('users.delete')" @click="openDelete(u)"
                           class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete user">
                     <i class="fa-solid fa-trash text-xs"></i>
                   </button>
                 </div>
               </td>
             </tr>
             <tr v-if="users.length === 0">
               <td colspan="5" class="py-12 text-center text-gray-400 text-sm">No users found</td>
             </tr>
             </tbody>
           </table>
         </div>

         <!-- Pagination -->
         <div v-if="lastPage > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
           <span>{{ total }} users</span>
           <div class="flex gap-1">
             <button v-for="p in lastPage" :key="p" @click="currentPage = p; fetchUsers()"
                     :class="p === currentPage ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'"
                     class="w-7 h-7 rounded-md transition-colors text-xs font-medium">{{ p }}</button>
           </div>
         </div>
       </template>
     </div>
   </div>

    <!-- ── Create Modal ─────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="showCreate = false">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-base font-bold text-gray-900">Invite New User</h2>
              <button @click="showCreate = false" class="text-gray-400 hover:text-gray-600 p-1"><i class="fa-solid fa-times"></i></button>
            </div>

            <div v-if="modalError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              <i class="fa-solid fa-circle-exclamation"></i> {{ modalError }}
            </div>

            <form @submit.prevent="submitCreate" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input v-model="createForm.name" type="text" required
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input v-model="createForm.email" type="email" required
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
                <input v-model="createForm.phone" type="text"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+256 700 000000" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select v-model="createForm.role" required
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary capitalize">
                  <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
              <p class="text-xs text-gray-400">An invitation email with an activation link will be sent to this address.</p>
              <div class="flex gap-3 pt-2">
                <button type="button" @click="showCreate = false"
                  class="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
                <button type="submit" :disabled="submitting"
                  class="flex-1 bg-primary hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <i v-if="submitting" class="fa-solid fa-spinner fa-spin"></i>
                  {{ submitting ? 'Sending…' : 'Send Invitation' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Edit Modal ─────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="showEdit = false">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-base font-bold text-gray-900">Edit User</h2>
              <button @click="showEdit = false" class="text-gray-400 hover:text-gray-600 p-1"><i class="fa-solid fa-times"></i></button>
            </div>

            <div v-if="modalError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              <i class="fa-solid fa-circle-exclamation"></i> {{ modalError }}
            </div>

            <form @submit.prevent="submitEdit" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input v-model="editForm.name" type="text" required
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input v-model="editForm.phone" type="text"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <select v-model="editForm.role"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary capitalize">
                    <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select v-model="editForm.status"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" @click="showEdit = false"
                  class="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
                <button type="submit" :disabled="submitting"
                  class="flex-1 bg-primary hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <i v-if="submitting" class="fa-solid fa-spinner fa-spin"></i>
                  {{ submitting ? 'Saving…' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete Confirm ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="showDelete = false">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-trash text-red-500 text-xl"></i>
            </div>
            <h2 class="font-bold text-gray-900 mb-1">Delete User?</h2>
            <p class="text-sm text-gray-500 mb-5">
              <span class="font-medium text-gray-700">{{ selectedUser?.name }}</span> will be permanently removed and will lose access immediately.
            </p>
            <div v-if="modalError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ modalError }}</div>
            <div class="flex gap-3">
              <button @click="showDelete = false"
                class="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
              <button @click="confirmDelete" :disabled="submitting"
                class="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                <i v-if="submitting" class="fa-solid fa-spinner fa-spin"></i>
                {{ submitting ? 'Deleting…' : 'Delete User' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
