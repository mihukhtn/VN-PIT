export const calculatePIT = (taxableIncome: number): number => {
    if (taxableIncome <= 0) return 0;

    if (taxableIncome <= 5_000_000)
        return taxableIncome * 0.05;

    if (taxableIncome <= 10_000_000)
        return 250_000 + (taxableIncome - 5_000_000) * 0.10;

    if (taxableIncome <= 18_000_000)
        return 750_000 + (taxableIncome - 10_000_000) * 0.15;

    if (taxableIncome <= 32_000_000)
        return 1_950_000 + (taxableIncome - 18_000_000) * 0.20;

    if (taxableIncome <= 52_000_000)
        return 4_750_000 + (taxableIncome - 32_000_000) * 0.25;

    if (taxableIncome <= 80_000_000)
        return 9_750_000 + (taxableIncome - 52_000_000) * 0.30;

    // Over 80M
    return 18_150_000 + (taxableIncome - 80_000_000) * 0.35;
}

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
