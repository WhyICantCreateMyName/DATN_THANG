export default {
    url: {
        api: {
            // baseUrl: "/api"
            baseUrl: "http://localhost:4000",
        },
        client: {
            // baseUrl: "http://192.168.0.102:4000",
            baseUrl: "http://localhost:3001",
            order: (qrCode: string) => `/menu/${qrCode}`
        }
    },
    ROUTES: {
        LOGIN: '/login',
        DASHBOARD: '/',
        TABLES: '/tables',
        MENU: '/menu',
        ORDERS: '/orders',
        STAFF: '/staff',
        POS: '/pos',
        KITCHEN: '/kitchen',
        INGREDIENTS: '/ingredients'
    },
    PAGINATION: {
        DEFAULT_LIMIT: 12,
        MAX_LIMIT: 50
    }
}