<script setup lang="ts">
definePageMeta({ layout: 'admin-layout' })

const chapters = [
  { id: 'getting-started',   icon: 'fa-solid fa-rocket',          label: 'Getting Started' },
  { id: 'dashboard',         icon: 'fa-solid fa-chart-line',       label: 'Dashboard' },
  { id: 'vehicles',          icon: 'fa-solid fa-car',              label: 'Vehicles' },
  { id: 'import-applications', icon: 'fa-solid fa-file-import',    label: 'Import Applications' },
  { id: 'customers',         icon: 'fa-solid fa-users',            label: 'Customers' },
  { id: 'partner-integrations', icon: 'fa-solid fa-handshake',     label: 'Partner Integrations' },
  { id: 'tax-calculator',    icon: 'fa-solid fa-calculator',       label: 'Tax Calculator & Valuations' },
  { id: 'settings',          icon: 'fa-solid fa-cog',              label: 'Settings' },
  { id: 'users-security',    icon: 'fa-solid fa-shield-halved',    label: 'Users & Security' },
  { id: 'website-features',  icon: 'fa-solid fa-globe',            label: 'Website Features' },
  { id: 'transactions',      icon: 'fa-solid fa-money-bill-wave',  label: 'Transactions & Financial Tracking' },
  { id: 'tips',              icon: 'fa-solid fa-lightbulb',        label: 'Tips & Best Practices' },
]

const activeChapter = ref('getting-started')
const mobileMenuOpen = ref(false)

const scrollTo = (id: string) => {
  activeChapter.value = id
  mobileMenuOpen.value = false
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeChapter.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
  )
  chapters.forEach((ch) => {
    const el = document.getElementById(ch.id)
    if (el) observer.observe(el)
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-5">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            <i class="fa-solid fa-book text-blue-600 mr-2"></i>
            Knowledge Center
          </h1>
          <p class="text-sm text-gray-500 mt-1">Complete user guide for the EzzyRide Uganda platform</p>
        </div>
        <button
          class="lg:hidden bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <i class="fa-solid fa-bars mr-1"></i> Chapters
        </button>
      </div>
    </div>

    <div class="max-w-7xl mx-auto flex gap-6 px-6 py-6">

      <!-- ── Sidebar / TOC ────────────────────────────────────────────────── -->
      <aside
        :class="[
          'w-72 shrink-0 lg:block',
          mobileMenuOpen
            ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0'
            : 'hidden'
        ]"
      >
        <div class="lg:sticky lg:top-6">
          <div class="flex items-center justify-between lg:hidden mb-4">
            <span class="font-semibold text-gray-900">Chapters</span>
            <button @click="mobileMenuOpen = false" class="text-gray-400 hover:text-gray-600">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <nav class="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Table of Contents</p>
            <button
              v-for="ch in chapters"
              :key="ch.id"
              @click="scrollTo(ch.id)"
              :class="[
                'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors',
                activeChapter === ch.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              ]"
            >
              <i :class="[ch.icon, 'w-4 text-center text-xs']"></i>
              {{ ch.label }}
            </button>
          </nav>

          <div class="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p class="text-xs font-semibold text-blue-700 mb-1">
              <i class="fa-solid fa-circle-info mr-1"></i> Need Help?
            </p>
            <p class="text-xs text-blue-600 leading-relaxed">
              Contact support at <strong>support@ezzyride.ug</strong> or reach out via the company WhatsApp.
            </p>
          </div>
        </div>
      </aside>

      <!-- ── Main Content ─────────────────────────────────────────────────── -->
      <main class="flex-1 min-w-0 space-y-8">

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 1 — GETTING STARTED                                   -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="getting-started" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-rocket text-blue-600"></i> 1. Getting Started
          </h2>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Welcome to EzzyRide Uganda</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            EzzyRide is Uganda's integrated vehicle marketplace and import assistance platform. The platform combines a public-facing vehicle listing website with a powerful backoffice that helps you manage your entire inventory, handle vehicle import applications from clients, track financials, and coordinate with international and local partners. Whether you are listing a locally available car or helping a customer import a vehicle from Japan, EzzyRide provides the tools to manage the full lifecycle from inquiry to delivery.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Navigating the Backoffice</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The backoffice is your control center. The left sidebar provides quick access to every section:
          </p>
          <ul class="text-sm text-gray-600 space-y-2 ml-4 mb-4">
            <li class="flex items-start gap-2">
              <i class="fa-solid fa-chart-line text-gray-400 mt-0.5 w-4 text-center"></i>
              <span><strong>Dashboard</strong> — A real-time snapshot of your business: vehicles, imports, customers, revenue, and recent activity.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fa-solid fa-car text-gray-400 mt-0.5 w-4 text-center"></i>
              <span><strong>Vehicles</strong> — Your full inventory, configurations (brands, categories, features), and bulk import tools.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fa-solid fa-file-import text-gray-400 mt-0.5 w-4 text-center"></i>
              <span><strong>Import Applications</strong> — Client import requests from initial enquiry through to delivery.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fa-solid fa-users text-gray-400 mt-0.5 w-4 text-center"></i>
              <span><strong>Customers</strong> — Profiles, contact details, linked vehicles, and import history.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fa-solid fa-handshake text-gray-400 mt-0.5 w-4 text-center"></i>
              <span><strong>Partners</strong> — International and local vehicle supply partners and their integrations.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fa-solid fa-money-bill-wave text-gray-400 mt-0.5 w-4 text-center"></i>
              <span><strong>Transactions</strong> — All payment records for vehicle sales and import applications.</span>
            </li>
            <li class="flex items-start gap-2">
              <i class="fa-solid fa-cog text-gray-400 mt-0.5 w-4 text-center"></i>
              <span><strong>Settings</strong> — Company info, pricing, payment details, roles, and audit log.</span>
            </li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">First-Time Setup Checklist</h3>
          <p class="text-sm text-gray-600 mb-3">Before you start using EzzyRide, complete these essential steps:</p>
          <div class="bg-gray-50 rounded-lg p-4 space-y-2">
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-solid fa-square-check text-green-500 w-5 text-center"></i>
              <span><strong>Company Information</strong> — Go to Settings and fill in your company name, address, phone, email, and logo.</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-solid fa-square-check text-green-500 w-5 text-center"></i>
              <span><strong>Currency Rates</strong> — Set the CIF market rate (USD to UGX) and verify the URA tax rate under Tax Settings.</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-solid fa-square-check text-green-500 w-5 text-center"></i>
              <span><strong>Import Pricing</strong> — Configure service fees for each import type (Full Import, Sourcing Only, etc.).</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-solid fa-square-check text-green-500 w-5 text-center"></i>
              <span><strong>Payment Details</strong> — Add your bank account and mobile money details so clients know where to pay.</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-solid fa-square-check text-green-500 w-5 text-center"></i>
              <span><strong>Roles & Permissions</strong> — Review default roles and create additional roles if your team requires different access levels.</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-solid fa-square-check text-green-500 w-5 text-center"></i>
              <span><strong>Invite Team Members</strong> — Go to Users and send invitations to your staff with appropriate roles.</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-solid fa-square-check text-green-500 w-5 text-center"></i>
              <span><strong>Import Valuations</strong> — Upload the latest URA valuation batch so the tax calculator is accurate.</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-solid fa-square-check text-green-500 w-5 text-center"></i>
              <span><strong>Vehicle Configurations</strong> — Set up brands, categories, features, and attributes before adding vehicles.</span>
            </div>
          </div>

          <div class="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Tip:</strong> Complete the setup in order. Currency rates and valuations must be configured before the tax calculator and partner pricing will work correctly on the public website.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 2 — DASHBOARD                                         -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="dashboard" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-chart-line text-blue-600"></i> 2. Dashboard
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            The Dashboard is the first screen you see after logging in. It provides a real-time overview of your business and helps you quickly identify areas that need attention.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Stat Cards</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            At the top of the dashboard, four stat cards summarize your key metrics:
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">Card</th>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">What It Shows</th>
                </tr>
              </thead>
              <tbody class="text-gray-600">
                <tr class="border-b"><td class="px-4 py-2 font-medium">Total Vehicles</td><td class="px-4 py-2">Count of all vehicles in your inventory. Includes available count and how many are published on the website.</td></tr>
                <tr class="border-b"><td class="px-4 py-2 font-medium">Active Imports</td><td class="px-4 py-2">Number of import applications currently in progress. Highlights stalled applications that may need attention.</td></tr>
                <tr class="border-b"><td class="px-4 py-2 font-medium">Customers</td><td class="px-4 py-2">Total registered customer profiles in the system.</td></tr>
                <tr><td class="px-4 py-2 font-medium">Unread Inquiries</td><td class="px-4 py-2">Website inquiries and contact form submissions that have not been read yet. Click to jump directly to the Inquiries section.</td></tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Revenue Summary</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Below the stat cards, the revenue section shows total revenue from vehicle sales and import application payments. It displays the current month's revenue compared to the previous month so you can track growth trends.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Recent Vehicles</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            A quick-view list of the most recently added vehicles with their image, brand, model, year, status badge, and selling price. Click any vehicle to open its detail page.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Active Imports</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Shows the latest import applications that are still in progress. Each entry displays the reference number, client name, service type, current status, and when it was last updated. This widget is designed to help you quickly identify which imports need follow-up.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Recent Sales</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Lists the most recent vehicle sales with the customer name, vehicle details, agreed price, and sale date. Useful for confirming recent transactions without navigating to the full Transactions page.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Inventory Breakdown</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            A visual breakdown of your inventory by status. You will see how many vehicles are in each state: draft, in transit, available, reserved, and sold. This helps you understand your stock composition at a glance.
          </p>

          <div class="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Tip:</strong> The dashboard refreshes every time you navigate to it. All stat cards are clickable and link directly to their respective pages for deeper exploration.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 3 — VEHICLES                                          -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="vehicles" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-car text-blue-600"></i> 3. Vehicles
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            The Vehicles section is the heart of EzzyRide. It manages your entire inventory from the moment a vehicle is added until it is sold and delivered to the customer.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Adding Vehicles Manually</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Click the <strong>"Add Vehicle"</strong> button on the Vehicles page. You will be taken to a form where you fill in:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Brand & Model</strong> — Select from configured brands or type a custom model name.</li>
            <li><strong>Year</strong> — The manufacturing year.</li>
            <li><strong>Category</strong> — e.g., SUV, Sedan, Pickup, Van.</li>
            <li><strong>Engine & Transmission</strong> — Engine CC, fuel type (petrol, diesel, hybrid, electric), transmission (automatic, manual), and drive type (2WD, 4WD, AWD).</li>
            <li><strong>VIN</strong> — The Vehicle Identification Number (chassis number).</li>
            <li><strong>Colour & Mileage</strong> — Exterior colour and odometer reading in kilometres.</li>
            <li><strong>Source Platform</strong> — Where the vehicle was sourced from (e.g., SBT Japan, Be Forward, local dealer).</li>
            <li><strong>Features</strong> — Select applicable features from the configured list (e.g., sunroof, leather seats, reverse camera).</li>
            <li><strong>Images</strong> — Upload multiple photos. The first image becomes the primary/thumbnail image displayed in listings.</li>
            <li><strong>Description</strong> — A rich-text description shown on the public vehicle page.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Bulk Import via Excel</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            For large inventories, use the Excel import feature. Navigate to <strong>Vehicles &gt; Import</strong> to access the bulk import tool. Download the provided template, fill in your vehicle data following the column headers, and upload the completed file. The system validates each row and reports any errors before importing. Successfully validated rows are created as draft vehicles so you can review them before publishing.
          </p>

          <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
            <p class="text-xs text-amber-700">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              <strong>Warning:</strong> Ensure brand names in the Excel file match exactly with your configured brands. Mismatched names will cause validation errors for those rows.
            </p>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Vehicle Detail Tabs</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When you open a specific vehicle, you will see multiple tabs that organize all information:
          </p>
          <div class="space-y-3 mb-4">
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-circle-info text-blue-500 mr-2"></i>Details Tab</p>
              <p class="text-xs text-gray-600 mt-1">Core vehicle information: brand, model, year, engine specs, features, images, and description. This is where you edit the vehicle's public-facing data.</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-ship text-blue-500 mr-2"></i>Importation Tab</p>
              <p class="text-xs text-gray-600 mt-1">Tracks the vehicle's import journey: source country, port of origin, shipping line, container number, estimated arrival dates, and current shipping status. Only relevant for imported vehicles.</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-coins text-blue-500 mr-2"></i>Costs Tab</p>
              <p class="text-xs text-gray-600 mt-1">All costs associated with acquiring the vehicle: purchase price, shipping costs, insurance, URA duties, clearing agent fees, transport to showroom, and any miscellaneous expenses. The system calculates your total landed cost automatically.</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-money-bill-transfer text-blue-500 mr-2"></i>Transactions Tab</p>
              <p class="text-xs text-gray-600 mt-1">Payment records linked to this vehicle. Shows all incoming payments from the customer (deposits, installments, balance) and outgoing payments (costs). Each transaction has a date, amount, type, and reference.</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-user-tag text-blue-500 mr-2"></i>Client (Sale) Tab</p>
              <p class="text-xs text-gray-600 mt-1">Records the sale of the vehicle: customer assignment, agreed price, reservation deposit amount, sale date, and any sale notes. This is where you formally record that a vehicle has been sold to a customer.</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-folder-open text-blue-500 mr-2"></i>Documents Tab</p>
              <p class="text-xs text-gray-600 mt-1">Upload and manage documents related to the vehicle: purchase receipts, shipping documents, customs clearance papers, registration cards, insurance certificates, and inspection reports.</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-envelope-open-text text-blue-500 mr-2"></i>Enquiries Tab</p>
              <p class="text-xs text-gray-600 mt-1">All customer enquiries submitted through the public website for this specific vehicle. Each enquiry shows the customer's name, email, phone, message, and when it was submitted.</p>
            </div>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Publishing Vehicles to the Website</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            A vehicle is only visible on the public website when it is <strong>published</strong>. To publish, open the vehicle detail page and toggle the publish switch to "On". Before publishing, ensure the vehicle has at least one image and a selling price set. Unpublishing a vehicle immediately removes it from the website but retains all data in the backoffice.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Vehicle Statuses</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Every vehicle has a status that reflects its current state in the lifecycle:
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">Status</th>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">Badge</th>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">Meaning</th>
                </tr>
              </thead>
              <tbody class="text-gray-600">
                <tr class="border-b">
                  <td class="px-4 py-2 font-medium">Draft</td>
                  <td class="px-4 py-2"><span class="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Draft</span></td>
                  <td class="px-4 py-2">Vehicle has been created but is incomplete or not ready for listing. Not visible on the website even if published toggle is on.</td>
                </tr>
                <tr class="border-b">
                  <td class="px-4 py-2 font-medium">In Transit</td>
                  <td class="px-4 py-2"><span class="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">In Transit</span></td>
                  <td class="px-4 py-2">Vehicle has been purchased and is being shipped or transported to Uganda. Can be published as "coming soon" on the website.</td>
                </tr>
                <tr class="border-b">
                  <td class="px-4 py-2 font-medium">Available</td>
                  <td class="px-4 py-2"><span class="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Available</span></td>
                  <td class="px-4 py-2">Vehicle is in stock and ready for sale. This is the primary status for vehicles that are actively listed on the website.</td>
                </tr>
                <tr class="border-b">
                  <td class="px-4 py-2 font-medium">Reserved</td>
                  <td class="px-4 py-2"><span class="inline-block px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">Reserved</span></td>
                  <td class="px-4 py-2">A customer has placed a deposit and the vehicle is held for them. Still visible on the website but marked as reserved.</td>
                </tr>
                <tr>
                  <td class="px-4 py-2 font-medium">Sold</td>
                  <td class="px-4 py-2"><span class="inline-block px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">Sold</span></td>
                  <td class="px-4 py-2">Vehicle sale is complete. The vehicle may remain on the website briefly as "sold" before being unpublished.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Pricing Sidebar</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            On the vehicle detail page, a sidebar on the right displays the pricing breakdown:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Cost Price</strong> — Your total acquisition cost (sum of all costs from the Costs tab).</li>
            <li><strong>CIF Value</strong> — The Cost, Insurance, and Freight value in USD (relevant for imported vehicles). This is the value used by URA for tax calculation.</li>
            <li><strong>Selling Price</strong> — The price displayed on the website. This is the asking price for customers.</li>
            <li><strong>Sold Price</strong> — The actual price the vehicle was sold for. This may differ from the selling price due to negotiation.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed">
            The sidebar also shows your <strong>profit margin</strong> (selling price minus cost price) and the <strong>margin percentage</strong>, helping you make informed pricing decisions.
          </p>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 4 — IMPORT APPLICATIONS                               -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="import-applications" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-file-import text-blue-600"></i> 4. Import Applications
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            An import application represents a client's request for EzzyRide to help them acquire a vehicle. It tracks the entire process from the initial enquiry through sourcing, purchasing, shipping, and final delivery. Each application has a unique reference number for easy tracking.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Service Types</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When creating an application, you select the service type that matches the client's needs:
          </p>
          <div class="overflow-x-auto mb-4">
            <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">Service Type</th>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">Description</th>
                </tr>
              </thead>
              <tbody class="text-gray-600">
                <tr class="border-b"><td class="px-4 py-2 font-medium">Full Import</td><td class="px-4 py-2">End-to-end service: sourcing the vehicle abroad, purchasing, shipping to Mombasa, customs clearance, and delivery to Uganda. This is the most comprehensive option.</td></tr>
                <tr class="border-b"><td class="px-4 py-2 font-medium">Sourcing Only</td><td class="px-4 py-2">EzzyRide finds and secures the vehicle abroad on behalf of the client. The client handles shipping and clearance themselves or through their own agent.</td></tr>
                <tr class="border-b"><td class="px-4 py-2 font-medium">Mombasa Clearance</td><td class="px-4 py-2">The client has already purchased and shipped the vehicle to Mombasa port. EzzyRide handles customs clearance in Kenya, URA duties, and transport to Uganda.</td></tr>
                <tr class="border-b"><td class="px-4 py-2 font-medium">Consultation</td><td class="px-4 py-2">Advisory service only. EzzyRide provides guidance on vehicle selection, pricing, tax estimates, and the import process without directly handling logistics.</td></tr>
                <tr><td class="px-4 py-2 font-medium">Custom</td><td class="px-4 py-2">A tailored combination of services not covered by the standard options. The scope is defined on a case-by-case basis.</td></tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Creating an Import Application</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Click <strong>"New Application"</strong> on the Import Applications page. Fill in:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Customer</strong> — Select an existing customer or create a new one inline.</li>
            <li><strong>Service Type</strong> — Choose from the options above.</li>
            <li><strong>Vehicle Preferences</strong> — Brand, model, year range, budget, fuel type, transmission, and any special requirements the client has.</li>
            <li><strong>Notes</strong> — Any additional context about the client's request.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The application is created in <strong>Enquiry</strong> status and a unique reference number is automatically assigned.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Status Workflow</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Import applications follow a defined workflow. Each status represents a phase in the import process:
          </p>
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 font-medium">Enquiry</span>
              <i class="fa-solid fa-arrow-right text-gray-400"></i>
              <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Quoted</span>
              <i class="fa-solid fa-arrow-right text-gray-400"></i>
              <span class="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">Accepted</span>
              <i class="fa-solid fa-arrow-right text-gray-400"></i>
              <span class="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">Sourcing</span>
              <i class="fa-solid fa-arrow-right text-gray-400"></i>
              <span class="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">Vehicle Found</span>
              <i class="fa-solid fa-arrow-right text-gray-400"></i>
              <span class="px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 font-medium">Purchased</span>
              <i class="fa-solid fa-arrow-right text-gray-400"></i>
              <span class="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 font-medium">Shipped</span>
              <i class="fa-solid fa-arrow-right text-gray-400"></i>
              <span class="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">Delivered</span>
              <i class="fa-solid fa-arrow-right text-gray-400"></i>
              <span class="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">Completed</span>
            </div>
          </div>

          <div class="space-y-2 mb-4">
            <div class="text-sm text-gray-600"><strong>Enquiry</strong> — The application has been received. The team reviews the client's requirements and prepares a quote.</div>
            <div class="text-sm text-gray-600"><strong>Quoted</strong> — A price quote has been generated and sent to the client. Waiting for client response.</div>
            <div class="text-sm text-gray-600"><strong>Accepted</strong> — The client has accepted the quote and agreed to proceed. An initial deposit is typically expected at this stage.</div>
            <div class="text-sm text-gray-600"><strong>Sourcing</strong> — The team is actively searching for vehicles that match the client's requirements.</div>
            <div class="text-sm text-gray-600"><strong>Vehicle Found</strong> — A suitable vehicle has been identified. The client reviews and approves the specific vehicle before purchase.</div>
            <div class="text-sm text-gray-600"><strong>Purchased</strong> — The vehicle has been bought from the source. Arrangements for shipping begin.</div>
            <div class="text-sm text-gray-600"><strong>Shipped</strong> — The vehicle is on its way, either by sea freight to Mombasa or overland.</div>
            <div class="text-sm text-gray-600"><strong>Delivered</strong> — The vehicle has arrived and been handed over to the client. Final payments and paperwork are completed.</div>
            <div class="text-sm text-gray-600"><strong>Completed</strong> — All payments are settled, documents are handed over, and the application is closed.</div>
          </div>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Tip:</strong> You can move an application forward or backward in the workflow. If a client cancels, use the "Cancelled" status. If an application stalls for too long, it will be flagged as "Stalled" on the dashboard.
            </p>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Financial Summary</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Each import application has a financial summary section that shows:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Quote Total</strong> — The total amount quoted to the client.</li>
            <li><strong>Total Payments Received</strong> — Sum of all payments the client has made.</li>
            <li><strong>Total Expenses</strong> — Sum of all costs incurred by EzzyRide for this import (vehicle purchase, shipping, duties, agent fees, etc.).</li>
            <li><strong>Balance Due</strong> — The amount the client still owes (quote total minus payments received).</li>
            <li><strong>Profit/Loss</strong> — The difference between payments received and expenses incurred.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Payments & Expenses</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Record each payment from the client with the date, amount, payment method, and reference. Similarly, log every expense incurred during the import process. The system keeps a running tally and updates the financial summary in real time.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Documents</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Upload all documents related to the import: proforma invoices, purchase receipts, bills of lading, customs declarations, URA assessment notices, payment receipts from clients, and any correspondence. Documents are organized chronologically and can be downloaded individually.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Quotes & Sending to Clients</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            You can generate a formal quote for the client directly from the application. The quote includes a breakdown of estimated costs: vehicle price, shipping, insurance, URA duties (estimated using the tax calculator), clearing fees, and EzzyRide's service fee. Once the quote is ready, click <strong>"Send Quote"</strong> to email it to the client. The client receives a professionally formatted PDF with your company branding. When the client accepts, update the status to "Accepted".
          </p>

          <div class="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p class="text-xs text-amber-700">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              <strong>Warning:</strong> Quote amounts are estimates. Actual URA duties may differ from estimates because the URA rate and CIF valuation can change between quoting and actual clearance. Always include a disclaimer in your quotes about potential duty variations.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 5 — CUSTOMERS                                         -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="customers" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-users text-blue-600"></i> 5. Customers
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            The Customers section maintains a central directory of all clients who have interacted with EzzyRide, whether through vehicle purchases, import applications, or website enquiries.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Managing Customer Profiles</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Each customer profile contains:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Full Name</strong> — The customer's legal name.</li>
            <li><strong>Email Address</strong> — Used for sending quotes, receipts, and communications.</li>
            <li><strong>Phone Number</strong> — Primary contact number (typically a Ugandan mobile number).</li>
            <li><strong>Alternative Phone</strong> — A secondary contact number.</li>
            <li><strong>Address</strong> — Physical address for delivery and documentation purposes.</li>
            <li><strong>National ID / Passport</strong> — Required for URA customs clearance and vehicle registration.</li>
            <li><strong>TIN</strong> — Tax Identification Number, needed for certain URA processes.</li>
            <li><strong>Notes</strong> — Free-text field for any additional information about the customer.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Linking Customers to Vehicles</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When a vehicle is sold, the customer is linked to it through the Sale record on the vehicle's Client tab. This creates a permanent association between the customer and the vehicle. You can view all vehicles a customer has purchased from their profile page.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Linking Customers to Import Applications</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Every import application is associated with a customer. When creating an application, you select the customer (or create a new one). The customer's profile page shows all their import applications with current statuses, making it easy to see a complete picture of a client's engagement with your business.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Viewing Customer History</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Open any customer profile to see their complete history:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Vehicles</strong> — All vehicles purchased by this customer.</li>
            <li><strong>Import Applications</strong> — All import requests, with status and timeline.</li>
            <li><strong>Transactions</strong> — All payments made by or refunded to this customer.</li>
            <li><strong>Enquiries</strong> — Website enquiries submitted by this customer.</li>
          </ul>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Tip:</strong> Use the search bar on the Customers page to quickly find a customer by name, email, or phone number. The search works across all fields.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 6 — PARTNER INTEGRATIONS                              -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="partner-integrations" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-handshake text-blue-600"></i> 6. Partner Integrations
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            Partners are external vehicle suppliers who provide inventory to your platform. EzzyRide supports two types of partners, each with different pricing and display logic on the public website.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">International Partners</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            International partners supply vehicles from abroad (typically Japan, Dubai, UK, or Thailand). Their vehicles are priced in USD at the CIF (Cost, Insurance, Freight) level. When displayed on the public website, the system automatically:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li>Shows the CIF price in USD.</li>
            <li>Converts the CIF price to UGX using the configured market rate.</li>
            <li>Provides a "Calculate Tax" button that estimates URA import duties using the tax calculator.</li>
            <li>Shows a total estimated landing cost (CIF in UGX + estimated duties + service fee).</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Local Partners</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Local partners are dealers or individuals within Uganda. Their vehicles are priced directly in UGX. The website displays:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li>The selling price in UGX as provided by the partner.</li>
            <li>A sourcing fee that EzzyRide charges for facilitating the transaction.</li>
            <li>No tax calculator (since the vehicle is already in Uganda and duties have been paid).</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">How Partner Sync Works</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Partners with API integrations can automatically sync their vehicle inventories into EzzyRide. The sync process:
          </p>
          <ol class="text-sm text-gray-600 space-y-2 ml-6 list-decimal mb-4">
            <li><strong>Connects to the partner's API</strong> — Using the configured API credentials (base URL, API key, or authentication tokens).</li>
            <li><strong>Fetches vehicle data</strong> — Pulls the partner's current inventory listing.</li>
            <li><strong>Applies field mapping</strong> — Maps the partner's data fields to EzzyRide's vehicle fields. For example, the partner may call the field "make" while EzzyRide uses "brand".</li>
            <li><strong>Applies value mapping</strong> — Translates partner-specific values to EzzyRide values. For example, the partner may use "AT" for automatic transmission while EzzyRide expects "automatic".</li>
            <li><strong>Creates or updates vehicles</strong> — New vehicles are created, existing ones are updated, and vehicles no longer in the partner's inventory can optionally be unpublished.</li>
          </ol>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Field Mapping</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Field mapping defines how the partner's API fields correspond to EzzyRide vehicle fields. Each mapping entry specifies:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Partner Field</strong> — The field name in the partner's API response (e.g., "make", "model_name", "price_fob").</li>
            <li><strong>EzzyRide Field</strong> — The corresponding field in EzzyRide (e.g., "brand", "model", "cif_price").</li>
            <li><strong>Transform</strong> — Optional transformation rules (e.g., extract year from a date string, convert units).</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Value Mapping</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Value mapping translates specific data values from the partner's system to EzzyRide's expected values. Common use cases:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Transmission</strong> — "AT" or "A/T" mapped to "automatic", "MT" or "M/T" mapped to "manual".</li>
            <li><strong>Fuel Type</strong> — "G" mapped to "petrol", "D" mapped to "diesel".</li>
            <li><strong>Drive Type</strong> — "4x4" mapped to "4WD", "4x2" mapped to "2WD".</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Feature Detection</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Some partner APIs include feature information in unstructured text fields (e.g., a description or equipment list). The feature detection system scans these fields for keywords and automatically assigns matching EzzyRide features. For example, if a partner's description mentions "sunroof" or "power steering", those features are automatically added to the vehicle.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Payment Terms</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Each partner integration can have configured payment terms that define:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li>Currency (USD, JPY, GBP, etc.).</li>
            <li>Payment method (wire transfer, escrow, etc.).</li>
            <li>Deposit requirements and timeline.</li>
            <li>Balance payment deadline relative to purchase confirmation.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Purchase Callbacks</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When a customer on the EzzyRide website decides to purchase a partner vehicle, the system can send a purchase callback to the partner's API to reserve or initiate the purchase. The callback includes the vehicle reference, customer details (if authorized), and the agreed price. The partner's system responds with a confirmation or rejection, which is recorded in the application.
          </p>

          <div class="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p class="text-xs text-amber-700">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              <strong>Warning:</strong> If a partner callback fails (network error, partner API down), the system logs the failure and flags the transaction. You should manually follow up with the partner to confirm the purchase status and retry the callback from the partner integration page.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 7 — TAX CALCULATOR & VALUATIONS                       -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="tax-calculator" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-calculator text-blue-600"></i> 7. Tax Calculator & Valuations
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            Uganda Revenue Authority (URA) imposes import duties on vehicles entering the country. Estimating these duties accurately is critical for quoting clients and pricing vehicles. EzzyRide provides a built-in tax calculator powered by official URA valuation data.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">How URA Valuations Work</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            URA publishes vehicle valuation tables that specify the CIF (Cost, Insurance, Freight) value for thousands of vehicle makes, models, and years. These valuations are the baseline that URA uses to calculate import duties. Even if you purchased a vehicle for less than the URA valuation, URA will use their valuation figure (or the actual invoice, whichever is higher) for duty calculation.
          </p>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Each valuation record contains:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Vehicle Name</strong> — Brand and model as classified by URA.</li>
            <li><strong>Model</strong> — Specific variant.</li>
            <li><strong>Year</strong> — Manufacturing year.</li>
            <li><strong>HSC (Harmonized System Code)</strong> — The tariff classification code.</li>
            <li><strong>Origin</strong> — Country of manufacture.</li>
            <li><strong>CC</strong> — Engine capacity in cubic centimetres.</li>
            <li><strong>Unit</strong> — Unit of measurement (typically "Unit").</li>
            <li><strong>CIF</strong> — The assessed CIF value in USD.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Importing Valuation Batches</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            URA publishes updated valuations periodically. To import a new batch:
          </p>
          <ol class="text-sm text-gray-600 space-y-2 ml-6 list-decimal mb-4">
            <li>Navigate to <strong>Valuations</strong> in the backoffice.</li>
            <li>Click <strong>"Import Batch"</strong>.</li>
            <li>Enter a <strong>title</strong> for the batch (e.g., "URA Q1 2026 Review") and the <strong>review date</strong>.</li>
            <li>Upload the Excel file containing the valuation data. The file should follow URA's standard format with columns for name, model, year, HSC, origin, CC, unit, and CIF.</li>
            <li>The system processes the file and adds all records to the new batch.</li>
          </ol>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            You can have multiple batches in the system. Use the batch filter on the Valuations page to view records from a specific batch. The tax calculator uses the most recent batch by default.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">How the Tax Calculator Uses Valuations</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When a user (staff or website visitor) enters a vehicle's details into the tax calculator, the system:
          </p>
          <ol class="text-sm text-gray-600 space-y-2 ml-6 list-decimal mb-4">
            <li>Searches the latest valuation batch for a matching record based on brand, model, year, and engine CC.</li>
            <li>Takes the CIF value from the valuation (or uses the user-provided CIF if higher).</li>
            <li>Converts the CIF from USD to UGX using the <strong>market rate</strong> (configured in Settings as <code>cif_usd_rate</code>).</li>
            <li>Calculates import duties using the <strong>URA rate</strong> (configured in Tax Settings). Duties typically include: Import Duty (25%), VAT (18%), Withholding Tax (6%), Infrastructure Levy (2%), and Environmental Levy (varies by age and engine size).</li>
            <li>Displays a detailed breakdown of all duty components and the total estimated tax.</li>
          </ol>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">The Two USD Rates: Market Rate vs URA Rate</h3>
          <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <p class="text-sm text-blue-800 font-medium mb-2">
              <i class="fa-solid fa-circle-info mr-1"></i> Why are there two rates?
            </p>
            <p class="text-xs text-blue-700 leading-relaxed mb-2">
              <strong>Market Rate (CIF USD Rate)</strong> — This is the current open-market exchange rate for USD to UGX. It is used to show customers the approximate UGX equivalent of a vehicle's CIF price. This rate is configured in <strong>Settings &gt; Currencies</strong> and should be updated regularly to reflect current market conditions.
            </p>
            <p class="text-xs text-blue-700 leading-relaxed">
              <strong>URA Rate</strong> — This is the exchange rate that URA uses for calculating import duties. URA sets their own rate (published on the URA website), which may differ from the market rate. This rate is configured in <strong>Tax Settings</strong> and affects the duty calculation in the tax calculator.
            </p>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            For example, the market rate might be 3,750 UGX/USD while the URA rate could be 3,700 UGX/USD. The CIF conversion on vehicle listings uses the market rate (what the customer actually pays), while the duty calculation uses the URA rate (what URA bases their assessment on).
          </p>

          <div class="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p class="text-xs text-amber-700">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              <strong>Warning:</strong> Both rates should be updated regularly. Outdated rates will lead to inaccurate pricing on the website and incorrect duty estimates. Check the Bank of Uganda and URA websites weekly for the latest rates.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 8 — SETTINGS                                          -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="settings" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-cog text-blue-600"></i> 8. Settings
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            The Settings page is organized into tabs that cover every aspect of your business configuration. Only users with the <code>settings</code> permission can access this page.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Company Information</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Set your business identity:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Company Name</strong> — Displayed in the website header, emails, quotes, and receipts.</li>
            <li><strong>Address</strong> — Your physical business location.</li>
            <li><strong>Phone & Email</strong> — Primary contact details shown on the website footer and in communications.</li>
            <li><strong>Logo</strong> — Uploaded and used across the website, quotes, invoices, and email templates.</li>
            <li><strong>About Text</strong> — A short description of your business, shown on the website's About section.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Business Hours</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Configure your operating hours for each day of the week. These are displayed on the public website so customers know when they can visit or call. You can mark specific days as closed (e.g., Sunday).
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Social Media</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Add links to your social media profiles (Facebook, Instagram, Twitter/X, YouTube, TikTok, WhatsApp). These appear as icons in the website footer and help customers connect with you on their preferred platforms.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Import Pricing (Service Fees)</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Define the service fees EzzyRide charges for each import service type:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Full Import Fee</strong> — The fee charged for end-to-end import service.</li>
            <li><strong>Sourcing Fee</strong> — The fee for vehicle sourcing assistance only.</li>
            <li><strong>Mombasa Clearance Fee</strong> — The fee for customs clearance and transport from Mombasa.</li>
            <li><strong>Consultation Fee</strong> — The fee for advisory/consultation services.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            These fees are used as defaults when generating quotes for import applications. They can be overridden on a per-application basis.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Payment Details</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Configure the payment methods your business accepts:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Bank Account</strong> — Bank name, account name, account number, branch, and SWIFT code.</li>
            <li><strong>Mobile Money</strong> — Provider (MTN, Airtel), name on account, and phone number.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            These details are included in quotes and invoices sent to clients, ensuring they know exactly where to send payments.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Currency Rates</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Manage the exchange rates used throughout the platform:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>CIF USD Rate</strong> — The market rate for converting USD CIF prices to UGX. Used on the website for displaying prices and in import quotes.</li>
            <li><strong>JPY Rate</strong> — Japanese Yen to USD conversion (if dealing with Japanese auction houses that price in JPY).</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Roles & Permissions</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Create and manage roles that define what each staff member can access. Permissions are grouped by module (vehicles, imports, customers, settings, etc.). Each permission controls a specific action:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>View</strong> — Can see the data in the module.</li>
            <li><strong>Create</strong> — Can add new records.</li>
            <li><strong>Edit</strong> — Can modify existing records.</li>
            <li><strong>Delete</strong> — Can remove records.</li>
            <li><strong>Export</strong> — Can download data as Excel or CSV.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Toggle individual permissions for each role using the checkboxes in the permissions matrix. Changes are saved per role.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Audit Log</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The audit log records every significant action taken in the backoffice: who did what, when, and what changed. This includes vehicle edits, status changes, payment recordings, user invitations, settings modifications, and more. The audit log is read-only and cannot be deleted, providing a tamper-proof record of all activities.
          </p>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Tip:</strong> Review the audit log periodically to monitor team activity and catch any unauthorized changes early. Filter by user, action type, or date range to narrow down specific events.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 9 — USERS & SECURITY                                  -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="users-security" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-shield-halved text-blue-600"></i> 9. Users & Security
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            Manage who has access to the backoffice and what they can do. Security features protect your data and ensure only authorized personnel can access sensitive information.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Inviting Users</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            To add a new team member:
          </p>
          <ol class="text-sm text-gray-600 space-y-2 ml-6 list-decimal mb-4">
            <li>Navigate to <strong>Users</strong> in the sidebar.</li>
            <li>Click <strong>"Invite User"</strong>.</li>
            <li>Enter the person's name, email address, phone number, and select a role.</li>
            <li>Click <strong>"Send Invitation"</strong>.</li>
            <li>The user receives an email with a link to set their password and activate their account.</li>
          </ol>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The invitation email expires after 48 hours. If the user does not activate in time, you can resend the invitation from the Users page.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Roles</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            EzzyRide comes with three default roles:
          </p>
          <div class="overflow-x-auto mb-4">
            <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">Role</th>
                  <th class="text-left px-4 py-2 font-medium text-gray-700 border-b">Access Level</th>
                </tr>
              </thead>
              <tbody class="text-gray-600">
                <tr class="border-b">
                  <td class="px-4 py-2 font-medium">Super Admin</td>
                  <td class="px-4 py-2">Full access to everything. Can manage users, roles, and all settings. Can unlock locked accounts. Can view the audit log. This role cannot be modified or deleted.</td>
                </tr>
                <tr class="border-b">
                  <td class="px-4 py-2 font-medium">Admin</td>
                  <td class="px-4 py-2">Full access to vehicles, imports, customers, transactions, and most settings. Cannot manage roles or view the full audit log. Can invite and manage staff users.</td>
                </tr>
                <tr>
                  <td class="px-4 py-2 font-medium">Staff</td>
                  <td class="px-4 py-2">Limited access based on assigned permissions. Typically can view and create vehicles, manage import applications, and handle customer enquiries. Cannot access settings or user management.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            You can create additional custom roles from <strong>Settings &gt; Roles & Permissions</strong> to match your team's structure. For example, you might create a "Sales" role with access to vehicles and customers but not imports, or an "Import Officer" role with full import access but limited vehicle editing.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Two-Factor Authentication (2FA)</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Two-factor authentication adds an extra layer of security to user accounts. When enabled, users must enter a time-based one-time password (TOTP) from an authenticator app (such as Google Authenticator, Authy, or Microsoft Authenticator) in addition to their password.
          </p>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            To enable 2FA:
          </p>
          <ol class="text-sm text-gray-600 space-y-2 ml-6 list-decimal mb-4">
            <li>Go to your <strong>Profile</strong> page (click your name in the top-right corner).</li>
            <li>Find the <strong>"Two-Factor Authentication"</strong> section.</li>
            <li>Click <strong>"Enable 2FA"</strong>.</li>
            <li>Scan the QR code with your authenticator app.</li>
            <li>Enter the 6-digit code from the app to confirm setup.</li>
            <li>Save the recovery codes in a secure location. These are one-time-use codes that let you log in if you lose access to your authenticator app.</li>
          </ol>

          <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
            <p class="text-xs text-amber-700">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              <strong>Warning:</strong> If you lose your authenticator device and your recovery codes, you will be locked out of your account. A Super Admin can disable 2FA on your account to restore access, but this should be a last resort.
            </p>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Account Lockout</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            To protect against brute-force attacks, accounts are automatically locked after <strong>5 consecutive failed login attempts</strong>. When an account is locked:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li>The user sees a message indicating their account has been locked and to contact an administrator.</li>
            <li>No further login attempts are accepted until the account is unlocked.</li>
            <li>An email notification is sent to all Super Admins alerting them of the locked account.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            To unlock an account, a Super Admin or Admin goes to <strong>Users</strong>, finds the locked user, and clicks <strong>"Unlock Account"</strong>. The user can then log in with their correct password. The failed attempt counter resets after a successful login.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Password Requirements</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            All passwords must meet the following minimum requirements:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li>At least <strong>8 characters</strong> long.</li>
            <li>Contains at least one <strong>uppercase letter</strong>.</li>
            <li>Contains at least one <strong>lowercase letter</strong>.</li>
            <li>Contains at least one <strong>number</strong>.</li>
            <li>Contains at least one <strong>special character</strong> (e.g., @, #, $, !, %).</li>
          </ul>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Tip:</strong> Encourage all team members to enable 2FA, especially those with Admin or Super Admin roles. It significantly reduces the risk of unauthorized access even if a password is compromised.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 10 — WEBSITE FEATURES                                 -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="website-features" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-globe text-blue-600"></i> 10. Website Features
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            The public EzzyRide website is where customers browse, enquire, and initiate purchases. Understanding how the website works helps you optimize your listings and respond to customer actions.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Vehicle Listings</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The main vehicle listings page shows all published vehicles in a responsive grid. Customers can filter by:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Brand</strong> — Toyota, Nissan, Mercedes-Benz, etc.</li>
            <li><strong>Category</strong> — SUV, Sedan, Pickup, etc.</li>
            <li><strong>Price Range</strong> — Minimum and maximum price.</li>
            <li><strong>Year Range</strong> — From year to year.</li>
            <li><strong>Transmission</strong> — Automatic or manual.</li>
            <li><strong>Fuel Type</strong> — Petrol, diesel, hybrid, electric.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Each vehicle card in the listing shows the primary image, brand, model, year, key specs (engine, transmission, mileage), price, and status badge. Partner vehicles are identified with the partner's name.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Vehicle Detail Pages</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Clicking a vehicle opens its full detail page, which includes:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Image Gallery</strong> — All uploaded photos in a swipeable/clickable gallery.</li>
            <li><strong>Specifications</strong> — Full technical details: engine CC, fuel type, transmission, drive type, mileage, colour, VIN (partially masked for security).</li>
            <li><strong>Features</strong> — List of all features with icons (e.g., sunroof, leather seats, navigation).</li>
            <li><strong>Description</strong> — The rich-text description written by the seller.</li>
            <li><strong>Pricing Panel</strong> — Shows the price with currency conversion details (for international partner vehicles) or the direct UGX price (for local vehicles).</li>
            <li><strong>Action Buttons</strong> — "Enquire Now", "Calculate Tax", "Request Import Assistance".</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">CIF Pricing for International Partners</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            For vehicles from international partners, the detail page displays a pricing breakdown:
          </p>
          <div class="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm text-gray-600">
            <div class="flex justify-between"><span>CIF Price (USD)</span><span class="font-medium">$8,500</span></div>
            <div class="flex justify-between"><span>CIF Price (UGX) <span class="text-xs text-gray-400">@ 3,750</span></span><span class="font-medium">UGX 31,875,000</span></div>
            <div class="flex justify-between text-blue-600"><span>Estimated Duties</span><span class="font-medium cursor-pointer underline">Calculate Tax</span></div>
            <hr class="border-gray-200">
            <div class="flex justify-between"><span>Service Fee</span><span class="font-medium">UGX 2,500,000</span></div>
            <div class="flex justify-between font-bold text-gray-800"><span>Estimated Total</span><span>UGX 34,375,000+</span></div>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The "Calculate Tax" link opens the tax calculator modal where the customer can see the full duty breakdown based on the vehicle's URA valuation.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Tax Calculator Modal</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Available on both the standalone tax calculator page and within vehicle detail pages, this modal lets customers estimate import duties. It pre-fills the vehicle's details (brand, model, year, engine CC) and calculates duties based on URA valuations. The breakdown shows each duty component (Import Duty, VAT, Withholding Tax, Infrastructure Levy, Environmental Levy) and the total.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Purchase Flow — Three Paths</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When a customer decides to buy, the flow depends on the vehicle source:
          </p>
          <div class="space-y-3 mb-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm font-medium text-gray-800 mb-1">
                <i class="fa-solid fa-globe text-indigo-500 mr-2"></i>Path 1: International Partner Vehicle
              </p>
              <p class="text-xs text-gray-600 leading-relaxed">
                The customer expresses interest, and EzzyRide creates an import application. The vehicle is reserved with the partner (via purchase callback if available). The customer pays a deposit, and the full import process begins. The tax calculator helps estimate the total cost upfront. EzzyRide manages the entire import process and charges the service fee.
              </p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm font-medium text-gray-800 mb-1">
                <i class="fa-solid fa-map-marker-alt text-emerald-500 mr-2"></i>Path 2: Local Partner Vehicle
              </p>
              <p class="text-xs text-gray-600 leading-relaxed">
                The customer sees the UGX price plus the sourcing fee. They contact EzzyRide through the enquiry form or phone. EzzyRide coordinates with the local partner to arrange viewing, negotiation, and purchase. The sourcing fee is charged on top of the partner's price.
              </p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-sm font-medium text-gray-800 mb-1">
                <i class="fa-solid fa-building text-blue-500 mr-2"></i>Path 3: Direct Sale (EzzyRide Stock)
              </p>
              <p class="text-xs text-gray-600 leading-relaxed">
                For vehicles owned directly by EzzyRide, the customer sees the selling price in UGX. They can enquire, negotiate, and purchase directly. The sale is recorded in the vehicle's Client tab. No separate import process is needed since the vehicle is already in Uganda.
              </p>
            </div>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Enquiry Forms</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Every vehicle page has an enquiry form where visitors can submit their name, phone number, email, and a message expressing interest. These enquiries appear in the backoffice under <strong>Inquiries</strong> and also in the vehicle's Enquiries tab. Unread enquiries increment the counter on the dashboard.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Import Assistance Form</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The website has a dedicated "Import Assistance" page where customers who want to import a specific vehicle can submit a request. They provide details about the vehicle they want (brand, model, year, budget, preferred source country) and their contact information. This creates an import application in <strong>Enquiry</strong> status in the backoffice.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Order Tracking</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Customers with active import applications can track their order status on the website. Using their reference number and email, they can see the current stage of their import (sourcing, purchased, shipped, etc.) and any status updates the team has posted. This reduces support calls and keeps customers informed.
          </p>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Tip:</strong> Ensure all published vehicles have high-quality images and complete specifications. Listings with multiple photos and detailed descriptions receive significantly more enquiries than minimal listings.
            </p>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 11 — TRANSACTIONS & FINANCIAL TRACKING                -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="transactions" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-money-bill-wave text-blue-600"></i> 11. Transactions & Financial Tracking
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            EzzyRide provides comprehensive financial tracking across vehicle sales and import applications. Every payment in or out is recorded, categorized, and linked to the relevant vehicle or application.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Vehicle Sale Payments</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When a vehicle is sold, payments are recorded in the vehicle's Transactions tab:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Reservation Deposit</strong> — The initial deposit paid to reserve the vehicle.</li>
            <li><strong>Installments</strong> — Subsequent payments if the customer is paying in stages.</li>
            <li><strong>Balance Payment</strong> — The final payment that completes the purchase.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Each payment record includes the date, amount, payment method (bank transfer, mobile money, cash), reference number, and any notes. The system tracks the total paid versus the agreed sale price and highlights the remaining balance.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Import Application Payments</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Import applications track two types of financial records:
          </p>
          <div class="space-y-3 mb-4">
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-arrow-down text-green-500 mr-2"></i>Client Payments (Inflows)</p>
              <p class="text-xs text-gray-600 mt-1">Money received from the client: deposits, progress payments, and final settlement. Each payment is logged with method, reference, date, and amount.</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm font-medium text-gray-800"><i class="fa-solid fa-arrow-up text-red-500 mr-2"></i>Expenses (Outflows)</p>
              <p class="text-xs text-gray-600 mt-1">Money spent by EzzyRide on the import: vehicle purchase price, shipping costs, insurance, port charges, URA duties, clearing agent fees, transport costs, and miscellaneous expenses. Each expense is categorized and documented.</p>
            </div>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Receipts & Invoices</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The system can generate receipts for client payments and invoices for outstanding balances. These documents are branded with your company logo and details (configured in Settings) and can be downloaded as PDFs or sent directly to the client's email. Each receipt/invoice has a unique number for record-keeping.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Financial Summary in Import Applications</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Every import application has a financial summary card that provides a snapshot:
          </p>
          <div class="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
            <div class="flex justify-between text-gray-600"><span>Quote Amount</span><span class="font-medium">UGX 85,000,000</span></div>
            <div class="flex justify-between text-green-600"><span>Total Payments</span><span class="font-medium">UGX 60,000,000</span></div>
            <div class="flex justify-between text-red-600"><span>Total Expenses</span><span class="font-medium">UGX 52,000,000</span></div>
            <hr class="border-gray-200">
            <div class="flex justify-between text-amber-600"><span>Client Balance Due</span><span class="font-medium">UGX 25,000,000</span></div>
            <div class="flex justify-between text-gray-800 font-bold"><span>Net Profit</span><span>UGX 8,000,000</span></div>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            This summary updates in real time as you add payments and expenses, giving you instant visibility into the financial health of each import.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">Transactions List</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            The global <strong>Transactions</strong> page in the sidebar aggregates all financial transactions across vehicles and import applications. You can filter by:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li><strong>Type</strong> — Vehicle payment, import payment, expense.</li>
            <li><strong>Date Range</strong> — Filter transactions within a specific period.</li>
            <li><strong>Customer</strong> — View all transactions for a specific client.</li>
            <li><strong>Payment Method</strong> — Bank transfer, mobile money, cash.</li>
          </ul>
          <p class="text-sm text-gray-600 leading-relaxed">
            This centralized view is especially useful for accounting reconciliation and financial reporting.
          </p>
        </section>

        <!-- ════════════════════════════════════════════════════════════════ -->
        <!--  CHAPTER 12 — TIPS & BEST PRACTICES                            -->
        <!-- ════════════════════════════════════════════════════════════════ -->
        <section id="tips" class="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <i class="fa-solid fa-lightbulb text-blue-600"></i> 12. Tips & Best Practices
          </h2>

          <p class="text-sm text-gray-600 leading-relaxed mb-4">
            Follow these best practices to get the most out of EzzyRide and maintain a smooth operation.
          </p>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">
            <i class="fa-solid fa-database text-gray-400 mr-2"></i>Regular Data Backups
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            While the platform automatically backs up data, it is good practice to periodically export critical data:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li>Export your vehicle inventory to Excel monthly as a local backup.</li>
            <li>Download financial reports at the end of each month.</li>
            <li>Keep copies of all uploaded documents (import papers, receipts) in your own file storage system as well.</li>
            <li>Export customer data quarterly for offline backup.</li>
          </ul>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">
            <i class="fa-solid fa-sync text-gray-400 mr-2"></i>Keeping Valuations Up to Date
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            URA revises vehicle valuations periodically. Outdated valuations lead to inaccurate tax estimates, which can erode client trust and cause quoting problems:
          </p>
          <ul class="text-sm text-gray-600 space-y-1 ml-6 list-disc mb-4">
            <li>Check the URA website for new valuation publications at least once a month.</li>
            <li>Import new batches as soon as they are available.</li>
            <li>After importing a new batch, spot-check a few popular vehicles (e.g., Toyota Harrier, Nissan X-Trail) to verify the data imported correctly.</li>
            <li>Update both the market rate and URA rate simultaneously to maintain consistency.</li>
          </ul>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Tip:</strong> Set a recurring calendar reminder to check for URA valuation updates on the 1st and 15th of each month.
            </p>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">
            <i class="fa-solid fa-clipboard-check text-gray-400 mr-2"></i>Publishing Checklist Before Going Live
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            Before publishing a vehicle to the website, verify:
          </p>
          <div class="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-regular fa-square text-gray-300 w-5 text-center"></i>
              <span>At least 5 high-quality photos uploaded (exterior front, rear, sides, interior, dashboard).</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-regular fa-square text-gray-300 w-5 text-center"></i>
              <span>All key specifications filled in (brand, model, year, engine CC, transmission, fuel type, mileage).</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-regular fa-square text-gray-300 w-5 text-center"></i>
              <span>Selling price is set and reasonable for the market.</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-regular fa-square text-gray-300 w-5 text-center"></i>
              <span>Features are selected (customers filter by features, so completeness matters).</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-regular fa-square text-gray-300 w-5 text-center"></i>
              <span>Description is written in clear English with no placeholder text.</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-regular fa-square text-gray-300 w-5 text-center"></i>
              <span>Status is set to "Available" (or "In Transit" for coming-soon listings).</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <i class="fa-regular fa-square text-gray-300 w-5 text-center"></i>
              <span>Category is assigned (affects filtering on the website).</span>
            </div>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">
            <i class="fa-solid fa-handshake text-gray-400 mr-2"></i>Partner Onboarding Workflow
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When adding a new partner integration, follow this sequence:
          </p>
          <ol class="text-sm text-gray-600 space-y-2 ml-6 list-decimal mb-4">
            <li><strong>Create the partner</strong> — Add the partner profile with their company name, type (international/local), country, and contact details.</li>
            <li><strong>Configure API connection</strong> — Enter the partner's API base URL, authentication credentials, and test the connection.</li>
            <li><strong>Set up field mapping</strong> — Map the partner's data fields to EzzyRide fields. Use the partner's API documentation as reference.</li>
            <li><strong>Set up value mapping</strong> — Map transmission codes, fuel type codes, and other enumerated values.</li>
            <li><strong>Configure feature detection</strong> — Define keywords that should trigger automatic feature assignment.</li>
            <li><strong>Set payment terms</strong> — Define the currency, payment method, deposit requirements, and timelines.</li>
            <li><strong>Run a test sync</strong> — Sync a small batch of vehicles and review the results. Check that fields are mapped correctly, images load properly, and prices are accurate.</li>
            <li><strong>Go live</strong> — Enable automatic sync scheduling and publish the partner's vehicles.</li>
          </ol>

          <div class="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
            <p class="text-xs text-amber-700">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              <strong>Warning:</strong> Always run a test sync with a small batch before enabling full sync. Incorrect field mappings can create hundreds of vehicles with wrong data, which is time-consuming to clean up.
            </p>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">
            <i class="fa-solid fa-rotate text-gray-400 mr-2"></i>Handling Rejected Partner Callbacks
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-3">
            When a purchase callback to a partner fails or is rejected, take these steps:
          </p>
          <ol class="text-sm text-gray-600 space-y-2 ml-6 list-decimal mb-4">
            <li><strong>Check the error reason</strong> — Open the partner integration page and review the callback log. Common reasons include: vehicle already sold, price changed, API authentication expired, or network timeout.</li>
            <li><strong>Contact the partner</strong> — If the vehicle is still available, coordinate directly via email or phone to confirm the reservation.</li>
            <li><strong>Retry the callback</strong> — If the issue was a temporary network error, click "Retry" on the failed callback. The system will attempt to send the request again.</li>
            <li><strong>Update the customer</strong> — If the vehicle is no longer available, promptly inform the customer and offer alternatives.</li>
            <li><strong>Update the application</strong> — Adjust the import application status and notes to reflect the current situation.</li>
          </ol>

          <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-2">
            <i class="fa-solid fa-star text-gray-400 mr-2"></i>General Tips
          </h3>
          <ul class="text-sm text-gray-600 space-y-2 ml-6 list-disc mb-4">
            <li><strong>Respond to enquiries quickly.</strong> Customers who enquire are actively looking to buy. Aim to respond within 1 hour during business hours.</li>
            <li><strong>Keep vehicle statuses current.</strong> If a vehicle is sold, update the status immediately. Stale "available" listings frustrate customers.</li>
            <li><strong>Use the notes field.</strong> Vehicles, customers, and import applications all have notes fields. Use them to record verbal agreements, special requests, or context that might be useful later.</li>
            <li><strong>Document everything in import applications.</strong> Upload every receipt, email confirmation, and tracking number. This protects both you and the client if disputes arise.</li>
            <li><strong>Review the audit log weekly.</strong> It takes only a few minutes and helps you catch errors or unauthorized changes early.</li>
            <li><strong>Train new staff before giving access.</strong> Walk new team members through this Knowledge Center and have them shadow an experienced user before they handle live data.</li>
            <li><strong>Update rates on Monday mornings.</strong> Exchange rates fluctuate throughout the week. A Monday update ensures your website pricing is accurate for the coming week.</li>
            <li><strong>Archive sold vehicles.</strong> Once a sale is complete and all payments are settled, archive the vehicle to keep your active inventory clean and focused.</li>
          </ul>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-circle-info mr-1"></i>
              <strong>Final Tip:</strong> EzzyRide is continuously improving. New features and improvements are released regularly. Check back on this Knowledge Center periodically for updated documentation as new capabilities are added.
            </p>
          </div>
        </section>

        <!-- ── Back to Top ──────────────────────────────────────────────── -->
        <div class="text-center pb-8">
          <button
            @click="scrollTo('getting-started')"
            class="text-sm text-gray-400 hover:text-blue-600 transition-colors"
          >
            <i class="fa-solid fa-arrow-up mr-1"></i> Back to top
          </button>
        </div>

      </main>
    </div>
  </div>
</template>
