-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "flowType" TEXT NOT NULL DEFAULT 'structured',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "prompt" TEXT NOT NULL,
    "wantsVoiceover" BOOLEAN NOT NULL DEFAULT true,
    "wantsSubtitles" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER NOT NULL DEFAULT 20,
    "aspectRatio" TEXT NOT NULL DEFAULT '9:16',
    "assetUrls" TEXT,
    "resolution" TEXT NOT NULL DEFAULT '1080p',
    "negativePrompt" TEXT,
    "toneReferenceUrls" TEXT,
    "briefJson" TEXT,
    "conceptsJson" TEXT,
    "scriptJson" TEXT,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("briefJson", "conceptsJson", "createdAt", "flowType", "id", "prompt", "revisionCount", "scriptJson", "status", "updatedAt", "userId", "wantsSubtitles", "wantsVoiceover") SELECT "briefJson", "conceptsJson", "createdAt", "flowType", "id", "prompt", "revisionCount", "scriptJson", "status", "updatedAt", "userId", "wantsSubtitles", "wantsVoiceover" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
