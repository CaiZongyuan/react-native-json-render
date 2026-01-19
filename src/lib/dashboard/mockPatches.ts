export const MOCK_PATCHES_DASHBOARD = `{"op":"set","path":"/root","value":"root-stack"}
{"op":"add","path":"/elements/root-stack","value":{"key":"root-stack","type":"Stack","props":{"direction":"vertical","gap":"md","align":"stretch"},"children":["header-section","alert-card","filters-stack","metrics-grid","content-stack","footer-section"]}}

{"op":"add","path":"/elements/header-section","value":{"key":"header-section","type":"Stack","props":{"direction":"vertical","gap":"sm","align":"stretch"},"children":["main-heading","divider-1"]}}
{"op":"add","path":"/elements/main-heading","value":{"key":"main-heading","type":"Heading","props":{"text":"Analytics Dashboard","level":"h1"}}}
{"op":"add","path":"/elements/divider-1","value":{"key":"divider-1","type":"Divider","props":{"label":"Overview"}}}

{"op":"add","path":"/elements/alert-card","value":{"key":"alert-card","type":"Alert","props":{"type":"info","title":"Welcome to Dashboard","message":"This is a comprehensive showcase of all available components using mock data."}}}

{"op":"add","path":"/elements/filters-stack","value":{"key":"filters-stack","type":"Card","props":{"title":"Filters","description":"Filter your data below","padding":"md"},"children":["filters-inner-stack"]}}
{"op":"add","path":"/elements/filters-inner-stack","value":{"key":"filters-inner-stack","type":"Stack","props":{"direction":"vertical","gap":"md","align":"stretch"},"children":["region-select","date-input","buttons-row"]}}
{"op":"add","path":"/elements/region-select","value":{"key":"region-select","type":"Select","props":{"label":"Region","bindPath":"/form/region","placeholder":"Select region","options":[{"value":"all","label":"All Regions"},{"value":"us","label":"United States"},{"value":"eu","label":"Europe"},{"value":"asia","label":"Asia Pacific"}]}}}
{"op":"add","path":"/elements/date-input","value":{"key":"date-input","type":"DatePicker","props":{"label":"Date Range","bindPath":"/form/dateRange","placeholder":"Choose date"}}}
{"op":"add","path":"/elements/buttons-row","value":{"key":"buttons-row","type":"Stack","props":{"direction":"horizontal","gap":"sm","align":"center"},"children":["apply-btn","refresh-btn"]}}
{"op":"add","path":"/elements/apply-btn","value":{"key":"apply-btn","type":"Button","props":{"label":"Apply Filters","variant":"primary","action":{"name":"apply_filter"},"disabled":null}}}
{"op":"add","path":"/elements/refresh-btn","value":{"key":"refresh-btn","type":"Button","props":{"label":"Refresh","variant":"secondary","action":{"name":"refresh_data"},"disabled":null}}}

{"op":"add","path":"/elements/metrics-grid","value":{"key":"metrics-grid","type":"Grid","props":{"columns":2,"gap":"md"},"children":["metric-revenue","metric-growth","metric-customers","metric-orders"]}}
{"op":"add","path":"/elements/metric-revenue","value":{"key":"metric-revenue","type":"Metric","props":{"label":"Total Revenue","valuePath":"/analytics/revenue","format":"currency","trend":"up","trendValue":"+15% vs last month"}}}
{"op":"add","path":"/elements/metric-growth","value":{"key":"metric-growth","type":"Metric","props":{"label":"Growth Rate","valuePath":"/analytics/growth","format":"percent","trend":"up","trendValue":"+2.3%"}}}
{"op":"add","path":"/elements/metric-customers","value":{"key":"metric-customers","type":"Metric","props":{"label":"Total Customers","valuePath":"/analytics/customers","format":"number","trend":"up","trendValue":"+42 new"}}}
{"op":"add","path":"/elements/metric-orders","value":{"key":"metric-orders","type":"Metric","props":{"label":"Pending Orders","valuePath":"/analytics/orders","format":"number","trend":"down","trendValue":"-13 from yesterday"}}}

{"op":"add","path":"/elements/content-stack","value":{"key":"content-stack","type":"Stack","props":{"direction":"vertical","gap":"md","align":"stretch"},"children":["chart-section","table-section"]}}
{"op":"add","path":"/elements/chart-section","value":{"key":"chart-section","type":"Card","props":{"title":"Sales Distribution","description":"Revenue by geographic region","padding":"md"},"children":["chart-stack"]}}
{"op":"add","path":"/elements/chart-stack","value":{"key":"chart-stack","type":"Stack","props":{"direction":"vertical","gap":"sm","align":"stretch"},"children":["sales-chart","chart-note","chart-badges"]}}
{"op":"add","path":"/elements/sales-chart","value":{"key":"sales-chart","type":"Chart","props":{"type":"bar","dataPath":"/analytics/salesByRegion","title":null,"height":160}}}
{"op":"add","path":"/elements/chart-note","value":{"key":"chart-note","type":"Text","props":{"content":"Data shows US leading with $45K in sales, followed by EU at $35K.","variant":"caption","color":"muted"}}}
{"op":"add","path":"/elements/chart-badges","value":{"key":"chart-badges","type":"Stack","props":{"direction":"horizontal","gap":"sm","align":"center"},"children":["badge-1","badge-2","badge-3"]}}
{"op":"add","path":"/elements/badge-1","value":{"key":"badge-1","type":"Badge","props":{"text":"4 Regions","variant":"info"}}}
{"op":"add","path":"/elements/badge-2","value":{"key":"badge-2","type":"Badge","props":{"text":"+$125K Total","variant":"success"}}}
{"op":"add","path":"/elements/badge-3","value":{"key":"badge-3","type":"Badge","props":{"text":"Updated Today","variant":"default"}}}

{"op":"add","path":"/elements/table-section","value":{"key":"table-section","type":"Card","props":{"title":"Recent Transactions","description":"Latest customer orders with status tracking","padding":"md"},"children":["table-stack"]}}
{"op":"add","path":"/elements/table-stack","value":{"key":"table-stack","type":"Stack","props":{"direction":"vertical","gap":"sm","align":"stretch"},"children":["transactions-table","table-actions"]}}
{"op":"add","path":"/elements/transactions-table","value":{"key":"transactions-table","type":"Table","props":{"title":null,"dataPath":"/analytics/recentTransactions","columns":[{"key":"id","label":"Transaction ID","format":"text"},{"key":"customer","label":"Customer","format":"text"},{"key":"amount","label":"Amount","format":"currency"},{"key":"status","label":"Status","format":"badge"},{"key":"date","label":"Date","format":"date"}]}}}
{"op":"add","path":"/elements/table-actions","value":{"key":"table-actions","type":"Stack","props":{"direction":"horizontal","gap":"sm","align":"center"},"children":["view-details-btn"]}}
{"op":"add","path":"/elements/view-details-btn","value":{"key":"view-details-btn","type":"Button","props":{"label":"View All Transactions","variant":"secondary","action":{"name":"view_details"},"disabled":null}}}

{"op":"add","path":"/elements/footer-section","value":{"key":"footer-section","type":"Stack","props":{"direction":"vertical","gap":"sm","align":"stretch"},"children":["divider-2","footer-text"]}}
{"op":"add","path":"/elements/divider-2","value":{"key":"divider-2","type":"Divider","props":{"label":"Summary"}}}
{"op":"add","path":"/elements/footer-text","value":{"key":"footer-text","type":"Text","props":{"content":"Dashboard displaying 4 key metrics, 1 sales chart, and 4 recent transactions. Use filters above to customize your view.","variant":"body","color":"default"}}}
`;

export const MOCK_PATCHES_TABLE_ONLY = `{"op":"set","path":"/root","value":"root-stack"}
{"op":"add","path":"/elements/root-stack","value":{"key":"root-stack","type":"Stack","props":{"direction":"vertical","gap":"md","align":"stretch"},"children":["table-heading","table-card","empty-demo","status-badges"]}}

{"op":"add","path":"/elements/table-heading","value":{"key":"table-heading","type":"Heading","props":{"text":"Transaction History","level":"h2"}}}

{"op":"add","path":"/elements/table-card","value":{"key":"table-card","type":"Card","props":{"title":"All Transactions","description":"Complete list of customer transactions","padding":"md"},"children":["transactions-table"]}}
{"op":"add","path":"/elements/transactions-table","value":{"key":"transactions-table","type":"Table","props":{"title":null,"dataPath":"/analytics/recentTransactions","columns":[{"key":"id","label":"ID","format":"text"},{"key":"customer","label":"Customer","format":"text"},{"key":"amount","label":"Amount","format":"currency"},{"key":"status","label":"Status","format":"badge"},{"key":"date","label":"Date","format":"date"}]}}}

{"op":"add","path":"/elements/empty-demo","value":{"key":"empty-demo","type":"Empty","props":{"title":"No More Records","description":"You've reached the end of the transaction list."}}}

{"op":"add","path":"/elements/status-badges","value":{"key":"status-badges","type":"Stack","props":{"direction":"horizontal","gap":"sm","align":"center"},"children":["badge-success","badge-pending","badge-danger","badge-info"]}}
{"op":"add","path":"/elements/badge-success","value":{"key":"badge-success","type":"Badge","props":{"text":"Completed","variant":"success"}}}
{"op":"add","path":"/elements/badge-pending","value":{"key":"badge-pending","type":"Badge","props":{"text":"Pending","variant":"warning"}}}
{"op":"add","path":"/elements/badge-danger","value":{"key":"badge-danger","type":"Badge","props":{"text":"Failed","variant":"danger"}}}
{"op":"add","path":"/elements/badge-info","value":{"key":"badge-info","type":"Badge","props":{"text":"Processing","variant":"info"}}}
`;

