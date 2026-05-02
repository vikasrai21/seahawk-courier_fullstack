'use strict';

const prisma = require('../config/prisma');

let ensured = false;

async function ensureTable() {
  if (ensured) return;

  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM shipment_import_rows LIMIT 1');
  } catch (error) {
    throw new Error('shipment_import_rows table is missing. Run `npx prisma migrate deploy` before using the import ledger.');
  }

  ensured = true;
}

const FIELD_MAP = {
  status: 'status',
  courier: 'courier',
  clientCode: 'client_code',
  date: 'date',
  ndrStatus: 'ndr_status',
  awb: 'awb',
  batchKey: 'batch_key',
};

function buildWhere(dateFilter = {}, extraConditions = []) {
  const clauses = [];
  const params = [];
  const date = dateFilter?.date || {};

  if (date.gte) {
    params.push(date.gte);
    clauses.push(`date >= $${params.length}`);
  }
  if (date.lte) {
    params.push(date.lte);
    clauses.push(`date <= $${params.length}`);
  }

  for (const condition of extraConditions) {
    const column = FIELD_MAP[condition.field];
    if (!column) throw new Error(`Unsupported import-ledger condition field: ${condition.field}`);

    if (condition.op === 'eq') {
      params.push(condition.value);
      clauses.push(`${column} = $${params.length}`);
    } else if (condition.op === 'notNull') {
      clauses.push(`${column} IS NOT NULL`);
    } else {
      throw new Error(`Unsupported import-ledger condition op: ${condition.op}`);
    }
  }

  return {
    clause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

async function count(dateFilter = {}, extraConditions = []) {
  await ensureTable();
  const where = buildWhere(dateFilter, extraConditions);
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM shipment_import_rows ${where.clause}`,
    ...where.params
  );
  return Number(rows[0]?.count || 0);
}

async function aggregate(dateFilter = {}, extraConditions = []) {
  await ensureTable();
  const where = buildWhere(dateFilter, extraConditions);
  const rows = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(SUM(amount), 0)::float8 AS amount, COALESCE(SUM(weight), 0)::float8 AS weight FROM shipment_import_rows ${where.clause}`,
    ...where.params
  );
  return {
    amount: Number(rows[0]?.amount || 0),
    weight: Number(rows[0]?.weight || 0),
  };
}

async function groupBy(field, dateFilter = {}, options = {}) {
  await ensureTable();
  const column = FIELD_MAP[field];
  if (!column) throw new Error(`Unsupported import-ledger group field: ${field}`);

  const conditions = [...(options.extraConditions || [])];
  if (options.excludeNull) conditions.push({ field, op: 'notNull' });

  const where = buildWhere(dateFilter, conditions);
  const selectParts = [`${column} AS value`, 'COUNT(*)::int AS count'];
  if (options.sumAmount) selectParts.push('COALESCE(SUM(amount), 0)::float8 AS amount');
  if (options.sumWeight) selectParts.push('COALESCE(SUM(weight), 0)::float8 AS weight');
  const orderBy = options.orderBy === 'dateAsc' ? `${column} ASC` : 'count DESC';
  const limit = options.limit ? ` LIMIT ${Number(options.limit)}` : '';

  return prisma.$queryRawUnsafe(
    `SELECT ${selectParts.join(', ')} FROM shipment_import_rows ${where.clause} GROUP BY ${column} ORDER BY ${orderBy}${limit}`,
    ...where.params
  );
}

async function insertRow(row) {
  await ensureTable();

  await prisma.$executeRawUnsafe(
    `INSERT INTO shipment_import_rows (
      batch_key, source_file, source_sheet, row_no, date, client_code, awb,
      consignee, destination, phone, pincode, weight, amount, courier,
      department, service, status, ndr_status, remarks, auto_priced,
      shipment_id, created_by_id
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19, $20,
      $21, $22
    )`,
    row.batchKey,
    row.sourceFile || null,
    row.sourceSheet || null,
    row.rowNo ?? null,
    row.date,
    row.clientCode,
    row.awb,
    row.consignee || null,
    row.destination || null,
    row.phone || null,
    row.pincode || null,
    Number(row.weight || 0),
    Number(row.amount || 0),
    row.courier || null,
    row.department || null,
    row.service || 'Standard',
    row.status || 'Booked',
    row.ndrStatus || null,
    row.remarks || null,
    !!row.autoPriced,
    row.shipmentId || null,
    row.createdById || null
  );
}

async function insertRowsBulk(rows) {
  if (!rows || rows.length === 0) return;
  await ensureTable();

  // Create value placeholders like ($1, $2, ...), ($23, $24, ...)
  const values = [];
  const params = [];
  let paramIdx = 1;

  for (const row of rows) {
    values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
    
    params.push(
      row.batchKey,
      row.sourceFile || null,
      row.sourceSheet || null,
      row.rowNo ?? null,
      row.date,
      row.clientCode,
      row.awb,
      row.consignee || null,
      row.destination || null,
      row.phone || null,
      row.pincode || null,
      Number(row.weight || 0),
      Number(row.amount || 0),
      row.courier || null,
      row.department || null,
      row.service || 'Standard',
      row.status || 'Booked',
      row.ndrStatus || null,
      row.remarks || null,
      !!row.autoPriced,
      row.shipmentId || null,
      row.createdById || null
    );
  }

  const query = `
    INSERT INTO shipment_import_rows (
      batch_key, source_file, source_sheet, row_no, date, client_code, awb,
      consignee, destination, phone, pincode, weight, amount, courier,
      department, service, status, ndr_status, remarks, auto_priced,
      shipment_id, created_by_id
    ) VALUES ${values.join(', ')}
  `;

  await prisma.$executeRawUnsafe(query, ...params);
}

async function listRows(filters = {}, page = 1, limit = 50) {
  await ensureTable();

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(200, Math.max(10, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;
  const conditions = [];
  const dateFilter = {};

  if (filters.dateFrom || filters.dateTo) {
    dateFilter.date = {};
    if (filters.dateFrom) dateFilter.date.gte = filters.dateFrom;
    if (filters.dateTo) dateFilter.date.lte = filters.dateTo;
  }

  if (filters.batchKey) conditions.push({ field: 'batchKey', op: 'eq', value: filters.batchKey });

  const where = buildWhere(dateFilter, conditions);
  let searchClause = '';
  const params = [...where.params];

  if (filters.q) {
    params.push(`%${String(filters.q).trim()}%`);
    const idx = params.length;
    searchClause = `${where.clause ? ' AND ' : 'WHERE '}(
      awb ILIKE $${idx}
      OR client_code ILIKE $${idx}
      OR COALESCE(consignee, '') ILIKE $${idx}
      OR COALESCE(destination, '') ILIKE $${idx}
      OR COALESCE(courier, '') ILIKE $${idx}
    )`;
  }

  const fullWhere = `${where.clause}${searchClause}`;
  const totalRows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM shipment_import_rows ${fullWhere}`,
    ...params
  );

  const rows = await prisma.$queryRawUnsafe(
    `SELECT
      id, batch_key AS "batchKey", row_no AS "rowNo", date, client_code AS "clientCode",
      awb, consignee, destination, phone, pincode, weight, amount, courier,
      department, service, status, ndr_status AS "ndrStatus", remarks,
      auto_priced AS "autoPriced", shipment_id AS "shipmentId", created_at AS "createdAt"
    FROM shipment_import_rows
    ${fullWhere}
    ORDER BY date DESC, id DESC
    LIMIT ${safeLimit} OFFSET ${skip}`,
    ...params
  );

  return {
    rows,
    total: Number(totalRows[0]?.count || 0),
    page: safePage,
    limit: safeLimit,
  };
}

async function getSummary(filters = {}) {
  await ensureTable();

  const dateFilter = {};
  if (filters.dateFrom || filters.dateTo) {
    dateFilter.date = {};
    if (filters.dateFrom) dateFilter.date.gte = filters.dateFrom;
    if (filters.dateTo) dateFilter.date.lte = filters.dateTo;
  }

  const where = buildWhere(dateFilter, []);
  const params = [...where.params];
  let searchClause = '';

  if (filters.q) {
    params.push(`%${String(filters.q).trim()}%`);
    const idx = params.length;
    searchClause = `${where.clause ? ' AND ' : 'WHERE '}(
      awb ILIKE $${idx}
      OR client_code ILIKE $${idx}
      OR COALESCE(consignee, '') ILIKE $${idx}
      OR COALESCE(destination, '') ILIKE $${idx}
      OR COALESCE(courier, '') ILIKE $${idx}
    )`;
  }

  const fullWhere = `${where.clause}${searchClause}`;
  const rows = await prisma.$queryRawUnsafe(
    `SELECT
      COUNT(*)::int AS total_rows,
      COUNT(DISTINCT awb)::int AS unique_awbs,
      (COUNT(*) - COUNT(DISTINCT awb))::int AS repeated_rows,
      COALESCE(SUM(amount), 0)::float8 AS total_amount,
      COUNT(DISTINCT batch_key)::int AS batches
    FROM shipment_import_rows
    ${fullWhere}`,
    ...params
  );

  return {
    totalRows: Number(rows[0]?.total_rows || 0),
    uniqueAwbs: Number(rows[0]?.unique_awbs || 0),
    repeatedRows: Number(rows[0]?.repeated_rows || 0),
    totalAmount: Number(rows[0]?.total_amount || 0),
    batches: Number(rows[0]?.batches || 0),
  };
}

async function findByAwb(awb, limit = 10) {
  await ensureTable();
  if (!awb) return [];

  return prisma.$queryRawUnsafe(
    `SELECT
      id, batch_key AS "batchKey", row_no AS "rowNo", date, client_code AS "clientCode",
      awb, consignee, destination, phone, pincode, weight, amount, courier,
      department, service, status, ndr_status AS "ndrStatus", remarks,
      auto_priced AS "autoPriced", shipment_id AS "shipmentId", created_at AS "createdAt"
    FROM shipment_import_rows
    WHERE awb = $1
    ORDER BY date DESC, id DESC
    LIMIT ${Math.max(1, Math.min(25, Number(limit) || 10))}`,
    String(awb).trim()
  );
}

module.exports = {
  ensureTable,
  count,
  aggregate,
  groupBy,
  insertRow,
  insertRowsBulk,
  listRows,
  getSummary,
  findByAwb,
};
