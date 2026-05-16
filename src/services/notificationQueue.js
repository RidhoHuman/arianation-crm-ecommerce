const queue = [];
let processing = false;

async function runQueue() {
  if (processing) return;

  processing = true;

  try {
    while (queue.length > 0) {
      const job = queue.shift();

      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await job.handler();
        job.resolve(result);
      } catch (error) {
        job.reject(error);
      }
    }
  } finally {
    processing = false;
  }
}

function enqueueNotification(handler) {
  return new Promise((resolve, reject) => {
    queue.push({ handler, resolve, reject });
    runQueue();
  });
}

function getNotificationQueueStatus() {
  return {
    processing,
    pending: queue.length,
  };
}

module.exports = {
  enqueueNotification,
  getNotificationQueueStatus,
};