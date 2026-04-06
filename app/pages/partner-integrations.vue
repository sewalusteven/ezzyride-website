<script setup lang="ts">
import { createHighlighter, type Highlighter } from 'shiki'

useHead({ title: 'Partner Integrations — EzzyRide' })

const activeLang = ref('php')

const languages = [
  { id: 'php',    label: 'PHP (Laravel)',        icon: 'fa-brands fa-php',    shikiLang: 'php' },
  { id: 'java',   label: 'Java (Spring)',         icon: 'fa-brands fa-java',   shikiLang: 'java' },
  { id: 'node',   label: 'Node.js (Express)',     icon: 'fa-brands fa-node-js',shikiLang: 'javascript' },
  { id: 'python', label: 'Python (Django/Flask)', icon: 'fa-brands fa-python', shikiLang: 'python' },
  { id: 'go',     label: 'Golang',                icon: 'fa-solid fa-code',    shikiLang: 'go' },
]

const apiBase = 'https://api.ezzyride.com'

// Syntax highlighting
const highlightedSnippets = ref<Record<string, string[]>>({})
const highlighterReady = ref(false)

onMounted(async () => {
  const highlighter = await createHighlighter({
    themes: ['github-dark'],
    langs: ['php', 'java', 'javascript', 'python', 'go'],
  })

  for (const lang of languages) {
    const langSnippets = snippets[lang.id] ?? []
    highlightedSnippets.value[lang.id] = langSnippets.map(s =>
      highlighter.codeToHtml(s.code, {
        lang: lang.shikiLang,
        theme: 'github-dark',
      })
    )
  }
  highlighterReady.value = true
})

const snippets: Record<string, { label: string; code: string }[]> = {
  php: [
    {
      label: 'Laravel — Send Vehicles',
      code: `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Support\\Facades\\Http;

class VehicleSyncController extends Controller
{
    public function sync()
    {
        $apiKey  = config('services.ezzyride.api_key'); // YOUR_API_KEY
        $baseUrl = '${apiBase}';

        $vehicles = [
            [
                'external_reference' => 'SBT-12345',
                'brand'              => 'Toyota',
                'model'              => 'Land Cruiser',
                'year'               => 2022,
                'transmission'       => 'Automatic',
                'fuel_type'          => 'Diesel',
                'mileage'            => 45000,
                'engine_cc'          => 2800,
                'selling_price'      => 85000000,
                'status'             => 'In Stock',
                'features'           => 'Sunroof|Leather Seats|Navigation',
            ],
            // ... more vehicles
        ];

        $response = Http::withHeaders([
            'X-Api-Key'    => $apiKey,
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])->post("{$baseUrl}/partner-api/v1/sync", [
            'vehicles' => $vehicles,
        ]);

        if ($response->successful()) {
            $result = $response->json('data');
            logger()->info('Sync complete', [
                'imported' => $result['imported_count'],
                'failed'   => $result['failed_count'],
            ]);
        } else {
            logger()->error('Sync failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        }

        return $response->json();
    }
}`,
    },
  ],
  java: [
    {
      label: 'Spring Boot — Send Vehicles',
      code: `package com.example.sync;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class VehicleSyncService {

    @Value("\${ezzyride.api-key}")  // YOUR_API_KEY
    private String apiKey;

    private final String baseUrl = "${apiBase}";
    private final RestTemplate rest = new RestTemplate();

    public Map<String, Object> syncVehicles() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        List<Map<String, Object>> vehicles = new ArrayList<>();
        vehicles.add(Map.of(
            "external_reference", "SBT-12345",
            "brand",              "Toyota",
            "model",              "Land Cruiser",
            "year",               2022,
            "transmission",       "Automatic",
            "fuel_type",          "Diesel",
            "mileage",            45000,
            "engine_cc",          2800,
            "selling_price",      85000000,
            "status",             "In Stock",
            "features",           "Sunroof|Leather Seats|Navigation"
        ));

        Map<String, Object> body = Map.of("vehicles", vehicles);

        HttpEntity<Map<String, Object>> entity =
            new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = rest.exchange(
            baseUrl + "/partner-api/v1/sync",
            HttpMethod.POST,
            entity,
            Map.class
        );

        System.out.println("Status: " + response.getStatusCode());
        return response.getBody();
    }
}`,
    },
  ],
  node: [
    {
      label: 'Express — Send Vehicles',
      code: `const axios = require('axios');

const API_KEY  = process.env.EZZYRIDE_API_KEY; // YOUR_API_KEY
const BASE_URL = '${apiBase}';

async function syncVehicles() {
  const vehicles = [
    {
      external_reference: 'SBT-12345',
      brand:              'Toyota',
      model:              'Land Cruiser',
      year:               2022,
      transmission:       'Automatic',
      fuel_type:          'Diesel',
      mileage:            45000,
      engine_cc:          2800,
      selling_price:      85000000,
      status:             'In Stock',
      features:           'Sunroof|Leather Seats|Navigation',
    },
    // ... more vehicles
  ];

  try {
    const { data } = await axios.post(
      \`\${BASE_URL}/partner-api/v1/sync\`,
      { vehicles },
      {
        headers: {
          'X-Api-Key':    API_KEY,
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
      }
    );

    console.log('Imported:', data.data.imported_count);
    console.log('Failed:',   data.data.failed_count);
    return data;
  } catch (err) {
    console.error('Sync error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { syncVehicles };`,
    },
  ],
  python: [
    {
      label: 'Django / Flask — Send Vehicles',
      code: `import os
import requests

API_KEY  = os.environ.get("EZZYRIDE_API_KEY")  # YOUR_API_KEY
BASE_URL = "${apiBase}"

def sync_vehicles():
    vehicles = [
        {
            "external_reference": "SBT-12345",
            "brand":              "Toyota",
            "model":              "Land Cruiser",
            "year":               2022,
            "transmission":       "Automatic",
            "fuel_type":          "Diesel",
            "mileage":            45000,
            "engine_cc":          2800,
            "selling_price":      85000000,
            "status":             "In Stock",
            "features":           "Sunroof|Leather Seats|Navigation",
        },
        # ... more vehicles
    ]

    response = requests.post(
        f"{BASE_URL}/partner-api/v1/sync",
        json={"vehicles": vehicles},
        headers={
            "X-Api-Key":    API_KEY,
            "Content-Type": "application/json",
            "Accept":       "application/json",
        },
    )

    if response.ok:
        result = response.json()["data"]
        print(f"Imported: {result['imported_count']}")
        print(f"Failed:   {result['failed_count']}")
    else:
        print(f"Error {response.status_code}: {response.text}")

    return response.json()`,
    },
  ],
  go: [
    {
      label: 'Go — Send Vehicles',
      code: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

const baseURL = "${apiBase}"

type Vehicle struct {
	ExternalReference string \`json:"external_reference"\`
	Brand             string \`json:"brand"\`
	Model             string \`json:"model"\`
	Year              int    \`json:"year"\`
	Transmission      string \`json:"transmission"\`
	FuelType          string \`json:"fuel_type"\`
	Mileage           int    \`json:"mileage"\`
	EngineCC          int    \`json:"engine_cc"\`
	SellingPrice      int    \`json:"selling_price"\`
	Status            string \`json:"status"\`
	Features          string \`json:"features"\`
}

func syncVehicles() error {
	apiKey := os.Getenv("EZZYRIDE_API_KEY") // YOUR_API_KEY

	vehicles := []Vehicle{
		{
			ExternalReference: "SBT-12345",
			Brand:             "Toyota",
			Model:             "Land Cruiser",
			Year:              2022,
			Transmission:      "Automatic",
			FuelType:          "Diesel",
			Mileage:           45000,
			EngineCC:          2800,
			SellingPrice:      85000000,
			Status:            "In Stock",
			Features:          "Sunroof|Leather Seats|Navigation",
		},
	}

	payload := map[string]interface{}{"vehicles": vehicles}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", baseURL+"/partner-api/v1/sync", bytes.NewReader(body))
	req.Header.Set("X-Api-Key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d\\nBody: %s\\n", resp.StatusCode, string(respBody))
	return nil
}`,
    },
  ],
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Hero -->
    <div class="bg-secondary text-white">
      <div class="container mx-auto px-4 py-16 text-center">
        <span class="inline-flex items-center gap-2 bg-white/10 text-sm px-3 py-1 rounded-full mb-4">
          <i class="fa-solid fa-code text-primary"></i> Developer Documentation
        </span>
        <h1 class="text-3xl md:text-4xl font-bold font-montserrat mb-3">Partner Integration API</h1>
        <p class="text-gray-300 max-w-xl mx-auto">Partner with EzzyRide to list your vehicle inventory on our platform. Get in touch, get onboarded, and start syncing programmatically.</p>
      </div>
    </div>

    <div class="container mx-auto px-4 py-12 max-w-5xl">
      <!-- Getting Started CTA -->
      <section class="mb-12">
        <div class="bg-white border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-5">
          <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-handshake text-primary text-xl"></i>
          </div>
          <div class="flex-1 text-center md:text-left">
            <h2 class="font-semibold text-gray-900 text-lg mb-1">Interested in Becoming a Partner?</h2>
            <p class="text-sm text-gray-500">To get started, reach out to our team. We'll discuss your needs, set up your partner account, configure your field mappings, and issue you a secure API key. Once onboarded, use this documentation to integrate your vehicle feed.</p>
          </div>
          <NuxtLink to="/contact" class="inline-flex items-center gap-2 bg-primary hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors shrink-0">
            <i class="fa-solid fa-envelope"></i> Contact Us
          </NuxtLink>
        </div>
      </section>

      <!-- Overview -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div class="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <i class="fa-solid fa-handshake text-primary"></i>
            </div>
            <h3 class="font-semibold text-gray-900 text-sm mb-1">1. Get in Touch</h3>
            <p class="text-xs text-gray-500">Contact our team to discuss a partnership. We'll walk you through the onboarding process.</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <i class="fa-solid fa-key text-primary"></i>
            </div>
            <h3 class="font-semibold text-gray-900 text-sm mb-1">2. Receive Your API Key</h3>
            <p class="text-xs text-gray-500">Once approved, we set up your account and issue a secure API key for authentication.</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <i class="fa-solid fa-map text-primary"></i>
            </div>
            <h3 class="font-semibold text-gray-900 text-sm mb-1">3. We Map Your Data</h3>
            <p class="text-xs text-gray-500">Share a sample payload and we configure how your fields, values, and feature names map to ours — no changes needed on your end.</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <i class="fa-solid fa-rotate text-primary"></i>
            </div>
            <h3 class="font-semibold text-gray-900 text-sm mb-1">4. Sync Vehicles</h3>
            <p class="text-xs text-gray-500">POST your vehicle data. Re-syncs update existing vehicles based on your reference ID.</p>
          </div>
        </div>
      </section>

      <!-- Authentication -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Authentication</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <p class="text-sm text-gray-600 mb-4">Once onboarded, you'll receive an API key. Include it in every request via the <code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">X-Api-Key</code> header.</p>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-sm text-gray-300 font-mono"><span class="text-blue-400">POST</span> {{ apiBase }}/partner-api/v1/sync
<span class="text-gray-500">Headers:</span>
  <span class="text-green-400">X-Api-Key</span>:    <span class="text-amber-400">YOUR_API_KEY</span>
  <span class="text-green-400">Content-Type</span>: application/json
  <span class="text-green-400">Accept</span>:       application/json</pre>
          </div>
        </div>
      </section>

      <!-- Request Body -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Request Body</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <p class="text-sm text-gray-600 mb-4">Send an array of vehicle objects. Maximum <strong>500 vehicles</strong> per request.</p>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-5">
            <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"vehicles"</span>: [
    {
      <span class="text-green-400">"external_reference"</span>: <span class="text-amber-400">"SBT-12345"</span>,      <span class="text-gray-500">// Required — your unique ID</span>
      <span class="text-green-400">"brand"</span>:              <span class="text-amber-400">"Toyota"</span>,
      <span class="text-green-400">"model"</span>:              <span class="text-amber-400">"Land Cruiser"</span>,
      <span class="text-green-400">"year"</span>:               <span class="text-blue-400">2022</span>,
      <span class="text-green-400">"transmission"</span>:       <span class="text-amber-400">"Automatic"</span>,
      <span class="text-green-400">"fuel_type"</span>:          <span class="text-amber-400">"Diesel"</span>,
      <span class="text-green-400">"mileage"</span>:            <span class="text-blue-400">45000</span>,
      <span class="text-green-400">"engine_cc"</span>:          <span class="text-blue-400">2800</span>,
      <span class="text-green-400">"selling_price"</span>:      <span class="text-blue-400">85000000</span>,
      <span class="text-green-400">"color"</span>:              <span class="text-amber-400">"White"</span>,
      <span class="text-green-400">"status"</span>:             <span class="text-amber-400">"In Stock"</span>,
      <span class="text-green-400">"features"</span>:           <span class="text-amber-400">"Sunroof|Leather Seats|Navigation"</span>,
      <span class="text-green-400">"description"</span>:        <span class="text-amber-400">"Clean vehicle, low mileage…"</span>
    }
  ]
}</pre>
          </div>

          <h3 class="font-semibold text-gray-900 text-sm mb-3">Field Reference</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th class="text-left px-4 py-2">Field</th>
                  <th class="text-left px-4 py-2">Type</th>
                  <th class="text-left px-4 py-2">Required</th>
                  <th class="text-left px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody class="text-gray-600">
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">external_reference</td><td class="px-4 py-2">string</td><td class="px-4 py-2"><span class="text-red-600 font-medium">Yes</span></td><td class="px-4 py-2">Your unique identifier for this vehicle</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">brand</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Vehicle make (mapped via value mapping)</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">model</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Vehicle model name</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">year</td><td class="px-4 py-2">integer</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Manufacture year</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">transmission</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">automatic, manual, cvt (mapped)</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">fuel_type</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">petrol, diesel, hybrid, electric (mapped)</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">drive_type</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">fwd, rwd, awd, 4wd (mapped)</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">mileage</td><td class="px-4 py-2">integer</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Odometer reading in km</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">engine_cc</td><td class="px-4 py-2">integer</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Engine displacement in cc</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">selling_price</td><td class="px-4 py-2">number</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Price in your default currency — UGX for local partners, CIF in USD/JPY etc. for international (smart parsing supported)</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">color</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Exterior color</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">status</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Vehicle status (mapped via value mapping)</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">features</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Delimited list (pipes, commas, or semicolons). Use your own feature names — we map them during onboarding.</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">description</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Free-text description</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">images</td><td class="px-4 py-2">array</td><td class="px-4 py-2">No</td><td class="px-4 py-2">Array of publicly accessible image URLs. First image becomes primary. Downloaded on first sync only.</td></tr>
                <tr class="border-t border-gray-100"><td class="px-4 py-2 font-mono text-xs">videoUrl</td><td class="px-4 py-2">string</td><td class="px-4 py-2">No</td><td class="px-4 py-2">YouTube or video URL for the vehicle</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Response -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Response</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <p class="text-sm text-gray-600 mb-4">A successful sync returns a summary of what happened.</p>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"success"</span>: <span class="text-blue-400">true</span>,
  <span class="text-green-400">"data"</span>: {
    <span class="text-green-400">"sync_id"</span>:        <span class="text-blue-400">42</span>,
    <span class="text-green-400">"total_vehicles"</span>: <span class="text-blue-400">15</span>,
    <span class="text-green-400">"imported_count"</span>: <span class="text-blue-400">14</span>,
    <span class="text-green-400">"failed_count"</span>:   <span class="text-blue-400">1</span>,
    <span class="text-green-400">"skipped_count"</span>:  <span class="text-blue-400">0</span>,
    <span class="text-green-400">"errors"</span>: [
      { <span class="text-green-400">"index"</span>: <span class="text-blue-400">7</span>, <span class="text-green-400">"message"</span>: <span class="text-amber-400">"Missing external_reference"</span> }
    ]
  }
}</pre>
          </div>
        </div>
      </section>

      <!-- Important Notes -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Important Notes</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <ul class="space-y-3 text-sm text-gray-600">
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Upsert behavior:</strong> If a vehicle with the same <code class="bg-gray-100 px-1 rounded text-xs font-mono">external_reference</code> already exists, it will be updated — not duplicated.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Field mapping:</strong> You can use your own field names. We configure the mapping on our side so you don't need to change your data format.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Value mapping:</strong> Enum values (transmission, fuel type, etc.) are mapped automatically. Send values in your own format.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Rate limit:</strong> Maximum 500 vehicles per request. For larger inventories, batch into multiple requests.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Smart pricing:</strong> Price fields accept formatted strings like "UGX 85,000,000" or "85.5M" — they are parsed automatically.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Features:</strong> Send features/extras as a delimited string (pipes <code class="bg-gray-100 px-1 rounded text-xs font-mono">|</code>, commas, or semicolons). During onboarding, share a sample payload with your account manager so they can map your feature names to our system. Use your own naming — no changes needed on your end.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Images:</strong> Include an <code class="bg-gray-100 px-1 rounded text-xs font-mono">images</code> array with publicly accessible URLs (not behind authentication). Supported formats: JPEG, PNG, WebP. We download and store them on first sync. The first URL becomes the primary image.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Video:</strong> Include a <code class="bg-gray-100 px-1 rounded text-xs font-mono">videoUrl</code> field with a YouTube or video link for the vehicle listing.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Removing vehicles:</strong> To remove a vehicle from the website, send it with <code class="bg-gray-100 px-1 rounded text-xs font-mono">"status": "sold"</code> or <code class="bg-gray-100 px-1 rounded text-xs font-mono">"status": "draft"</code> in your next sync. Sold vehicles are taken offline automatically. Draft vehicles are hidden from the public listing.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span><strong>Pricing:</strong> For <strong>international partners</strong>, send the CIF price in your configured currency (e.g. USD). We convert it to UGX using the current market rate for display. For <strong>local partners</strong>, send the price in UGX as-is.</span></li>
          </ul>
        </div>
      </section>

      <!-- After Sync -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">What Happens After Sync</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <ol class="space-y-3 text-sm text-gray-600 list-decimal list-inside">
            <li><strong>Vehicles land as unpublished drafts</strong> — they are not visible on the website until reviewed by the EzzyRide team.</li>
            <li><strong>Our team reviews and publishes</strong> — we verify details, check images, and make the listing live. This typically happens within 24 hours.</li>
            <li><strong>Customers browse and inquire</strong> — once live, customers can view the vehicle, calculate estimated costs, and submit a purchase request.</li>
            <li><strong>You get notified</strong> — if you've configured a purchase callback URL, your system receives a notification automatically. Otherwise, your EzzyRide account manager will contact you directly.</li>
          </ol>
          <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-xs text-blue-700">
              <i class="fa-solid fa-info-circle mr-1"></i>
              <strong>Tip:</strong> We recommend syncing your full inventory daily (or whenever stock changes) to keep listings up to date. Vehicles with the same <code class="bg-gray-100 px-1 rounded text-xs font-mono">external_reference</code> are updated, never duplicated.
            </p>
          </div>
          <div class="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-xs text-green-700">
              <i class="fa-solid fa-flask mr-1"></i>
              <strong>Testing:</strong> During onboarding, send a small test batch (1–2 vehicles) with <code class="bg-gray-100 px-1 rounded text-xs font-mono">"status": "draft"</code>. These will not appear on the website. Your account manager will verify the data looks correct before going live.
            </p>
          </div>
        </div>
      </section>

      <!-- Code Examples -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Code Examples</h2>
        <p class="text-sm text-gray-500 mb-5">Replace <code class="bg-gray-100 text-amber-600 px-1.5 py-0.5 rounded text-xs font-mono">YOUR_API_KEY</code> with the API key provided by your EzzyRide account manager.</p>

        <!-- Language tabs -->
        <div class="flex gap-1 flex-wrap mb-4">
          <button v-for="lang in languages" :key="lang.id" @click="activeLang = lang.id"
            class="px-3 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
            :class="activeLang === lang.id ? 'bg-secondary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
            <i :class="lang.icon"></i>
            {{ lang.label }}
          </button>
        </div>

        <!-- Code block -->
        <div v-for="(snippet, sIdx) in snippets[activeLang]" :key="activeLang + '-' + sIdx">
          <div class="bg-[#24292e] rounded-xl overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2.5 bg-black/20 border-b border-white/5">
              <span class="text-xs text-gray-400 font-medium">{{ snippet.label }}</span>
            </div>
            <div class="p-4 overflow-x-auto shiki-wrapper" v-if="highlighterReady && highlightedSnippets[activeLang]?.[sIdx]"
              v-html="highlightedSnippets[activeLang][sIdx]"></div>
            <div v-else class="p-4 overflow-x-auto">
              <pre class="text-sm text-gray-300 font-mono whitespace-pre">{{ snippet.code }}</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- Purchase Callback -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Purchase Callback (Optional)</h2>
        <div class="bg-white border border-gray-200 rounded-xl p-6">
          <p class="text-sm text-gray-600 mb-4">
            When a customer on EzzyRide requests to purchase one of your vehicles, we can notify your system automatically.
            During onboarding, provide a callback URL to your account manager. We will send a <code class="bg-gray-100 px-1 rounded text-xs font-mono">POST</code> request whenever a purchase request is made.
          </p>

          <h4 class="text-sm font-semibold text-gray-800 mb-2">Request We Send</h4>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre class="text-sm text-gray-300 font-mono"><span class="text-blue-400">POST</span> <span class="text-amber-400">https://your-system.com/api/purchase-callback</span>
<span class="text-gray-500">Headers:</span>
  <span class="text-green-400">Content-Type</span>: application/json

{
  <span class="text-green-400">"event"</span>: <span class="text-amber-400">"purchase_request"</span>,
  <span class="text-green-400">"external_reference"</span>: <span class="text-amber-400">"YOUR-STOCK-REF"</span>,
  <span class="text-green-400">"vehicle_reference"</span>: <span class="text-amber-400">"EZR-2026-00042"</span>,
  <span class="text-green-400">"vehicle"</span>: <span class="text-amber-400">"Toyota Land Cruiser 2022"</span>,
  <span class="text-green-400">"customer"</span>: {
    <span class="text-green-400">"name"</span>:  <span class="text-amber-400">"John Doe"</span>,
    <span class="text-green-400">"email"</span>: <span class="text-amber-400">"john@example.com"</span>,
    <span class="text-green-400">"phone"</span>: <span class="text-amber-400">"+256700123456"</span>
  },
  <span class="text-green-400">"application_reference"</span>: <span class="text-amber-400">"IMP-2026-00015"</span>,
  <span class="text-green-400">"requested_at"</span>: <span class="text-amber-400">"2026-04-05T10:30:00+03:00"</span>
}</pre>
          </div>

          <h4 class="text-sm font-semibold text-gray-800 mb-2">Expected Response — Vehicle Available</h4>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"success"</span>: <span class="text-blue-400">true</span>,
  <span class="text-green-400">"message"</span>: <span class="text-amber-400">"Purchase request received"</span>,
  <span class="text-green-400">"partner_reference"</span>: <span class="text-amber-400">"PR-2026-0042"</span>  <span class="text-gray-500">// optional — your internal tracking reference</span>
}</pre>
          </div>

          <h4 class="text-sm font-semibold text-gray-800 mb-2">Expected Response — Vehicle No Longer Available</h4>
          <p class="text-sm text-gray-600 mb-3">
            If the vehicle has already been sold, reserved, or is otherwise unavailable on your side, respond with <code class="bg-gray-100 px-1 rounded text-xs font-mono">"success": false</code> and a <code class="bg-gray-100 px-1 rounded text-xs font-mono">reason</code> field. We will automatically release the reservation on our end and notify our team.
          </p>
          <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre class="text-sm text-gray-300 font-mono">{
  <span class="text-green-400">"success"</span>: <span class="text-blue-400">false</span>,
  <span class="text-green-400">"reason"</span>: <span class="text-amber-400">"sold"</span>,          <span class="text-gray-500">// "sold", "reserved", or "unavailable"</span>
  <span class="text-green-400">"message"</span>: <span class="text-amber-400">"This vehicle was sold yesterday"</span>  <span class="text-gray-500">// optional — additional context</span>
}</pre>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p class="text-xs text-amber-800">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i>
              <strong>What happens on rejection:</strong> The vehicle is marked as sold/reserved (matching your reason), unpublished from the website, and the import application is cancelled. Our team is notified via email to contact the customer with alternative options.
            </p>
          </div>

          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span>We use the <code class="bg-gray-100 px-1 rounded text-xs font-mono">external_reference</code> (your stock number) to identify the vehicle.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span>If your endpoint returns a non-2xx status, we will retry up to 3 times with 60-second intervals.</span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span>Accepted <code class="bg-gray-100 px-1 rounded text-xs font-mono">reason</code> values: <code class="bg-gray-100 px-1 rounded text-xs font-mono">sold</code>, <code class="bg-gray-100 px-1 rounded text-xs font-mono">reserved</code>, <code class="bg-gray-100 px-1 rounded text-xs font-mono">unavailable</code></span></li>
            <li class="flex gap-2"><i class="fa-solid fa-circle-check text-green-500 mt-0.5 shrink-0"></i><span>This is optional — if no callback URL is configured, purchase requests are handled manually by your EzzyRide account manager.</span></li>
          </ul>
        </div>
      </section>

      <!-- Error Codes -->
      <section class="mb-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Error Codes</h2>
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 text-gray-500 text-xs uppercase">
                <th class="text-left px-5 py-3">Status</th>
                <th class="text-left px-5 py-3">Meaning</th>
                <th class="text-left px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody class="text-gray-600">
              <tr class="border-t border-gray-100"><td class="px-5 py-3 font-mono font-medium">200</td><td class="px-5 py-3">Success</td><td class="px-5 py-3 text-gray-400">Check <code class="text-xs">failed_count</code> for per-vehicle errors</td></tr>
              <tr class="border-t border-gray-100"><td class="px-5 py-3 font-mono font-medium text-red-600">401</td><td class="px-5 py-3">Unauthorized</td><td class="px-5 py-3 text-gray-400">Check your API key is correct and active</td></tr>
              <tr class="border-t border-gray-100"><td class="px-5 py-3 font-mono font-medium text-red-600">422</td><td class="px-5 py-3">Validation error</td><td class="px-5 py-3 text-gray-400">Check the <code class="text-xs">vehicles</code> array format</td></tr>
              <tr class="border-t border-gray-100"><td class="px-5 py-3 font-mono font-medium text-red-600">429</td><td class="px-5 py-3">Too many requests</td><td class="px-5 py-3 text-gray-400">Slow down and retry after a moment</td></tr>
              <tr class="border-t border-gray-100"><td class="px-5 py-3 font-mono font-medium text-red-600">500</td><td class="px-5 py-3">Server error</td><td class="px-5 py-3 text-gray-400">Contact support if the issue persists</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Support -->
      <section class="text-center py-8">
        <div class="bg-white border border-gray-200 rounded-xl p-8">
          <i class="fa-solid fa-headset text-3xl text-primary mb-3"></i>
          <h3 class="font-semibold text-gray-900 text-lg mb-2">Need Help?</h3>
          <p class="text-sm text-gray-500 max-w-md mx-auto mb-4">Our team is ready to help with integration setup, field mapping configuration, or troubleshooting sync issues.</p>
          <NuxtLink to="/contact" class="inline-flex items-center gap-2 bg-primary hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-colors">
            <i class="fa-solid fa-envelope"></i> Contact Support
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.shiki-wrapper :deep(pre) {
  background: transparent !important;
  margin: 0;
  padding: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
}
.shiki-wrapper :deep(code) {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}
</style>
