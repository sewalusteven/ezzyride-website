export interface TaxCalculatorPayload {
    cif: number | null
    year: number | string
    isLuxury: boolean
    isEV: boolean
    make: string
}

export interface TaxCalculatorResponse {
    totalTax:number
    formFees: number
    stampDuty: number
    registrationFees: number
    exciseDuty: number
    importCommission: number
    infrastructureTax: number
    envLevy: number
    withholding: number
    vat: number
    importDuty: number
    cifUGX: number
    usdRate:number
    totalCarValue: number
}

export interface ApiResponse<T> {
    message: string
    data: T
}

export interface VehicleValuation {
    id: number
    name: string
    hsc: string
    model: string
    year: string
    origin: string
    cc: string
    unit: string
    cif: string
    batch: BatchInfo
}

export interface BatchInfo{
    id: number
    title: string
    review_date: string
}