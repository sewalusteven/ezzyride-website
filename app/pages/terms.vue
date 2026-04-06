<script setup lang="ts">
useSeoMeta({
  title: 'Terms & Conditions | EzzyRide Uganda',
  description: 'Read the Terms and Conditions governing your use of EzzyRide Uganda — vehicle marketplace, import assistance, and related services.',
  ogTitle: 'Terms & Conditions | EzzyRide Uganda',
  ogDescription: 'Terms and Conditions for EzzyRide Uganda vehicle marketplace and import assistance services.',
})

const lastUpdated = 'April 2026'

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: `
      <p>By accessing or using the EzzyRide Uganda website, mobile application, or any of our services (collectively, the "Services"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not access or use our Services.</p>
      <p>These Terms constitute a legally binding agreement between you ("User," "you," or "your") and EzzyRide Uganda ("EzzyRide," "we," "us," or "our"), a company registered and operating in Kampala, Uganda.</p>
      <p>Your continued use of the Services following the posting of any changes to these Terms constitutes acceptance of those changes. We encourage you to review these Terms periodically.</p>
    `,
  },
  {
    id: 'services',
    title: 'Description of Services',
    content: `
      <p>EzzyRide Uganda provides the following services through its platform:</p>
      <ul>
        <li><strong>Vehicle Marketplace:</strong> An online platform where users can browse, search, and inquire about vehicles available for purchase or import from Japan and other markets.</li>
        <li><strong>Import Assistance:</strong> Facilitation services to help users import vehicles from international markets to Uganda, including coordination with shipping agents, customs brokers, and logistics providers.</li>
        <li><strong>Tax Calculation Tools:</strong> Indicative calculators that estimate Uganda Revenue Authority (URA) import duties, taxes, and levies based on publicly available tax schedules. These calculations are provided for informational purposes only and do not constitute a guarantee of the final tax assessment.</li>
        <li><strong>Vehicle Valuations:</strong> Indicative market valuations based on available data. These are estimates and should not be relied upon as formal appraisals.</li>
        <li><strong>Partner Integrations:</strong> Connections to third-party vehicle dealers, auction houses, and logistics partners who provide vehicles and related services through our platform.</li>
      </ul>
      <p>We reserve the right to modify, suspend, or discontinue any aspect of our Services at any time without prior notice.</p>
    `,
  },
  {
    id: 'accounts',
    title: 'User Accounts and Responsibilities',
    content: `
      <p>Certain features of our Services may require you to create an account. When you create an account, you agree to:</p>
      <ul>
        <li>Provide accurate, current, and complete information during the registration process.</li>
        <li>Maintain and promptly update your account information to keep it accurate, current, and complete.</li>
        <li>Maintain the security and confidentiality of your login credentials and not share your account with any third party.</li>
        <li>Accept full responsibility for all activities that occur under your account.</li>
        <li>Notify us immediately of any unauthorised access to or use of your account.</li>
      </ul>
      <p>We reserve the right to suspend or terminate your account at our sole discretion if we reasonably believe that you have violated these Terms, provided false information, or engaged in fraudulent or unlawful activity.</p>
      <p>You must be at least 18 years of age to create an account and use our Services. By creating an account, you represent and warrant that you are at least 18 years old.</p>
    `,
  },
  {
    id: 'listings',
    title: 'Vehicle Listings and Accuracy of Information',
    content: `
      <p>We make reasonable efforts to ensure that vehicle listings on our platform are accurate and up to date. However, you acknowledge and agree that:</p>
      <ul>
        <li>Vehicle descriptions, specifications, photographs, mileage readings, condition reports, and pricing are provided by third-party sources (including partner dealers and auction houses) and may contain errors or omissions.</li>
        <li>Photographs may not accurately represent the current condition of a vehicle. Colours, features, and cosmetic details may vary from what is depicted.</li>
        <li>Vehicle availability is subject to change without notice. A vehicle listed on our platform may have already been sold or reserved by the time you submit an inquiry.</li>
        <li>Mileage figures are reported as provided by the source and may not always be independently verified by EzzyRide.</li>
        <li>EzzyRide does not guarantee the accuracy, completeness, or reliability of any vehicle listing information and shall not be held liable for any discrepancies.</li>
      </ul>
      <p>We strongly recommend that users conduct their own independent research and, where possible, arrange for an independent pre-purchase inspection before committing to a purchase.</p>
    `,
  },
  {
    id: 'purchase',
    title: 'Purchase Process',
    content: `
      <p>When you express interest in purchasing or importing a vehicle through EzzyRide, the following terms apply:</p>
      <ul>
        <li><strong>Reservations and Deposits:</strong> A reservation or deposit payment indicates your serious intent to proceed with a purchase. Deposits are subject to the specific terms communicated at the time of the transaction and may be non-refundable in certain circumstances as outlined in the applicable deposit agreement.</li>
        <li><strong>No Guarantee of Final Pricing:</strong> The total cost of importing a vehicle to Uganda is subject to multiple variables, including but not limited to: the vehicle purchase price, auction fees, shipping costs, insurance, port handling charges, URA duties and taxes, inspection fees, inland transport costs, and currency exchange fluctuations. While we provide estimates in good faith, the final total cost cannot be guaranteed until the import process is fully complete and all charges have been assessed.</li>
        <li><strong>Currency Fluctuations:</strong> Vehicle prices, shipping costs, and other fees may be denominated in foreign currencies (including but not limited to Japanese Yen and US Dollars). Exchange rate fluctuations between the time of quotation and the time of actual payment may affect the final cost in Ugandan Shillings. EzzyRide shall not be responsible for losses arising from currency fluctuations.</li>
        <li><strong>Completion of Purchase:</strong> A purchase is considered complete only when the vehicle has been fully paid for, all applicable taxes and duties have been settled, and the vehicle has been delivered to the agreed location in Uganda.</li>
      </ul>
    `,
  },
  {
    id: 'import',
    title: 'Import Assistance Services',
    content: `
      <p>EzzyRide acts as a <strong>facilitator and coordinator</strong> for vehicle import services. You acknowledge and agree that:</p>
      <ul>
        <li>EzzyRide is <strong>not a shipping company, customs broker, or freight forwarder</strong>. We coordinate with third-party service providers on your behalf to manage the import process.</li>
        <li>International shipping, port clearance, customs duties, vehicle inspection, and inland transportation are handled by independent third-party providers. EzzyRide is not directly responsible for delays, damages, or losses that occur during shipping or transit.</li>
        <li>Import timelines are estimates only. Actual delivery times may vary due to factors beyond our control, including but not limited to: shipping schedules, port congestion, customs processing times, regulatory changes, weather conditions, and force majeure events.</li>
        <li>All applicable URA duties, taxes, levies, and fees must be paid by the buyer. EzzyRide may assist in estimating these costs but does not accept liability for differences between estimated and actual amounts assessed by URA or other government agencies.</li>
        <li>It is the buyer's responsibility to ensure that the vehicle they wish to import complies with all applicable Ugandan laws and regulations, including age restrictions, emission standards, and roadworthiness requirements.</li>
        <li>EzzyRide will provide regular updates on the status of your import. However, we rely on information from third parties and cannot guarantee the real-time accuracy of all status updates.</li>
      </ul>
    `,
  },
  {
    id: 'payments',
    title: 'Payment Terms and Refund Policy',
    content: `
      <p>The following terms govern payments made through or in connection with EzzyRide services:</p>
      <ul>
        <li><strong>Payment Methods:</strong> We accept payments via mobile money, bank transfer, and such other methods as we may communicate from time to time. All payments must be made in the currency specified at the time of the transaction.</li>
        <li><strong>Payment Schedule:</strong> For import transactions, payments are typically required in stages: an initial deposit, payment for the vehicle purchase, shipping and insurance costs, and customs duties and taxes. The specific payment schedule will be communicated for each transaction.</li>
        <li><strong>Refunds:</strong> Refund eligibility depends on the stage of the transaction and the specific circumstances. In general:
          <ul>
            <li>Deposits may be refundable if a vehicle has not yet been purchased on your behalf, subject to any applicable administrative fees.</li>
            <li>Once a vehicle has been purchased at auction or from a dealer on your behalf, the vehicle purchase amount is non-refundable.</li>
            <li>Shipping and handling fees are non-refundable once the vehicle has been dispatched from the country of origin.</li>
            <li>Government duties and taxes paid to URA or other agencies are non-refundable by EzzyRide.</li>
          </ul>
        </li>
        <li><strong>Disputes:</strong> If you believe a charge is incorrect, you must notify us within 14 days of the transaction. We will investigate and respond within a reasonable timeframe.</li>
      </ul>
    `,
  },
  {
    id: 'partners',
    title: 'Partner Integrations',
    content: `
      <p>Our platform may display vehicles and services provided by third-party partners, including international vehicle dealers, auction aggregators, and logistics companies. With respect to partner-sourced content:</p>
      <ul>
        <li>Partner dealers and auction houses are solely responsible for the accuracy of vehicle information they provide, including descriptions, photographs, condition reports, and pricing.</li>
        <li>EzzyRide does not independently inspect every vehicle listed by partners and cannot guarantee the condition, history, or specifications of partner-sourced vehicles.</li>
        <li>Transactions involving partner vehicles may be subject to additional terms and conditions imposed by the partner. You are responsible for reviewing and accepting such terms.</li>
        <li>EzzyRide acts as an intermediary and is not a party to the sale agreement between you and a partner dealer, except where expressly stated otherwise.</li>
        <li>Any disputes regarding the condition or description of a partner-sourced vehicle should be raised with EzzyRide promptly. We will use reasonable efforts to mediate between you and the partner but cannot guarantee a specific outcome.</li>
      </ul>
    `,
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    content: `
      <p>All content on the EzzyRide platform, including but not limited to text, graphics, logos, icons, images, audio clips, software, and compilations of data, is the property of EzzyRide Uganda or its content suppliers and is protected by Ugandan and international intellectual property laws.</p>
      <ul>
        <li>The EzzyRide name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of EzzyRide Uganda. You must not use such marks without our prior written permission.</li>
        <li>You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any content from our platform without our express written consent, except for personal, non-commercial use.</li>
        <li>You may not use any data mining, robots, scraping, or similar data gathering or extraction tools on our platform.</li>
      </ul>
    `,
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: `
      <p>To the fullest extent permitted by the laws of Uganda:</p>
      <ul>
        <li>EzzyRide, its directors, officers, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the Services.</li>
        <li>EzzyRide shall not be liable for any damages arising from: (a) errors, mistakes, or inaccuracies in vehicle listings or other content; (b) personal injury or property damage resulting from your use of a vehicle purchased through our platform; (c) any unauthorised access to or use of our servers or any personal or financial information stored therein; (d) any interruption or cessation of transmission to or from our Services; (e) any bugs, viruses, or other harmful code that may be transmitted through our Services by any third party.</li>
        <li>In no event shall EzzyRide's total aggregate liability to you for all claims arising out of or relating to these Terms or the Services exceed the total amount you have paid to EzzyRide in the twelve (12) months immediately preceding the event giving rise to the claim.</li>
        <li>The Services are provided on an "as is" and "as available" basis. EzzyRide makes no warranties, expressed or implied, regarding the operation of the Services or the information, content, or materials included therein.</li>
      </ul>
    `,
  },
  {
    id: 'privacy',
    title: 'Privacy',
    content: `
      <p>Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our <a href="/privacy" class="text-primary hover:underline font-medium">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>
      <p>By using our Services, you consent to the collection and use of your information as described in the Privacy Policy. We encourage you to read the Privacy Policy carefully to understand our practices regarding your personal data.</p>
    `,
  },
  {
    id: 'governing-law',
    title: 'Governing Law and Dispute Resolution',
    content: `
      <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of Uganda, without regard to its conflict of law provisions.</p>
      <p>Any dispute, controversy, or claim arising out of or relating to these Terms or the breach, termination, or invalidity thereof shall first be attempted to be resolved through good-faith negotiation between the parties. If the dispute cannot be resolved through negotiation within thirty (30) days, either party may submit the dispute to mediation under the rules of the Centre for Arbitration and Dispute Resolution (CADER) in Kampala, Uganda.</p>
      <p>If the dispute is not resolved through mediation within sixty (60) days, either party may refer the dispute to the courts of competent jurisdiction in Kampala, Uganda.</p>
      <p>Nothing in this clause shall prevent either party from seeking urgent interim or injunctive relief from any court of competent jurisdiction.</p>
    `,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    content: `
      <p>If you have any questions, concerns, or requests regarding these Terms and Conditions, please contact us:</p>
      <ul>
        <li><strong>Company:</strong> EzzyRide Uganda</li>
        <li><strong>Location:</strong> Kampala, Uganda</li>
        <li><strong>Email:</strong> <a href="mailto:info@ezzyride.ug" class="text-primary hover:underline">info@ezzyride.ug</a></li>
        <li><strong>Website:</strong> <a href="https://www.ezzyride.ug" class="text-primary hover:underline">www.ezzyride.ug</a></li>
      </ul>
      <p>We will make reasonable efforts to respond to all inquiries within two (2) business days.</p>
    `,
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    content: `
      <p>We reserve the right to update or modify these Terms at any time at our sole discretion. When we make changes, we will update the "Last Updated" date at the top of this page and, where appropriate, notify you by email or through a prominent notice on our platform.</p>
      <p>Material changes will be effective thirty (30) days after posting or such other date as we may specify. Your continued use of the Services after the effective date of any changes constitutes your acceptance of the revised Terms.</p>
      <p>If you do not agree with any changes to these Terms, you must stop using the Services immediately and, if applicable, close your account.</p>
    `,
  },
]

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="font-roboto text-gray-800">

    <!-- Hero -->
    <section class="relative pt-24 pb-12 bg-secondary overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-accent/50"></div>
      <div class="container mx-auto px-4 relative z-10 text-center text-white">
        <div class="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-1.5 rounded-full mb-5">
          <i class="fa-solid fa-file-contract text-primary text-xs"></i> Legal
        </div>
        <h1 class="text-4xl md:text-5xl font-bold font-montserrat mb-4">
          Terms &amp; <span class="text-primary">Conditions</span>
        </h1>
        <p class="text-gray-300 text-lg max-w-xl mx-auto">
          Please read these terms carefully before using EzzyRide Uganda's services.
        </p>
      </div>
    </section>

    <!-- Breadcrumb -->
    <div class="bg-white border-b border-gray-100">
      <div class="container mx-auto px-4 py-3">
        <nav class="flex items-center gap-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-primary transition-colors">
            <i class="fa-solid fa-house text-xs"></i> Home
          </NuxtLink>
          <i class="fa-solid fa-chevron-right text-[10px] text-gray-300"></i>
          <span class="text-secondary font-medium">Terms &amp; Conditions</span>
        </nav>
      </div>
    </div>

    <!-- Content -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">

          <!-- Last updated badge -->
          <div class="flex items-center gap-2 mb-8">
            <span class="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full">
              <i class="fa-solid fa-calendar text-primary text-[10px]"></i>
              Last updated: {{ lastUpdated }}
            </span>
          </div>

          <!-- Table of Contents -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
            <h2 class="font-bold text-secondary text-lg font-montserrat mb-4 flex items-center gap-2">
              <i class="fa-solid fa-list text-primary text-sm"></i> Table of Contents
            </h2>
            <ol class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <li v-for="(section, index) in sections" :key="section.id">
                <a
                  :href="`#${section.id}`"
                  class="text-sm text-gray-600 hover:text-primary transition-colors flex items-start gap-2 py-1"
                >
                  <span class="text-primary font-semibold text-xs mt-0.5">{{ index + 1 }}.</span>
                  {{ section.title }}
                </a>
              </li>
            </ol>
          </div>

          <!-- Sections -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
            <div
              v-for="(section, index) in sections"
              :key="section.id"
              :id="section.id"
              class="scroll-mt-24"
              :class="{ 'mt-10 pt-10 border-t border-gray-100': index > 0 }"
            >
              <h2 class="text-xl font-bold text-secondary font-montserrat mb-4 flex items-start gap-3">
                <span class="bg-primary text-white text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  {{ index + 1 }}
                </span>
                {{ section.title }}
              </h2>
              <div
                class="prose prose-sm prose-gray max-w-none
                  [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-3
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-2
                  [&_li]:text-gray-600 [&_li]:text-sm [&_li]:leading-relaxed
                  [&_ul_ul]:mt-2 [&_ul_ul]:mb-0
                  [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline
                  [&_strong]:text-secondary"
                v-html="section.content"
              />
            </div>
          </div>

          <!-- Back to top -->
          <div class="text-center mt-10">
            <button
              @click="scrollToTop"
              class="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-primary/30 hover:bg-primary/5 text-gray-600 hover:text-primary px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm"
            >
              <i class="fa-solid fa-arrow-up text-xs"></i> Back to top
            </button>
          </div>

        </div>
      </div>
    </section>

  </div>
</template>
