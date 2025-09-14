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