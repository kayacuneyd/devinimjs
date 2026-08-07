/** @param {{ id: string, name: string, price: number }} product - Product to add. */
export function addToCart(product: {
    id: string;
    name: string;
    price: number;
}): void;
/** Shared cart state for product-list and cart-summary components. */
export const cartStore: {
    state: object;
    subscribe: (fn: (path: string) => void) => () => void;
    set: (key: string, value: any) => void;
    update: (recipe: (state: object) => (object | undefined)) => object;
    persist: (key: string, options?: {
        storage?: Storage | null;
    }) => () => void;
};
