'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

async function create(clientCode, data) {
  const code = String(data.code || '').trim().toUpperCase();
  if (!code) throw new Error('Warehouse code is required');
  if (data.isDefault) {
    await prisma.warehouse.updateMany({ where: { clientCode, isDefault: true }, data: { isDefault: false } });
  }
  return prisma.warehouse.create({
    data: {
      clientCode, name: data.name, code, contactName: data.contactName, contactPhone: data.contactPhone,
      contactEmail: data.contactEmail || null, address: data.address, city: data.city, state: data.state,
      pincode: data.pincode, country: data.country || 'India', isDefault: !!data.isDefault,
      gstNumber: data.gstNumber || null, operatingHours: data.operatingHours || null, notes: data.notes || null,
    },
  });
}

async function update(warehouseId, data) {
  const wh = await prisma.warehouse.findUnique({ where: { id: parseInt(warehouseId) } });
  if (!wh) throw new Error('Warehouse not found');
  if (data.isDefault) {
    await prisma.warehouse.updateMany({ where: { clientCode: wh.clientCode, isDefault: true, id: { not: wh.id } }, data: { isDefault: false } });
  }
  return prisma.warehouse.update({ where: { id: parseInt(warehouseId) }, data });
}

async function remove(warehouseId) {
  const shipmentCount = await prisma.shipment.count({ where: { warehouseId: parseInt(warehouseId) } });
  if (shipmentCount > 0) throw new Error(`Cannot delete: ${shipmentCount} shipments linked to this warehouse`);
  return prisma.warehouse.delete({ where: { id: parseInt(warehouseId) } });
}

async function getByClient(clientCode) {
  return prisma.warehouse.findMany({ where: { clientCode, active: true }, orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] });
}

async function getById(warehouseId) {
  return prisma.warehouse.findUnique({ where: { id: parseInt(warehouseId) } });
}

module.exports = { create, update, remove, getByClient, getById };
