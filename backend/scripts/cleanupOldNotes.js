/**
 * cleanupOldNotes.js
 * One-time migration script — deletes all note records whose fileUrl is
 * a local filename (not a Cloudinary HTTPS URL). Also restores each
 * uploader's uploadCount and score for the deleted notes.
 *
 * Run with:  node scripts/cleanupOldNotes.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Fix DNS for MongoDB Atlas on Windows
if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb+srv://')) {
  try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}
}

const Note = require('../models/Note');
const User = require('../models/User');

const run = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    // Find all notes where fileUrl is NOT a Cloudinary URL
    const brokenNotes = await Note.find({
      fileUrl: { $not: /^https?:\/\// }
    });

    console.log(`🔍 Found ${brokenNotes.length} broken note(s) with local file paths:\n`);

    if (brokenNotes.length === 0) {
      console.log('✅ Nothing to delete. All notes are already using Cloudinary URLs.');
      await mongoose.disconnect();
      return;
    }

    // Print each note being deleted
    brokenNotes.forEach((note, i) => {
      console.log(`  ${i + 1}. "${note.title}" | fileUrl: ${note.fileUrl} | uploader: ${note.uploadedBy}`);
    });

    console.log('\n🗑️  Deleting broken notes and restoring user scores...\n');

    let deletedCount = 0;
    for (const note of brokenNotes) {
      try {
        // Restore the uploader's uploadCount and score
        await User.findByIdAndUpdate(note.uploadedBy, {
          $inc: { uploadCount: -1, score: -10 }
        });

        await note.deleteOne();
        deletedCount++;
        console.log(`  ✅ Deleted: "${note.title}"`);
      } catch (err) {
        console.error(`  ❌ Failed to delete "${note.title}": ${err.message}`);
      }
    }

    console.log(`\n🎉 Done! Deleted ${deletedCount}/${brokenNotes.length} broken notes.`);
    console.log('   Users\' uploadCount and score have been restored accordingly.');

  } catch (err) {
    console.error('❌ Script failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
};

run();
