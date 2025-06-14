export const sqlConnection = initSqlJs({
  locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
}).then(SQL => new SQL.Database());

export const tableSchemas = {
  zendesk_tickets: [
    { name: "z_datetime", type: "unique" },
    { name: "creator", type: "user" },
    { name: "assignee", type: "user" },
    { name: "platform", type: "enumerable" },
    { name: "company", type: "group" },
    { name: "avg_resolution_time", type: "metric" },
    { name: "avg_nps_score", type: "metric" }
  ],
  conversation_data: [
    { name: "c_datetime", type: "unique" },
    { name: "direction", type: "enumerable" },
    { name: "agent", type: "user" },
    { name: "next_party", type: "user" },
    { name: "previous_party", type: "user" },
    { name: "avg_handle_time", type: "metric" }
  ],
  queue_data: [
    { name: "q_datetime", type: "unique" },
    { name: "next_party", type: "user" },
    { name: "previous_party", type: "user" },
    { name: "queue", type: "group" },
    { name: "avg_wait_time", type: "metric" }
  ]
};
export const tableNames = Object.keys(tableSchemas);

sqlConnection.then(db => {
  db.run(`CREATE TABLE zendesk_tickets (
    z_datetime datetime,       -- unique
    creator text,            -- user
    assignee text,           -- user
    platform text,           -- enumerable
    company text,            -- group
    avg_resolution_time int, -- metric
    avg_nps_score int        -- metric
  );`);
  db.run(`CREATE TABLE conversation_data (
    c_datetime datetime,       -- unique
    direction text,          -- enumerable
    agent text,              -- user
    next_party text,         -- user
    previous_party text,     -- user
    avg_handle_time int      -- metric
  );`);
  db.run(`CREATE TABLE queue_data (
    q_datetime datetime,       -- unique
    next_party text,         -- user
    previous_party text,     -- user
    queue text,              -- group
    avg_wait_time int        -- metric
  );`);
  db.run(`
    INSERT INTO zendesk_tickets VALUES 
      ('2025-06-01', 'Alice',   'George',  'Telecom',     'AcmeCorp', 12, 8),
      ('2025-06-02', 'Bob',     'Helen',   'Retail',      'BetaInc',  15, 9),
      ('2025-06-03', 'Carol',   'Ian',     'E-Commerce',  'AcmeCorp', 8,  7),
      ('2025-06-04', 'Dave',    'Alice',   'Telecom',     'DeltaLLC', 20, 6),
      ('2025-06-05', 'Eve',     'Bob',     'Retail',      'AcmeCorp', 13, 10),
      ('2025-06-06', 'Frank',   'Carol',   'E-Commerce',  'BetaInc',  11, 7),
      ('2025-06-07', 'George',  'Dave',    'Telecom',     'DeltaLLC', 9,  8),
      ('2025-06-08', 'Helen',   'Eve',     'Retail',      'AcmeCorp', 17, 9),
      ('2025-06-09', 'Ian',     'Frank',   'E-Commerce',  'BetaInc',  14, 6),
      ('2025-06-10', 'Alice',   'Helen',   'Telecom',     'AcmeCorp', 10, 8);
  `);
  db.run(`
    INSERT INTO conversation_data VALUES 
      ('2025-06-01', 'Inbound',  'George',  'Alice',   'Dave',   5),
      ('2025-06-02', 'Outbound', 'Helen',   'Bob',     'Eve',    6),
      ('2025-06-03', 'Inbound',  'Ian',     'Carol',   'Frank',  7),
      ('2025-06-04', 'Outbound', 'Alice',   'Dave',    'George', 4),
      ('2025-06-05', 'Inbound',  'Bob',     'Eve',     'Helen',  8),
      ('2025-06-06', 'Outbound', 'Carol',   'Frank',   'Ian',    6),
      ('2025-06-07', 'Inbound',  'Dave',    'George',  'Alice',  7),
      ('2025-06-08', 'Outbound', 'Eve',     'Helen',   'Bob',    5),
      ('2025-06-09', 'Inbound',  'Frank',   'Ian',     'Carol',  9),
      ('2025-06-10', 'Outbound', 'George',  'Alice',   'Dave',   6);
`);
  db.run(`
    INSERT INTO queue_data VALUES 
      ('2025-06-01', 'Alice',   'George', 'Support',     3),
      ('2025-06-02', 'Bob',     'Helen',  'Sales',       4),
      ('2025-06-03', 'Carol',   'Ian',    'Support',     2),
      ('2025-06-04', 'Dave',    'Alice',  'Billing',     5),
      ('2025-06-05', 'Eve',     'Bob',    'Support',     3),
      ('2025-06-06', 'Frank',   'Carol',  'Sales',       6),
      ('2025-06-07', 'George',  'Dave',   'Billing',     4),
      ('2025-06-08', 'Helen',   'Eve',    'Support',     2),
      ('2025-06-09', 'Ian',     'Frank',  'Sales',       5),
      ('2025-06-10', 'Alice',   'Helen',  'Billing',     3);
`);
});
