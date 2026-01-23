export interface TaxBracketDetail {
    level: number;
    range: string;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
}

export const getTaxDetails = (taxableIncome: number): TaxBracketDetail[] => {
    if (taxableIncome <= 0) return [];

    const brackets = [
        { level: 1, limit: 5_000_000, rate: 0.05, label: "Đến 5 triệu VNĐ" },
        { level: 2, limit: 10_000_000, rate: 0.10, label: "Trên 5 triệu VNĐ đến 10 triệu VNĐ" },
        { level: 3, limit: 18_000_000, rate: 0.15, label: "Trên 10 triệu VNĐ đến 18 triệu VNĐ" },
        { level: 4, limit: 32_000_000, rate: 0.20, label: "Trên 18 triệu VNĐ đến 32 triệu VNĐ" },
        { level: 5, limit: 52_000_000, rate: 0.25, label: "Trên 32 triệu VNĐ đến 52 triệu VNĐ" },
        { level: 6, limit: 80_000_000, rate: 0.30, label: "Trên 52 triệu VNĐ đến 80 triệu VNĐ" },
        { level: 7, limit: Infinity, rate: 0.35, label: "Trên 80 triệu VNĐ" },
    ];

    const details: TaxBracketDetail[] = [];
    let remainingIncome = taxableIncome;
    let previousLimit = 0;

    for (const bracket of brackets) {
        if (remainingIncome <= 0) break;

        const rangeAmount = bracket.limit - previousLimit;
        const amountInBracket = Math.min(remainingIncome, rangeAmount);

        // Explicitly check for Infinity to avoid calculation issues if logic changes, though Math.min handles it.
        // If bracket.limit is Infinity, rangeAmount is Infinity.

        if (amountInBracket > 0) {
            details.push({
                level: bracket.level,
                range: bracket.label,
                rate: bracket.rate,
                taxableAmount: amountInBracket,
                taxAmount: amountInBracket * bracket.rate
            });
            remainingIncome -= amountInBracket;
            previousLimit = bracket.limit;
        }
    }

    // Fill remaining brackets with 0 if needed for display? 
    // The requirement says "Chi tiết cách tính thuế... dạng table". 
    // Usually it's better to show all brackets or just the relevant ones. 
    // The image shows zeros for higher brackets. So I should probably return all brackets but with 0 values for those not reached, 
    // OR letting the UI handle it. 
    // Let's look at the image again efficiently. 
    // Image shows rows for "Trên 30... 60" with 0. 
    // So it looks like it displays all brackets up to a reasonable point or maybe all of them.
    // To be safe and flexible, I will populate ALL brackets in the return value, 
    // so the UI can just map over them.

    const fullDetails: TaxBracketDetail[] = brackets.map(b => {
        const found = details.find(d => d.level === b.level);
        if (found) return found;
        return {
            level: b.level,
            range: b.label,
            rate: b.rate,
            taxableAmount: 0,
            taxAmount: 0
        };
    });

    return fullDetails;
}

export const calculatePIT = (taxableIncome: number): number => {
    // Re-implement using the breakdown to ensure consistency
    const details = getTaxDetails(taxableIncome);
    return details.reduce((sum, d) => sum + d.taxAmount, 0);
}

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
