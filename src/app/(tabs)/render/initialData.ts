export const INITIAL_DATA = {
  analytics: {
    revenue: 125000,
    growth: 0.15,
    customers: 1234,
    orders: 567,
    salesByRegion: [
      { label: "US", value: 45000 },
      { label: "EU", value: 35000 },
      { label: "Asia", value: 28000 },
      { label: "Other", value: 17000 },
    ],
    recentTransactions: [
      {
        id: "TXN001",
        customer: "Acme Corp",
        amount: 1500,
        status: "completed",
        date: "2024-01-15",
      },
      {
        id: "TXN002",
        customer: "Globex Inc",
        amount: 2300,
        status: "pending",
        date: "2024-01-14",
      },
      {
        id: "TXN003",
        customer: "Initech",
        amount: 890,
        status: "completed",
        date: "2024-01-13",
      },
      {
        id: "TXN004",
        customer: "Umbrella Co",
        amount: 4200,
        status: "completed",
        date: "2024-01-12",
      },
    ],
  },
  form: {
    dateRange: "",
    region: "",
  },
};

