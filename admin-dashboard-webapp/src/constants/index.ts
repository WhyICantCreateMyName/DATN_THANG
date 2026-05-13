export default {
    url: {
        api: {
            // baseUrl: "/api"
            baseUrl: "https://api.nhahang.website",
        },
        client: {
            // baseUrl: "http://192.168.0.102:4000",
            baseUrl: "https://www.nhahang.website",
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
        INGREDIENTS: '/ingredients',
        VOUCHERS: '/vouchers',
        RESERVATIONS: '/reservations',
        REPORTS: '/reports'
    },
    PAGINATION: {
        DEFAULT_LIMIT: 12,
        MAX_LIMIT: 50
    }
}