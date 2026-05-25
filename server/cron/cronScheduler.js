const cron = require('node-cron');
const jobs = require('./jobs');

/**
 * Cron Scheduler Controller
 * Iterates through all registered jobs and schedules them using node-cron.
 */
module.exports = {
  init: () => {
    console.log('[Cron Scheduler] Initializing cron scheduler...');

    if (!jobs || jobs.length === 0) {
      console.log('[Cron Scheduler] No cron jobs found in the registry.');
      return;
    }

    jobs.forEach((job) => {
      // Validate job structure
      if (!job.name || !job.schedule || typeof job.run !== 'function') {
        console.error(`[Cron Scheduler] Skipping invalid job configuration:`, job);
        return;
      }

      // Validate cron expression
      if (!cron.validate(job.schedule)) {
        console.error(`[Cron Scheduler] ERROR: Invalid cron expression "${job.schedule}" for job "${job.name}".`);
        return;
      }

      // Register/Schedule job
      cron.schedule(job.schedule, async () => {
        try {
          console.log(`[Cron Scheduler] Running background job: "${job.name}"`);
          await job.run();
        } catch (error) {
          console.error(`[Cron Scheduler] ERROR executing job "${job.name}":`, error);
        }
      });

      console.log(`[Cron Scheduler] Successfully scheduled: "${job.name}" [Schedule: ${job.schedule}]`);
    });

    console.log('[Cron Scheduler] All registered jobs have been scheduled.');
  }
};
