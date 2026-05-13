export default {
    url: {
        api: {
            // baseUrl: "/api"
            production: "https://api.nhahang.website",
            development: "http://localhost:4000",
        },
        client: {
            production: "https://www.nhahang.website",
            development: "http://localhost:6688",
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