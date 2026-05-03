'use strict';
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function submitApplication(data) {
  const existing = await prisma.onboardingApplication.findFirst({ where: { email: data.email.toLowerCase().trim(), status: { not: 'REJECTED' } } });
  if (existing) throw new Error('An application with this email already exists');
  return prisma.onboardingApplication.create({
    data: {
      companyName: data.companyName, contactName: data.contactName, email: data.email.toLowerCase().trim(),
      phone: data.phone, gst: data.gst || null, pan: data.pan || null, address: data.address || null,
      city: data.city || null, state: data.state || null, pincode: data.pincode || null,
      monthlyVolume: data.monthlyVolume || null, businessType: data.businessType || null,
      primaryCourier: data.primaryCourier || null, website: data.website || null, status: 'PENDING',
    },
  });
}

async function getApplications({ status, page = 1, limit = 20 } = {}) {
  const where = {};
  if (status) where.status = status;
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(1, Number(page)) - 1) * take;
  const [apps, total] = await Promise.all([
    prisma.onboardingApplication.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.onboardingApplication.count({ where }),
  ]);
  return { applications: apps, pagination: { page: Number(page), limit: take, total } };
}

async function approveApplication(appId, approvedById) {
  const app = await prisma.onboardingApplication.findUnique({ where: { id: parseInt(appId) } });
  if (!app) throw new Error('Application not found');
  if (app.status === 'APPROVED') throw new Error('Application already approved');
  const clientCode = app.companyName.replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase() + String(app.id).padStart(3, '0');
  const tempPassword = `Shk${Math.random().toString(36).slice(2, 8)}!1`;
  const hashedPassword = await bcrypt.hash(tempPassword, 12);
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({ data: { code: clientCode, company: app.companyName, contact: app.contactName, phone: app.phone, email: app.email, gst: app.gst, address: app.address } });
    const user = await tx.user.create({ data: { name: app.contactName, email: app.email, password: hashedPassword, role: 'CLIENT', phone: app.phone, mustChangePassword: true } });
    await tx.clientUser.create({ data: { userId: user.id, clientCode } });
    await tx.onboardingApplication.update({ where: { id: parseInt(appId) }, data: { status: 'APPROVED', approvedById, clientCode } });
    logger.info(`Onboarding approved: ${app.email} → ${clientCode}`);
    return { client, user: { id: user.id, email: user.email, name: user.name }, clientCode, tempPassword };
  });
}

async function rejectApplication(appId, reviewNotes) {
  return prisma.onboardingApplication.update({ where: { id: parseInt(appId) }, data: { status: 'REJECTED', reviewNotes } });
}

module.exports = { submitApplication, getApplications, approveApplication, rejectApplication };
