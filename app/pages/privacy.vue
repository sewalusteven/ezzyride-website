<script setup lang="ts">
useSeoMeta({
  title: 'Privacy Policy | EzzyRide Uganda',
  description: 'Learn how EzzyRide Uganda collects, uses, and protects your personal information. Our commitment to your privacy and data security.',
  ogTitle: 'Privacy Policy | EzzyRide Uganda',
  ogDescription: 'EzzyRide Uganda Privacy Policy — how we collect, use, and protect your personal data.',
})

const lastUpdated = 'April 2026'

const sections = [
  {
    id: 'information-collected',
    title: 'Information We Collect',
    content: `
      <p>We collect information that you provide directly to us, information collected automatically when you use our Services, and information from third-party sources. The categories of information we collect include:</p>
      <h4>Personal Information You Provide</h4>
      <ul>
        <li><strong>Account Information:</strong> When you create an account, we collect your full name, email address, phone number, and any other information you choose to provide.</li>
        <li><strong>Contact Form Submissions:</strong> When you submit an inquiry or contact form, we collect your name, email address, phone number, subject of inquiry, and message content.</li>
        <li><strong>Vehicle Preferences:</strong> Information about the types of vehicles you are interested in, including make, model, year, budget range, and feature preferences.</li>
        <li><strong>Transaction Information:</strong> Details related to vehicle purchases and import orders, including payment references, deposit amounts, and transaction history. We do not directly store full credit card or bank account numbers on our servers.</li>
        <li><strong>Communication Records:</strong> Records of your communications with us, including emails, phone calls, WhatsApp messages, and support tickets.</li>
      </ul>
      <h4>Information Collected Automatically</h4>
      <ul>
        <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited, search queries, vehicles viewed, features used, time spent on pages, and navigation paths.</li>
        <li><strong>Device Information:</strong> Browser type and version, operating system, device type, screen resolution, and unique device identifiers.</li>
        <li><strong>Log Data:</strong> Internet Protocol (IP) address, access times, referring URLs, and error logs.</li>
        <li><strong>Cookies and Similar Technologies:</strong> We use cookies, web beacons, and similar tracking technologies to collect information about your browsing activity. See Section 8 for more details on our cookie practices.</li>
      </ul>
    `,
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    content: `
      <p>We use the information we collect for the following purposes:</p>
      <ul>
        <li><strong>Service Delivery:</strong> To process your vehicle orders, manage import transactions, provide status updates, and deliver our Services to you.</li>
        <li><strong>Communication:</strong> To respond to your inquiries, send order confirmations, provide import status updates, and communicate important information about your transactions or account.</li>
        <li><strong>Partner Coordination:</strong> To share necessary information with our import partners, shipping agents, and customs brokers to facilitate your vehicle import and delivery.</li>
        <li><strong>Service Improvement:</strong> To analyse usage patterns, identify areas for improvement, develop new features, and enhance the overall user experience on our platform.</li>
        <li><strong>Marketing:</strong> To send you promotional communications about our Services, new vehicle listings, special offers, and industry news, where you have consented to receive such communications. You may opt out at any time.</li>
        <li><strong>Tax Calculations:</strong> To provide estimated duty and tax calculations based on the vehicle information you supply to our tax calculator tools.</li>
        <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, legal processes, or enforceable governmental requests.</li>
        <li><strong>Security:</strong> To detect, prevent, and address fraud, security breaches, and other potentially prohibited or illegal activities.</li>
      </ul>
    `,
  },
  {
    id: 'information-sharing',
    title: 'Information Sharing and Disclosure',
    content: `
      <p>We do not sell, rent, or trade your personal information to third parties for their marketing purposes. We may share your information in the following circumstances:</p>
      <ul>
        <li><strong>Import Partners:</strong> We share relevant transaction and vehicle preference information with our partner dealers, auction houses, shipping agents, and customs brokers as necessary to source, purchase, ship, and clear your vehicle. This may include your name, contact details, and vehicle specifications.</li>
        <li><strong>Payment Processors:</strong> We share necessary transaction information with payment service providers (including mobile money operators and banks) to process your payments securely.</li>
        <li><strong>Service Providers:</strong> We may share information with third-party companies that perform services on our behalf, such as hosting, data analysis, email delivery, and customer support. These providers are contractually obligated to use your information only for the purposes of providing services to us.</li>
        <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law, regulation, or legal process, or if we believe in good faith that such disclosure is necessary to: (a) comply with a legal obligation; (b) protect and defend the rights or property of EzzyRide; (c) prevent or investigate possible wrongdoing in connection with the Services; or (d) protect the personal safety of users of the Services or the public.</li>
        <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, reorganisation, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change and any choices you may have regarding your information.</li>
        <li><strong>With Your Consent:</strong> We may share your information with third parties when you have given us your explicit consent to do so.</li>
      </ul>
    `,
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: `
      <p>We take the security of your personal information seriously and implement appropriate technical and organisational measures to protect it against unauthorised access, alteration, disclosure, or destruction. Our security measures include:</p>
      <ul>
        <li>Encryption of data in transit using SSL/TLS protocols.</li>
        <li>Secure storage of personal data with access controls and authentication requirements.</li>
        <li>Regular security assessments and updates to our systems and processes.</li>
        <li>Limiting access to personal information to employees and contractors who need it to perform their duties.</li>
        <li>Training our staff on data protection and privacy best practices.</li>
      </ul>
      <p>However, no method of transmission over the Internet or method of electronic storage is completely secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security. You are responsible for maintaining the confidentiality of your account credentials and for any activity that occurs under your account.</p>
    `,
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    content: `
      <p>We retain your personal information for as long as necessary to fulfil the purposes for which it was collected and to comply with our legal, regulatory, and business obligations. Specifically:</p>
      <ul>
        <li><strong>Account Information:</strong> Retained for as long as your account is active. If you request account deletion, we will delete or anonymise your data within 30 days, except where retention is required by law.</li>
        <li><strong>Transaction Records:</strong> Retained for a minimum of seven (7) years from the date of the transaction, as required by Ugandan tax and business record-keeping regulations.</li>
        <li><strong>Communication Records:</strong> Retained for up to three (3) years from the date of the communication, unless a longer retention period is required for legal or dispute resolution purposes.</li>
        <li><strong>Usage Data:</strong> Aggregated and anonymised usage data may be retained indefinitely for analytical and service improvement purposes.</li>
        <li><strong>Marketing Preferences:</strong> Records of your marketing consent or opt-out preferences are retained for as long as necessary to honour your preferences.</li>
      </ul>
      <p>When personal information is no longer required, we will securely delete or anonymise it in accordance with our data retention schedule.</p>
    `,
  },
  {
    id: 'user-rights',
    title: 'Your Rights',
    content: `
      <p>You have the following rights with respect to your personal information:</p>
      <ul>
        <li><strong>Right of Access:</strong> You may request a copy of the personal information we hold about you. We will respond to your request within thirty (30) days.</li>
        <li><strong>Right to Correction:</strong> You may request that we correct any inaccurate or incomplete personal information. You can also update your account information directly through your account settings.</li>
        <li><strong>Right to Deletion:</strong> You may request that we delete your personal information. We will comply with your request unless we are required to retain the information for legal, regulatory, or legitimate business purposes.</li>
        <li><strong>Right to Restrict Processing:</strong> You may request that we restrict the processing of your personal information in certain circumstances, such as while we verify the accuracy of your data or evaluate a deletion request.</li>
        <li><strong>Right to Object:</strong> You may object to the processing of your personal information for direct marketing purposes at any time. You may also object to processing based on our legitimate interests if you believe your rights override those interests.</li>
        <li><strong>Right to Data Portability:</strong> Where technically feasible, you may request that we provide your personal information in a structured, commonly used, machine-readable format.</li>
        <li><strong>Right to Withdraw Consent:</strong> Where we process your information based on your consent, you may withdraw that consent at any time. Withdrawal of consent does not affect the lawfulness of processing carried out before the withdrawal.</li>
      </ul>
      <p>To exercise any of these rights, please contact us using the details provided in Section 12. We may need to verify your identity before processing your request.</p>
    `,
  },
  {
    id: 'cookies',
    title: 'Cookies and Tracking Technologies',
    content: `
      <p>Our platform uses cookies and similar tracking technologies to enhance your experience and collect usage information. The types of cookies we use include:</p>
      <ul>
        <li><strong>Essential Cookies:</strong> Required for the basic operation of our platform, such as session management, authentication, and security. These cannot be disabled.</li>
        <li><strong>Functional Cookies:</strong> Enable enhanced features and personalisation, such as remembering your preferences, language settings, and recently viewed vehicles.</li>
        <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our platform by collecting information about pages visited, time spent, and navigation patterns. We use this data to improve our Services.</li>
        <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements and measure the effectiveness of our advertising campaigns. These may be set by third-party advertising partners.</li>
      </ul>
      <p>You can manage your cookie preferences through your browser settings. Most browsers allow you to block or delete cookies. However, blocking certain cookies may affect the functionality of our platform.</p>
      <p>We may also use web beacons (clear GIFs or pixel tags) in our emails to track open rates and click-through rates, which helps us measure the effectiveness of our communications.</p>
    `,
  },
  {
    id: 'third-party',
    title: 'Third-Party Services',
    content: `
      <p>Our platform may integrate with or contain links to third-party services, including but not limited to:</p>
      <ul>
        <li><strong>Google Services:</strong> We use Google Analytics to analyse website traffic and user behaviour. We may also use Google AdSense or similar advertising services to display relevant advertisements on our platform. Google's use of your data is governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" class="text-primary hover:underline">Google's Privacy Policy</a>.</li>
        <li><strong>Social Media Platforms:</strong> Our platform may include social media features (such as share buttons or links to our social media profiles). Your interactions with these features are governed by the privacy policies of the respective social media platforms.</li>
        <li><strong>Payment Processors:</strong> Payment transactions are processed by third-party payment service providers. These providers have their own privacy policies governing how they handle your payment information.</li>
        <li><strong>Vehicle Data Providers:</strong> We may use third-party services to obtain vehicle specifications, pricing data, and condition reports.</li>
      </ul>
      <p>We are not responsible for the privacy practices of third-party services. We encourage you to review the privacy policies of any third-party services you access through our platform.</p>
    `,
  },
  {
    id: 'children',
    title: "Children's Privacy",
    content: `
      <p>Our Services are not directed at individuals under the age of 18. We do not knowingly collect personal information from children under 18 years of age. If you are under 18, you must not create an account or provide any personal information through our platform.</p>
      <p>If we become aware that we have inadvertently collected personal information from a child under 18, we will take immediate steps to delete that information from our systems. If you believe that we may have collected information from a child under 18, please contact us immediately using the details provided in Section 12.</p>
    `,
  },
  {
    id: 'international',
    title: 'International Data Processing',
    content: `
      <p>EzzyRide Uganda is based in and operates from Kampala, Uganda. Your personal information is primarily processed and stored in Uganda.</p>
      <p>In the course of providing our Services, your information may be transferred to or accessed from other countries (for example, when coordinating with import partners in Japan or other vehicle-source countries). When such transfers occur, we take reasonable steps to ensure that your information receives an adequate level of protection consistent with this Privacy Policy and applicable data protection laws.</p>
      <p>By using our Services, you consent to the transfer and processing of your personal information in Uganda and any other country in which we or our partners operate.</p>
    `,
  },
  {
    id: 'changes',
    title: 'Changes to This Privacy Policy',
    content: `
      <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make changes:</p>
      <ul>
        <li>We will update the "Last Updated" date at the top of this page.</li>
        <li>For material changes, we will provide prominent notice on our platform or send you a direct notification (such as an email) before the changes take effect.</li>
        <li>Material changes will become effective thirty (30) days after posting or such other date as specified in the notice.</li>
      </ul>
      <p>We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information. Your continued use of our Services after any changes to this Privacy Policy constitutes your acceptance of the updated policy.</p>
    `,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: `
      <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
      <ul>
        <li><strong>Company:</strong> EzzyRide Uganda</li>
        <li><strong>Location:</strong> Kampala, Uganda</li>
        <li><strong>Email:</strong> <a href="mailto:info@ezzyride.ug" class="text-primary hover:underline">info@ezzyride.ug</a></li>
        <li><strong>Website:</strong> <a href="https://www.ezzyride.ug" class="text-primary hover:underline">www.ezzyride.ug</a></li>
      </ul>
      <p>For privacy-specific concerns, please include "Privacy Inquiry" in the subject line of your email to help us direct your request to the appropriate team member. We will acknowledge your request within two (2) business days and provide a substantive response within thirty (30) days.</p>
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
          <i class="fa-solid fa-shield-halved text-primary text-xs"></i> Your Privacy
        </div>
        <h1 class="text-4xl md:text-5xl font-bold font-montserrat mb-4">
          Privacy <span class="text-primary">Policy</span>
        </h1>
        <p class="text-gray-300 text-lg max-w-xl mx-auto">
          How EzzyRide Uganda collects, uses, and protects your personal information.
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
          <span class="text-secondary font-medium">Privacy Policy</span>
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

          <!-- Summary card -->
          <div class="bg-primary/5 border border-primary/10 rounded-2xl p-6 md:p-8 mb-8">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <i class="fa-solid fa-circle-info text-primary"></i>
              </div>
              <div>
                <h2 class="font-bold text-secondary text-base mb-2">Privacy at a Glance</h2>
                <p class="text-gray-600 text-sm leading-relaxed">
                  EzzyRide Uganda is committed to protecting your privacy. We collect only the information necessary to provide our vehicle marketplace and import assistance services. We never sell your personal data to third parties. You have the right to access, correct, or delete your information at any time.
                </p>
              </div>
            </div>
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
                  [&_h4]:text-secondary [&_h4]:font-semibold [&_h4]:text-sm [&_h4]:mt-4 [&_h4]:mb-2
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-2
                  [&_li]:text-gray-600 [&_li]:text-sm [&_li]:leading-relaxed
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
