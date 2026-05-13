const constants = {
    url: {
        api: {
            production: 'https://api.nhahang.website',
            development: "http://localhost:4000",
        }
    },
    ROUTES: {
        HOME: '/',
        MENU: '/menu',
        ORDER_TRACKING: '/order-tracking',
        CART: '/cart',
    },
    STORAGE_KEYS: {
        CART: 'restaurant_customer_cart',
        TABLE_ID: 'restaurant_table_id',
    },
};

export default constants;
