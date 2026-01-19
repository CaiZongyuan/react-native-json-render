export const MOCK_PATCHES_DASHBOARD = `{"op":"set","path":"/root","value":"root-card"}
{"op":"add","path":"/elements/root-card","value":{"key":"root-card","type":"Card","props":{"title":"Revenue Dashboard","description":"Mock data rendered locally","padding":"md"},"children":["filters-card","metrics-grid","chart-card","table-card"]}}

{"op":"add","path":"/elements/filters-card","value":{"key":"filters-card","type":"Card","props":{"title":"Filters","description":null,"padding":"md"},"children":["filters-stack"]}}
{"op":"add","path":"/elements/filters-stack","value":{"key":"filters-stack","type":"Stack","props":{"direction":"horizontal","gap":"md","align":"center"},"children":["region-select","date-input","apply-btn"]}}
{"op":"add","path":"/elements/region-select","value":{"key":"region-select","type":"Select","props":{"label":"Region","bindPath":"/form/region","placeholder":"Pick a region","options":[{"value":"all","label":"All"},{"value":"us","label":"US"},{"value":"eu","label":"EU"},{"value":"asia","label":"Asia"}]}}}
{"op":"add","path":"/elements/date-input","value":{"key":"date-input","type":"DatePicker","props":{"label":"Date Range","bindPath":"/form/dateRange","placeholder":"YYYY-MM-DD"}}}
{"op":"add","path":"/elements/apply-btn","value":{"key":"apply-btn","type":"Button","props":{"label":"Apply","variant":"secondary","action":{"name":"apply_filter"},"disabled":null}}}

{"op":"add","path":"/elements/metrics-grid","value":{"key":"metrics-grid","type":"Grid","props":{"columns":2,"gap":"md"},"children":["metric-revenue","metric-growth","metric-customers","metric-orders"]}}
{"op":"add","path":"/elements/metric-revenue","value":{"key":"metric-revenue","type":"Metric","props":{"label":"Total Revenue","valuePath":"/analytics/revenue","format":"currency","trend":"up","trendValue":"+15%"}}}
{"op":"add","path":"/elements/metric-growth","value":{"key":"metric-growth","type":"Metric","props":{"label":"Growth","valuePath":"/analytics/growth","format":"percent","trend":"neutral","trendValue":"0.0%"}}}
{"op":"add","path":"/elements/metric-customers","value":{"key":"metric-customers","type":"Metric","props":{"label":"Customers","valuePath":"/analytics/customers","format":"number","trend":"up","trendValue":"+42"}}}
{"op":"add","path":"/elements/metric-orders","value":{"key":"metric-orders","type":"Metric","props":{"label":"Orders","valuePath":"/analytics/orders","format":"number","trend":"down","trendValue":"-13"}}}

{"op":"add","path":"/elements/chart-card","value":{"key":"chart-card","type":"Card","props":{"title":"Sales by Region","description":null,"padding":"md"},"children":["sales-chart"]}}
{"op":"add","path":"/elements/sales-chart","value":{"key":"sales-chart","type":"Chart","props":{"type":"bar","dataPath":"/analytics/salesByRegion","title":null,"height":140}}}

{"op":"add","path":"/elements/table-card","value":{"key":"table-card","type":"Card","props":{"title":"Recent Transactions","description":null,"padding":"md"},"children":["transactions-table"]}}
{"op":"add","path":"/elements/transactions-table","value":{"key":"transactions-table","type":"Table","props":{"title":null,"dataPath":"/analytics/recentTransactions","columns":[{"key":"id","label":"ID","format":"text"},{"key":"customer","label":"Customer","format":"text"},{"key":"amount","label":"Amount","format":"currency"},{"key":"status","label":"Status","format":"badge"},{"key":"date","label":"Date","format":"date"}]}}}
`;

export const MOCK_PATCHES_TABLE_ONLY = `{"op":"set","path":"/root","value":"root-table-card"}
{"op":"add","path":"/elements/root-table-card","value":{"key":"root-table-card","type":"Card","props":{"title":"Transactions (Mock)","description":"Table rendering sanity check","padding":"md"},"children":["transactions-table"]}}
{"op":"add","path":"/elements/transactions-table","value":{"key":"transactions-table","type":"Table","props":{"title":null,"dataPath":"/analytics/recentTransactions","columns":[{"key":"id","label":"ID","format":"text"},{"key":"customer","label":"Customer","format":"text"},{"key":"amount","label":"Amount","format":"currency"},{"key":"status","label":"Status","format":"badge"},{"key":"date","label":"Date","format":"date"}]}}}
`;

