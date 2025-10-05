
import type {ApiResponse, BatchInfo, TaxCalculatorPayload, TaxCalculatorResponse, VehicleValuation} from "@/types";

export const useTaxUtilities = () => {
    const { $api } =  useNuxtApp()
    async function fetchTaxes(payload: TaxCalculatorPayload): Promise<TaxCalculatorResponse>{
        const { data } = await $api.post<ApiResponse<TaxCalculatorResponse>>('/web/tax-calculator', payload)
        return data.data
    }
    async function search(name: string): Promise<VehicleValuation[]>{
        const { data } = await $api.post<ApiResponse<VehicleValuation[]>>('/web/valuation/search', { name })
        return data.data
    }
    async function fetchLatestBatchInfo(): Promise<BatchInfo>{
        const { data } = await $api.get<ApiResponse<BatchInfo>>('/web/valuation/batch-info')
        return data.data
    }
    async function addEmail(email: string): Promise<ApiResponse<object>>{
        const { data } = await $api.post<ApiResponse<TaxCalculatorResponse>>('/web/mailing-list', { email })
        return data
    }


    function formatDate(dateString: string, format: string): string {
        const date = new Date(dateString);

        const options: Record<string, any> = {
            d: date.getDate().toString(), // Day
            dd: date.getDate().toString().padStart(2, '0'), // Day with leading zero
            M: (date.getMonth() + 1).toString(), // Month (1-based index)
            MM: (date.getMonth() + 1).toString().padStart(2, '0'), // Month with leading zero
            MMM: date.toLocaleString('en-US', { month: 'short' }), // Month short (Jan)
            MMMM: date.toLocaleString('en-US', { month: 'long' }), // Month long (January)
            YY: date.getFullYear().toString().slice(-2), // Year (2 digits)
            YYYY: date.getFullYear().toString(), // Year (4 digits)
            h: date.getHours() % 12 || 12, // Hour (12-hour clock)
            hh: (date.getHours() % 12 || 12).toString().padStart(2, '0'), // Hour with leading zero (12-hour clock)
            H: date.getHours().toString(), // Hour (24-hour clock)
            HH: date.getHours().toString().padStart(2, '0'), // Hour with leading zero (24-hour clock)
            m: date.getMinutes().toString(), // Minutes
            mm: date.getMinutes().toString().padStart(2, '0'), // Minutes with leading zero
            s: date.getSeconds().toString(), // Seconds
            ss: date.getSeconds().toString().padStart(2, '0'), // Seconds with leading zero
            A: date.getHours() < 12 ? 'AM' : 'PM', // AM/PM
            a: date.getHours() < 12 ? 'am' : 'pm', // am/pm
        };

        return  format.replace(
            /\b(d{1,2}|M{1,4}|YY(?:YY)?|h{1,2}|H{1,2}|m{1,2}|s{1,2}|A|a)\b/g,
            (match) => options[match] || match
        );


    }



    function formatCurrency(amount: number, currency: string): string {
        if (isNaN(amount)) {
            throw new Error("Invalid amount");
        }

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }


    return {
        formatDate,
        fetchTaxes,
        search,
        formatCurrency,
        fetchLatestBatchInfo,
        addEmail,
    }
}