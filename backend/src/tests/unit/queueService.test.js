// C:\Users\hp\OneDrive\Desktop\seahawk-full_stack\backend\src\tests\unit\queueService.test.js
'use strict';

const mockCron = {
  schedule: vi.fn(),
};

// Manual cache injection for node-cron
const nodeCronPath = require.resolve('node-cron');
require.cache[nodeCronPath] = {
  id: nodeCronPath,
  filename: nodeCronPath,
  loaded: true,
  exports: mockCron,
};

// Now require the service
const queueService = require('../../services/queue.service');

describe('queue.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setupScheduledJobs', () => {
    it('schedules tasks', async () => {
      await queueService.setupScheduledJobs();
      expect(mockCron.schedule).toHaveBeenCalled();
    });
  });
});
