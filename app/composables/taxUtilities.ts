
import type {ApiResponse, TaxCalculatorPayload, TaxCalculatorResponse} from "@/types";

export const useTaxUtilities = () => {
    const { $api } =  useNuxtApp()
    async function fetchTaxes(payload: TaxCalculatorPayload): Promise<TaxCalculatorResponse>{
        const { data } = await $api.post<ApiResponse<TaxCalculatorResponse>>('/web/tax-calculator', payload)
        return data.data
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
        fetchTaxes,
        formatCurrency
    }
}