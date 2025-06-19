export const sqlConnection = initSqlJs({
  locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
}).then(SQL => new SQL.Database());

export const tableSchemas = {
  "Conversation Data": [ // table name = conversation_data
    {
      name: "date",
      label: "Date",
      group: "enumerable",
      type: "datetime"
    },
    {
      name: "direction",
      label: "Direction",
      group: "enumerable",
      type: "text"
    },
    {
      name: "agent",
      label: "Agent Name",
      group: "user",
      type: "text"
    },
    {
      name: "next_party",
      label: "Next Party Name",
      group: "user",
      type: "text"
    },
    {
      name: "previous_party",
      label: "Previous Party Name",
      group: "user",
      type: "text"
    },
    {
      name: "talk_time",
      label: "Average Talk Time",
      group: "metric",
      type: "float",
      aggregator: "AVG(VALUE)",
    },
    {
      name: "hold_time",
      label: "Average Hold Time",
      group: "metric",
      type: "float",
      aggregator: "AVG(VALUE)",
    },
  ],
  "Queue Data": [ // table name = queue_data
    {
      name: "date",
      label: "Date",
      group: "enumerable",
      type: "datetime"
    },
    {
      name: "answering_party",
      label: "Answering Party",
      group: "user",
      type: "text"
    },
    {
      name: "queue",
      label: "Queue Name",
      group: "group",
      type: "text"
    },
    {
      name: "wait_time",
      label: "Average Wait Time",
      group: "metric",
      type: "float",
      aggregator: "AVG(VALUE)",
    },
    {
      name: "abandoned",
      label: "# Abandoned",
      group: "metric",
      type: "int",
      aggregator: "SUM(VALUE)",
    },
    {
      name: "answered",
      label: "# Answered",
      group: "metric",
      type: "int",
      aggregator: "SUM(VALUE)",
    },
  ],
  "Survey Data": [ // table name = survey_data
    {
      name: "date",
      label: "Date",
      group: "enumerable",
      type: "datetime"
    },
    {
      name: "agent",
      label: "Agent Name",
      group: "user",
      type: "text"
    },
    {
      name: "survey",
      label: "Survey Name",
      group: "enumerable",
      type: "text"
    },
    {
      name: "csat",
      label: "Average CSAT(1-5)",
      group: "metric",
      type: "float",
      aggregator: "AVG(VALUE)",
    },
  ],
  "Voice Analytics": [ // table name = voice_analytics
    {
      name: "date",
      label: "Date",
      group: "enumerable",
      type: "datetime"
    },
    {
      name: "agent",
      label: "Agent Name",
      group: "user",
      type: "text"
    },
    {
      name: "sentiment",
      label: "Average Sentiment(1-10)",
      group: "metric",
      type: "float",
      aggregator: "AVG(VALUE)",
    },
    {
      name: "overtalk",
      label: "Average Overtalk %",
      group: "metric",
      type: "float",
      aggregator: "AVG(VALUE)",
    },
  ],
};
export const tableLabels = Object.keys(tableSchemas);
export const tableNames = tableLabels.map(n => {
  const key = n.toLowerCase().replace(" ", "_");
  tableSchemas[key] = tableSchemas[n].slice();
  return key;
});

sqlConnection.then(db => {
  db.run(`CREATE TABLE survey_data (
    date datetime,
    agent text,
    survey text,
    csat decimal(10,2)
  );`);
  db.run(`CREATE TABLE conversation_data (
    date datetime,
    direction text,
    agent text,
    next_party text,
    previous_party text,
    talk_time decimal(10,2),
    hold_time decimal(10,2)
  );`);
  db.run(`CREATE TABLE queue_data (
    date datetime,
    answering_party text,
    queue text,
    wait_time decimal(10,2),
    abandoned decimal(10,2),
    answered decimal(10,2)
  );`);
  db.run(`CREATE TABLE voice_analytics (
    date datetime,
    agent text,
    sentiment decimal(10,2),
    overtalk decimal(10,2)
  );`);
  //
  // Conversation Data
  //
  db.run(`
    INSERT INTO conversation_data VALUES
      ('2025-06-01', 'Inbound',  'Alice',   'Bob',     'Carol',    245.5, 15.2),
      ('2025-06-02', 'Outbound', 'Bob',     'Carol',   'Alice',    180.3, 8.7),
      ('2025-06-03', 'Inbound',  'Carol',   'Dave',    'Bob',      320.1, 22.4),
      ('2025-06-04', 'Inbound',  'Dave',    'Eve',     'Carol',    195.8, 12.1),
      ('2025-06-05', 'Outbound', 'Eve',     'Frank',   'Dave',     275.6, 18.9),
      ('2025-06-06', 'Inbound',  'Frank',   'George',  'Eve',      165.4, 9.3),
      ('2025-06-07', 'Inbound',  'George',  'Helen',   'Frank',    298.7, 25.6),
      ('2025-06-08', 'Outbound', 'Helen',   'Ian',     'George',   210.2, 14.8),
      ('2025-06-09', 'Inbound',  'Ian',     'Alice',   'Helen',    255.9, 19.7),
      ('2025-06-09', 'Inbound',  'Joey',    'Alice',   'Helen',    155.9, 29.7),
      ('2025-06-10', 'Inbound',  'Alice',   'Carol',   'Ian',      188.3, 11.5);
  `);
  //
  // Queue Data
  //
  db.run(`
    INSERT INTO queue_data VALUES
      ('2025-06-01', 'Alice',   'Customer Support',   125.4, 3, 39),
      ('2025-06-02', 'Bob',     'Sales',              89.7,  1, 96),
      ('2025-06-03', 'Carol',   'Technical Support',  156.8, 5, 44),
      ('2025-06-04', 'Dave',    'Customer Support',   98.2,  2,  6),
      ('2025-06-05', 'Eve',     'Billing',            142.3, 4, 16),
      ('2025-06-06', 'Frank',   'Sales',              76.9,  1,  2),
      ('2025-06-07', 'George',  'Technical Support',  189.5, 7,  9),
      ('2025-06-08', 'Helen',   'Customer Support',   112.1, 3,  3),
      ('2025-06-09', 'Ian',     'Billing',            134.7, 2,  8),
      ('2025-06-09', 'Larry',   'Billing',            104.7, 5,  7),
      ('2025-06-10', 'Alice',   'Sales',              95.6,  1,  4);
  `);
  //
  // Survey Data
  //
  db.run(`
    INSERT INTO survey_data VALUES
      ('2025-06-01', 'Alice',   'Post-Call Survey',     4.2),
      ('2025-06-02', 'Bob',     'Weekly Check-in',      3.8),
      ('2025-06-03', 'Carol',   'Post-Call Survey',     4.7),
      ('2025-06-04', 'Dave',    'Monthly Feedback',     3.5),
      ('2025-06-05', 'Eve',     'Post-Call Survey',     4.9),
      ('2025-06-06', 'Frank',   'Weekly Check-in',      4.1),
      ('2025-06-07', 'George',  'Post-Call Survey',     3.2),
      ('2025-06-08', 'Helen',   'Monthly Feedback',     4.6),
      ('2025-06-09', 'Ian',     'Post-Call Survey',     4.0),
      ('2025-06-09', 'Dean',    'Post-Call Survey',     4.9),
      ('2025-06-10', 'Alice',   'Weekly Check-in',      4.4);
  `);
  //
  // Voice Analytics
  //
  db.run(`
    INSERT INTO voice_analytics VALUES
      ('2025-06-01', 'Alice',   7.8, 12.5),
      ('2025-06-02', 'Bob',     8.2, 8.3),
      ('2025-06-03', 'Carol',   6.9, 15.7),
      ('2025-06-04', 'Dave',    8.7, 6.2),
      ('2025-06-05', 'Eve',     7.1, 18.4),
      ('2025-06-06', 'Frank',   8.9, 4.8),
      ('2025-06-07', 'George',  5.4, 22.1),
      ('2025-06-08', 'Helen',   8.5, 9.7),
      ('2025-06-09', 'Ian',     7.6, 14.3),
      ('2025-06-09', 'Doug',    0.0, 24.3),
      ('2025-06-10', 'Alice',   8.0, 11.2);
  `);
});
