const User = require('../models/User');

// Finds the HIGHEST existing number for the year group and adds 1.
// e.g. Y8 has 01, 03, 04  →  returns MCM-Y8-05
const generateStudentId = async (yearGroup) => {
  const cleanYearGroup = (yearGroup || '').replace(/\s+/g, '');
  const prefix = `MCM-${cleanYearGroup}-`;

  const existing = await User.find({ studentId: { $regex: `^${prefix}\\d+$` } })
    .select('studentId')
    .lean();

  const maxSeq = existing.reduce((max, u) => {
    const n = parseInt(u.studentId.slice(prefix.length), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);

  return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
};

module.exports = { generateStudentId };