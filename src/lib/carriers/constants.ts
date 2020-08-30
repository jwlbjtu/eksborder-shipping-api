export const DHL_ECOMMERCE = "DHL eCommerce";

export const massUnits = ["LB", "OZ", "KG", "G"];

export const dimensionUnits = ["IN", "CM"];

export const errorTypes = {
    MISSING: "missing",
    UNSUPPORTED: "unsupported",
    EMPTY: "empty"
}

// This is the FLAT price of DHL eCommerce
// Weight Unit is OZ, Currency is USD
export const DHL_FLAT_PRICES: {[key: string]: number} = {
    "1" : 0.96,
    "2" : 1.01,
    "3" : 1.05,
    "4" : 1.09,
    "5" : 1.19,
    "6" : 1.29,
    "7" : 1.39,
    "8" : 1.50,
    "9" : 1.59,
    "10" : 1.70,
    "11" : 1.79,
    "12" : 1.90,
    "13" : 1.99,
    "14" : 2.10,
    "15" : 2.20,
    "16" : 2.30
};

export const BILLING_TYPES = {
    AMOUNT: "amount",
    PROPORTION: "proportion"
};