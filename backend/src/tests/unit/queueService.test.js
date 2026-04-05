// C:\Users\hp\OneDrive\Desktop\seahawk-full_stack\backend\src\tests\unit\queueService.test.js
'use strict';

const mockCron = {
  schedule: vi.fn(),
};

// Variable must start with 'mock' to be used in vi.mock factory
vi.mock('node-cron', () => {
  return {
    ...mockCron,
    default: mockCron,
  };
});

const queueService = require('../../services/queue.service');
const mockPrisma = require('../../config/__mocks__/prisma');

describe('queue.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enqueueTrackingSync', () => {
    it('enqueues successfully', async () => {
      mockPrisma.jobQueue.create.mockResolvedValue({ id: 'j1' });
      await queueService.enqueueTrackingSync('s1', 'A1', 'Delhivery');
      expect(mockPrisma.jobQueue.create).toHaveBeenCalled();
    });
  });

  describe('setupScheduledJobs', () => {
    it('schedules tasks', async () => {
      await queueService.setupScheduledJobs();
      expect(mockCron.schedule).toHaveBeenCalled();
    });
  });
});
