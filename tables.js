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
  // XL Conversation Data
  db.run(`CREATE TABLE conversation_data (
    date datetime,
    direction text,
    agent text,
    next_party text,
    previous_party text,
    talk_time decimal,
    hold_time decimal
  );`);

  db.run(`
    INSERT INTO conversation_data VALUES
      ('2025-06-01', 'Inbound',  'Alice',     'Bob',       'Carol',      245.517, 15.213),
      ('2025-06-01', 'Outbound', 'Bob',       'Dave',      'Alice',      189.317, 12.413),
      ('2025-06-01', 'Inbound',  'Carol',     'Eve',       'Bob',        302.117, 18.713),
      ('2025-06-01', 'Inbound',  'Dave',      'Frank',     'Carol',      156.817, 9.113),
      ('2025-06-01', 'Outbound', 'Eve',       'George',    'Dave',       278.417, 21.313),

      ('2025-06-02', 'Outbound', 'Bob',       'Carol',     'Alice',      180.35, 8.75),
      ('2025-06-02', 'Inbound',  'George',    'Ian',       'Frank',      234.717, 16.913),
      ('2025-06-02', 'Inbound',  'Helen',     'Joey',      'George',     167.51, 11.25),
      ('2025-06-02', 'Outbound', 'Ian',       'Alice',     'Helen',      298.617, 19.813),
      ('2025-06-02', 'Inbound',  'Joey',      'Bob',       'Ian',        145.917, 7.35),

      ('2025-06-03', 'Inbound',  'Carol',     'Dave',      'Bob',        320.15, 22.45),
      ('2025-06-03', 'Outbound', 'Dave',      'Eve',       'Carol',      187.45, 10.65),
      ('2025-06-03', 'Inbound',  'Eve',       'Frank',     'Dave',       265.85, 17.25),
      ('2025-06-03', 'Inbound',  'Frank',     'George',    'Eve',        142.35, 8.95),
      ('2025-06-03', 'Outbound', 'George',    'Helen',     'Frank',      289.72, 20.15),

      ('2025-06-04', 'Inbound',  'Dave',      'Eve',       'Carol',      195.85, 12.15),
      ('2025-06-04', 'Outbound', 'Ian',       'Joey',      'Helen',      156.25, 9.45),
      ('2025-06-04', 'Inbound',  'Joey',      'Alice',     'Ian',        278.95, 18.65),
      ('2025-06-04', 'Inbound',  'Alice',     'Bob',       'Joey',       189.15, 11.71),
      ('2025-06-04', 'Outbound', 'Bob',       'Carol',     'Alice',      234.55, 15.35),

      ('2025-06-05', 'Outbound', 'Eve',       'Frank',     'Dave',       275.65, 18.95),
      ('2025-06-05', 'Inbound',  'Frank',     'George',    'Eve',        201.35, 13.45),
      ('2025-06-05', 'Inbound',  'George',    'Helen',     'Frank',      147.26, 6.85),
      ('2025-06-05', 'Outbound', 'Helen',     'Ian',       'George',     293.41, 23.113),
      ('2025-06-05', 'Inbound',  'Ian',       'Joey',      'Helen',      164.717, 14.55),

      ('2025-06-06', 'Inbound',  'Frank',     'George',    'Eve',        165.46, 9.36),
      ('2025-06-06', 'Outbound', 'Alice',     'Bob',       'Frank',      207.817, 16.26),
      ('2025-06-06', 'Inbound',  'Bob',       'Carol',     'Alice',      251.217, 13.85),
      ('2025-06-06', 'Inbound',  'Carol',     'Dave',      'Bob',        186.96, 10.76),
      ('2025-06-06', 'Outbound', 'Dave',      'Eve',       'Carol',      312.65, 24.31),

      ('2025-06-07', 'Inbound',  'George',    'Helen',     'Frank',      298.77, 25.66),
      ('2025-06-07', 'Outbound', 'Helen',     'Ian',       'George',     173.41, 8.26),
      ('2025-06-07', 'Inbound',  'Ian',       'Joey',      'Helen',      229.11, 17.86),
      ('2025-06-07', 'Inbound',  'Joey',      'Alice',     'Ian',        154.61, 12.96),
      ('2025-06-07', 'Outbound', 'Alice',     'Bob',       'Joey',       287.32, 21.76),

      ('2025-06-08', 'Outbound', 'Helen',     'Ian',       'George',     210.26, 14.86),
      ('2025-06-08', 'Inbound',  'Ian',       'Joey',      'Helen',      176.87, 11.41),
      ('2025-06-08', 'Inbound',  'Joey',      'Alice',     'Ian',        241.72, 19.27),
      ('2025-06-08', 'Outbound', 'Alice',     'Bob',       'Joey',       163.16, 7.91),
      ('2025-06-08', 'Inbound',  'Bob',       'Carol',     'Alice',      296.47, 22.82),

      ('2025-06-09', 'Inbound',  'Ian',       'Alice',     'Helen',      255.97, 19.77),
      ('2025-06-09', 'Inbound',  'Joey',      'Alice',     'Helen',      155.97, 29.77),
      ('2025-06-09', 'Outbound', 'Alice',     'Bob',       'Joey',       192.62, 13.12),
      ('2025-06-09', 'Inbound',  'Bob',       'Carol',     'Alice',      268.17, 16.42),
      ('2025-06-09', 'Inbound',  'Carol',     'Dave',      'Bob',        149.77, 8.62),

      ('2025-06-10', 'Inbound',  'Alice',     'Carol',     'Ian',        188.37, 11.57),
      ('2025-06-10', 'Outbound', 'Bob',       'Dave',      'Alice',      224.92, 15.72),
      ('2025-06-10', 'Inbound',  'Carol',     'Eve',       'Bob',        171.27, 9.82),
      ('2025-06-10', 'Inbound',  'Dave',      'Frank',     'Carol',      304.87, 26.42),
      ('2025-06-10', 'Outbound', 'Eve',       'George',    'Dave',       197.42, 12.32);
  `);

  // XL Queue Data
  db.run(`CREATE TABLE queue_data (
    date datetime,
    answering_party text,
    queue text,
    wait_time decimal,
    abandoned decimal,
    answered decimal
  );`);

  db.run(`
    INSERT INTO queue_data VALUES
      ('2025-06-01', 'Alice',   'Customer Support',     125.43, 3.01, 39.01),
      ('2025-06-01', 'Bob',     'Sales',                89.73, 1.01, 96.01),
      ('2025-06-01', 'Carol',   'Technical Support',    156.83, 5.01, 44.01),
      ('2025-06-01', 'Dave',    'Billing',              98.28, 2.01, 67.01),
      ('2025-06-01', 'Eve',     'Customer Support',     142.38, 4.01, 16.01),

      ('2025-06-02', 'Frank',   'Sales',                76.98, 6.01, 23.01),
      ('2025-06-02', 'George',  'Technical Support',    189.53, 7.01, 91.01),
      ('2025-06-02', 'Helen',   'Customer Support',     112.18, 8.01, 33.01),
      ('2025-06-02', 'Ian',     'Billing',              134.78, 9.01, 85.01),
      ('2025-06-02', 'Joey',    'Sales',                95.63, 10.01, 42.01),

      ('2025-06-03', 'Alice',   'Technical Support',    203.48, 11.01, 58.01),
      ('2025-06-03', 'Bob',     'Customer Support',     87.33, 12.01, 74.01),
      ('2025-06-03', 'Carol',   'Billing',              167.88, 13.01, 29.01),
      ('2025-06-03', 'Dave',    'Sales',                143.23, 14.01, 83.01),
      ('2025-06-03', 'Eve',     'Technical Support',    198.78, 15.01, 51.01),

      ('2025-06-04', 'Frank',   'Customer Support',     119.68, 17.01, 66.01),
      ('2025-06-04', 'George',  'Billing',              178.43, 18.01, 37.01),
      ('2025-06-04', 'Helen',   'Sales',                91.88, 19.01, 79.01),
      ('2025-06-04', 'Ian',     'Technical Support',    154.33, 20.01, 45.01),
      ('2025-06-04', 'Joey',    'Customer Support',     207.93, 21.01, 88.01),

      ('2025-06-05', 'Alice',   'Billing',              126.18, 22.01, 54.01),
      ('2025-06-05', 'Bob',     'Sales',                183.73, 24.01, 76.01),
      ('2025-06-05', 'Carol',   'Technical Support',    99.48, 25.01, 32.01),
      ('2025-06-05', 'Dave',    'Customer Support',     161.83, 26.01, 89.01),
      ('2025-06-05', 'Eve',     'Billing',              194.28, 27.01, 47.01),

      ('2025-06-06', 'Frank',   'Sales',                108.38, 28.01, 73.01),
      ('2025-06-06', 'George',  'Technical Support',    172.93, 30.01, 38.01),
      ('2025-06-06', 'Helen',   'Customer Support',     135.58, 31.01, 86.01),
      ('2025-06-06', 'Ian',     'Billing',              201.13, 32.01, 49.01),
      ('2025-06-06', 'Joey',    'Sales',                84.78, 34.01, 77.01),

      ('2025-06-07', 'Alice',   'Technical Support',    159.23, 35.01, 41.01),
      ('2025-06-07', 'Bob',     'Customer Support',     118.83, 36.01, 82.01),
      ('2025-06-07', 'Carol',   'Billing',              186.48, 37.01, 53.01),
      ('2025-06-07', 'Dave',    'Sales',                92.68, 38.01, 78.01),
      ('2025-06-07', 'Eve',     'Technical Support',    174.33, 40.01, 46.01),

      ('2025-06-08', 'Frank',   'Customer Support',     141.98, 41.01, 84.01),
      ('2025-06-08', 'George',  'Billing',              205.63, 43.01, 52.01),
      ('2025-06-08', 'Helen',   'Sales',                97.28, 44.01, 75.01),
      ('2025-06-08', 'Ian',     'Technical Support',    163.88, 45.01, 48.01),
      ('2025-06-08', 'Joey',    'Customer Support',     129.53, 46.01, 87.01),

      ('2025-06-09', 'Alice',   'Billing',              191.18, 47.01, 56.01),
      ('2025-06-09', 'Bob',     'Sales',                114.73, 48.01, 81.01),
      ('2025-06-09', 'Carol',   'Technical Support',    177.38, 49.01, 43.01),
      ('2025-06-09', 'Dave',    'Customer Support',     103.93, 50.01, 90.01),
      ('2025-06-09', 'Eve',     'Billing',              168.58, 52.01, 55.01),

      ('2025-06-10', 'Frank',   'Sales',                132.23, 53.01, 72.01),
      ('2025-06-10', 'George',  'Technical Support',    196.88, 54.01, 57.01),
      ('2025-06-10', 'Helen',   'Customer Support',     121.43, 56.01, 92.01),
      ('2025-06-10', 'Ian',     'Billing',              185.78, 57.01, 59.01),
      ('2025-06-10', 'Joey',    'Sales',                107.63, 58.01, 93.01);
  `);

  // XL Survey Data
  db.run(`CREATE TABLE survey_data (
    date datetime,
    agent text,
    survey text,
    csat decimal
  );`);

  db.run(`
    INSERT INTO survey_data VALUES
      ('2025-06-01', 'Alice',   'Post-Call Survey',       4.121),
      ('2025-06-01', 'Bob',     'Weekly Check-in',        3.81),
      ('2025-06-01', 'Carol',   'Monthly Feedback',       4.171),
      ('2025-06-01', 'Dave',    'Post-Call Survey',       3.51),
      ('2025-06-01', 'Eve',     'Customer Experience',    4.91),

      ('2025-06-02', 'Frank',   'Post-Call Survey',       4.11),
      ('2025-06-02', 'George',  'Weekly Check-in',        3.126),
      ('2025-06-02', 'Helen',   'Monthly Feedback',       4.66),
      ('2025-06-02', 'Ian',     'Post-Call Survey',       4.106),
      ('2025-06-02', 'Joey',    'Customer Experience',    3.96),

      ('2025-06-03', 'Alice',   'Weekly Check-in',        4.36),
      ('2025-06-03', 'Bob',     'Post-Call Survey',       3.116),
      ('2025-06-03', 'Carol',   'Customer Experience',    4.86),
      ('2025-06-03', 'Dave',    'Monthly Feedback',       3.176),
      ('2025-06-03', 'Eve',     'Post-Call Survey',       4.56),

      ('2025-06-04', 'Frank',   'Weekly Check-in',        3.46),
      ('2025-06-04', 'George',  'Post-Call Survey',       4.126),
      ('2025-06-04', 'Helen',   'Customer Experience',    3.86),
      ('2025-06-04', 'Ian',     'Monthly Feedback',       4.176),
      ('2025-06-04', 'Joey',    'Post-Call Survey',       3.66),

      ('2025-06-05', 'Alice',   'Customer Experience',    4.46),
      ('2025-06-05', 'Bob',     'Post-Call Survey',       3.136),
      ('2025-06-05', 'Carol',   'Weekly Check-in',        4.96),
      ('2025-06-05', 'Dave',    'Monthly Feedback',       3.156),
      ('2025-06-05', 'Eve',     'Post-Call Survey',       4.16),

      ('2025-06-06', 'Frank',   'Customer Experience',    3.91),
      ('2025-06-06', 'George',  'Post-Call Survey',       4.161),
      ('2025-06-06', 'Helen',   'Weekly Check-in',        3.71),
      ('2025-06-06', 'Ian',     'Monthly Feedback',       4.131),
      ('2025-06-06', 'Joey',    'Post-Call Survey',       3.41),

      ('2025-06-07', 'Alice',   'Weekly Check-in',        4.81),
      ('2025-06-07', 'Bob',     'Post-Call Survey',       3.121),
      ('2025-06-07', 'Carol',   'Customer Experience',    4.41),
      ('2025-06-07', 'Dave',    'Monthly Feedback',       3.161),
      ('2025-06-07', 'Eve',     'Post-Call Survey',       4.07),

      ('2025-06-08', 'Frank',   'Weekly Check-in',        3.31),
      ('2025-06-08', 'George',  'Post-Call Survey',       4.151),
      ('2025-06-08', 'Helen',   'Customer Experience',    3.06),
      ('2025-06-08', 'Ian',     'Monthly Feedback',       4.187),
      ('2025-06-08', 'Joey',    'Post-Call Survey',       3.77),

      ('2025-06-09', 'Alice',   'Customer Experience',    4.27),
      ('2025-06-09', 'Bob',     'Post-Call Survey',       3.111),
      ('2025-06-09', 'Carol',   'Weekly Check-in',        4.72),
      ('2025-06-09', 'Dave',    'Monthly Feedback',       3.197),
      ('2025-06-09', 'Eve',     'Post-Call Survey',       4.37),

      ('2025-06-10', 'Frank',   'Weekly Check-in',        3.87),
      ('2025-06-10', 'George',  'Post-Call Survey',       4.157),
      ('2025-06-10', 'Helen',   'Customer Experience',    3.27),
      ('2025-06-10', 'Ian',     'Monthly Feedback',       4.167),
      ('2025-06-10', 'Joey',    'Post-Call Survey',       3.47);
  `);

  // XL Voice Analytics
  db.run(`CREATE TABLE voice_analytics (
    date datetime,
    agent text,
    sentiment decimal,
    overtalk decimal
  );`);

  db.run(`
    INSERT INTO voice_analytics VALUES
      ('2025-06-01', 'Alice',   7.81, 12.51),
      ('2025-06-01', 'Bob',     8.21, 8.31),
      ('2025-06-01', 'Carol',   6.91, 15.71),
      ('2025-06-01', 'Dave',    8.71, 6.21),
      ('2025-06-01', 'Eve',     7.11, 18.41),

      ('2025-06-02', 'Frank',   8.91, 4.81),
      ('2025-06-02', 'George',  5.41, 22.11),
      ('2025-06-02', 'Helen',   8.52, 9.71),
      ('2025-06-02', 'Ian',     7.61, 14.31),
      ('2025-06-02', 'Joey',    8.06, 11.26),

      ('2025-06-03', 'Alice',   6.76, 16.86),
      ('2025-06-03', 'Bob',     8.36, 7.96),
      ('2025-06-03', 'Carol',   7.27, 13.61),
      ('2025-06-03', 'Dave',    8.86, 5.46),
      ('2025-06-03', 'Eve',     6.56, 19.21),

      ('2025-06-04', 'Frank',   9.16, 3.78),
      ('2025-06-04', 'George',  5.28, 23.41),
      ('2025-06-04', 'Helen',   8.66, 10.36),
      ('2025-06-04', 'Ian',     7.46, 15.96),
      ('2025-06-04', 'Joey',    7.97, 12.86),

      ('2025-06-05', 'Alice',   6.37, 17.56),
      ('2025-06-05', 'Bob',     8.47, 7.16),
      ('2025-06-05', 'Carol',   7.87, 14.76),
      ('2025-06-05', 'Dave',    9.27, 4.67),
      ('2025-06-05', 'Eve',     6.17, 20.46),

      ('2025-06-06', 'Frank',   9.37, 3.28),
      ('2025-06-06', 'George',  5.07, 24.66),
      ('2025-06-06', 'Helen',   8.77, 9.87),
      ('2025-06-06', 'Ian',     7.37, 16.46),
      ('2025-06-06', 'Joey',    8.17, 13.77),

      ('2025-06-07', 'Alice',   6.67, 18.27),
      ('2025-06-07', 'Bob',     8.57, 6.87),
      ('2025-06-07', 'Carol',   7.78, 15.37),
      ('2025-06-07', 'Dave',    9.07, 5.17),
      ('2025-06-07', 'Eve',     5.97, 21.96),

      ('2025-06-08', 'Frank',   9.47, 2.97),
      ('2025-06-08', 'George',  4.87, 25.86),
      ('2025-06-08', 'Helen',   8.97, 10.97),
      ('2025-06-08', 'Ian',     7.57, 17.17),
      ('2025-06-08', 'Joey',    8.27, 14.07),

      ('2025-06-09', 'Alice',   6.47, 19.67),
      ('2025-06-09', 'Bob',     8.67, 6.57),
      ('2025-06-09', 'Carol',   7.08, 16.07),
      ('2025-06-09', 'Dave',    9.57, 4.37),
      ('2025-06-09', 'Eve',     5.87, 22.77),

      ('2025-06-10', 'Frank',   9.67, 2.67),
      ('2025-06-10', 'George',  4.78, 26.97),
      ('2025-06-10', 'Helen',   8.98, 11.87),
      ('2025-06-10', 'Ian',     7.18, 17.87),
      ('2025-06-10', 'Joey',    8.42, 13.37);
  `);
});
