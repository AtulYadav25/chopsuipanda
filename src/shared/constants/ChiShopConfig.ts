export type ChiShopItem = {
    id: number;
    amount: number;
    price: number;
    bonus?: string;
    tag?: string;
};

export const CHI_SHOP_ITEMS: readonly ChiShopItem[] = [
    { id: 910, amount: 12000, price: 0.1, bonus: "" }, //12K CHI, Price is 0.1 SUI
    { id: 911, amount: 45000, price: 0.3, bonus: "8% MORE" },
    { id: 912, amount: 100000, price: 0.7, bonus: "16% MORE" },
    { id: 913, amount: 255000, price: 1.5, bonus: "40% MORE", tag: "BEST SELLER" },
    { id: 914, amount: 550000, price: 2.8, bonus: "60% MORE" },
    { id: 915, amount: 1470000, price: 7.0, bonus: "95% MORE" },
    { id: 916, amount: 4250000, price: 18, bonus: "155% MORE" },
    { id: 917, amount: 8550000, price: 35, bonus: "235% MORE" },
    { id: 918, amount: 20000000, price: 75, bonus: "350% MORE" }
] as const;