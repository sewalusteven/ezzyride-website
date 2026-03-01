<script setup lang="ts">
useSeoMeta({
  title: 'About Us | EzzyRide Uganda',
  description: 'Learn about EzzyRide Uganda — your trusted partner for premium Japanese vehicle imports. Our story, mission, and values.',
})

const stats = [
  { value: '100%', label: 'Transparent Pricing' },
  { value: '0',    label: 'Hidden Fees' },
  { value: '6–10', label: 'Weeks Avg. Import' },
  { value: '24hr', label: 'Response Time' },
]

const values = [
  {
    icon: 'fa-solid fa-handshake',
    title: 'Integrity',
    desc: 'We are honest and transparent in every interaction. You always know exactly what you are paying for and why.',
  },
  {
    icon: 'fa-solid fa-star',
    title: 'Excellence',
    desc: 'From vehicle inspection to doorstep delivery, we maintain the highest standards at every step.',
  },
  {
    icon: 'fa-solid fa-users',
    title: 'Client First',
    desc: 'Your goals drive everything we do. We take time to understand your needs before making any recommendation.',
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Reliability',
    desc: 'We follow through on every commitment. When we give you a timeline or a cost estimate, we stick to it.',
  },
]

const team = [
  {
    name: 'The EzzyRide Team',
    title: 'Import Specialists',
    desc: 'Our team brings together decades of combined experience in vehicle importation, customs clearance, and client service across Uganda and East Africa.',
    icon: 'fa-solid fa-users',
  },
]

const process = [
  { num: 1, title: 'Consultation', desc: 'We understand your needs, budget, and timeline — then recommend the best approach.' },
  { num: 2, title: 'Sourcing', desc: 'We access major Japanese auction houses to find the perfect vehicle at the right price.' },
  { num: 3, title: 'Purchasing & Inspection', desc: 'We purchase the vehicle on your behalf and conduct a thorough pre-shipment inspection.' },
  { num: 4, title: 'Shipping & Clearance', desc: 'We handle international shipping, Mombasa port clearance, and all URA documentation.' },
  { num: 5, title: 'Delivery', desc: 'Your vehicle is driven or transported to your preferred location in Uganda.' },
]
</script>

<template>
  <div class="font-roboto text-gray-800">

    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="relative pt-24 pb-16 bg-secondary overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-accent/50"></div>
      <div class="absolute inset-0 opacity-10" style="background-image:url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1600&auto=format&fit=crop'); background-size:cover; background-position:center;"></div>
      <div class="container mx-auto px-4 relative z-10 text-center text-white">
        <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-1.5 rounded-full mb-5">
          <i class="fa-solid fa-heart text-primary text-xs"></i> Our Story
        </div>
        <h1 class="text-4xl md:text-5xl font-bold font-montserrat mb-4">
          About <span class="text-primary">EzzyRide</span> Uganda
        </h1>
        <p class="text-gray-300 text-lg max-w-2xl mx-auto">
          Uganda's trusted partner for premium Japanese vehicle imports — combining expertise, transparency, and genuine care for every client.
        </p>
      </div>
    </section>

    <!-- ── Stats ──────────────────────────────────────────────────────────── -->
    <section class="bg-primary py-10">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 text-white text-center">
          <div v-for="stat in stats" :key="stat.label">
            <div class="text-4xl font-bold font-montserrat mb-1">{{ stat.value }}</div>
            <div class="text-white/80 text-sm">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Our Story ──────────────────────────────────────────────────────── -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div class="rounded-2xl overflow-hidden shadow-lg h-80">
            <img src="~/assets/images/aboutus.jpg" alt="EzzyRide Uganda" class="w-full h-full object-cover" />
          </div>
          <div>
            <div class="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <i class="fa-solid fa-book-open text-xs"></i> Our Story
            </div>
            <h2 class="text-3xl font-bold font-montserrat text-secondary mb-5">
              Building Trust, One Import at a Time
            </h2>
            <div class="space-y-4 text-gray-600 text-sm leading-relaxed">
              <p>
                EzzyRide was founded with a single mission: to make importing quality Japanese vehicles to Uganda straightforward, transparent, and stress-free. Too many Ugandans were losing money to opaque agents, unexpected charges, and unreliable timelines.
              </p>
              <p>
                We built a system that puts clients first — clear documentation, real-time status updates, and honest pricing. Every shilling you pay us goes into a detailed account; nothing is hidden.
              </p>
              <p>
                We're at the beginning of that journey — and we think that's worth saying. Every client we work with gets our full attention, not a ticket number. Whether you're importing your first car or building a fleet, you'll deal with real people who are invested in getting it right.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Mission / Vision / Values ─────────────────────────────────────── -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold font-montserrat text-secondary mb-3">What We Stand For</h2>
          <p class="text-gray-500 max-w-xl mx-auto">Our mission, vision, and the values that guide every decision we make</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-14">
          <div class="bg-white rounded-xl shadow-sm p-6 border-t-4 border-primary">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <i class="fa-solid fa-bullseye text-primary text-xl"></i>
            </div>
            <h3 class="font-bold text-secondary text-lg mb-3">Our Mission</h3>
            <p class="text-gray-600 text-sm leading-relaxed">To make quality Japanese vehicles accessible to every Ugandan through a transparent, reliable, and client-centred importation service.</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 border-t-4 border-accent">
            <div class="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <i class="fa-solid fa-eye text-accent text-xl"></i>
            </div>
            <h3 class="font-bold text-secondary text-lg mb-3">Our Vision</h3>
            <p class="text-gray-600 text-sm leading-relaxed">To be East Africa's most trusted vehicle import partner — known for honesty, quality, and delivering exactly what was promised, every time.</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6 border-t-4 border-secondary">
            <div class="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <i class="fa-solid fa-gem text-secondary text-xl"></i>
            </div>
            <h3 class="font-bold text-secondary text-lg mb-3">Our Promise</h3>
            <p class="text-gray-600 text-sm leading-relaxed">We will always tell you the truth — about vehicle condition, true costs, and realistic timelines. Your trust is worth more than any single transaction.</p>
          </div>
        </div>

        <!-- Values grid -->
        <div class="text-center mb-8">
          <h3 class="text-xl font-bold text-secondary">Core Values</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div v-for="v in values" :key="v.title" class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center">
            <div class="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i :class="v.icon" class="text-primary text-xl"></i>
            </div>
            <h4 class="font-semibold text-secondary mb-2">{{ v.title }}</h4>
            <p class="text-gray-500 text-sm">{{ v.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Our Process ────────────────────────────────────────────────────── -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold font-montserrat text-secondary mb-3">Our Import Process</h2>
          <p class="text-gray-500">From first conversation to your driveway — a clear, 5-step journey</p>
        </div>
        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100"></div>
          <div class="space-y-8">
            <div v-for="step in process" :key="step.num" class="flex gap-6 relative">
              <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold shrink-0 z-10 shadow-md">
                {{ step.num }}
              </div>
              <div class="flex-1 bg-gray-50 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <h3 class="font-semibold text-secondary mb-1">{{ step.title }}</h3>
                <p class="text-gray-600 text-sm">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>



  </div>
</template>
