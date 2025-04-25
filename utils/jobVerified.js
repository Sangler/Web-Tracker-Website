const Job = require('../models/jobs');

/**
 * Middleware to delete any unfinished jobs 
 * missing Product/changeStatus/ExpectedTarget.
 */
async function isValidJob(req, res, next) {
  try {
    // Find a single job for current user
    const job = await Job.findOne({ email: req.session.email });              // Mongoose findOne :contentReference[oaicite:6]{index=6}
    if (job && !job.isFinish) {                                          // only consider unfinished jobs
      const missing =
        job.Product == null ||
        job.changeStatus == null ||
        job.ExpectedTarget == null;                                      // null or undefined tests
      if (missing) {
        console.log("<> delete unvalid job!")
        await job.deleteOne();                                           // delete stale doc :contentReference[oaicite:7]{index=7}
      }
    }
    return next();                                                       // proceed to next handler :contentReference[oaicite:8]{index=8}
  } catch (err) {
    return next(err);                                                    // let Express error middleware handle it :contentReference[oaicite:9]{index=9}
  }
}

module.exports = isValidJob;
