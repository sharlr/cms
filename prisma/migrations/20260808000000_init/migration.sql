-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDATE', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULIN', 'FEMININ');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('PRIMAIRE', 'COLLEGE', 'LYCEE', 'UNIVERSITE', 'AUTRE');

-- CreateEnum
CREATE TYPE "City" AS ENUM ('DJIBOUTI_VILLE', 'TADJOURAH', 'DIKHIL', 'ARTA', 'ALI_SABIEH');

-- CreateEnum
CREATE TYPE "ContestMode" AS ENUM ('ENTRAINEMENT', 'SELECTION');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('QCM', 'LIBRE');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('EN_COURS', 'TERMINEE', 'ABANDONNEE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "city" "City" NOT NULL,
    "educationLevel" "EducationLevel" NOT NULL,
    "otherLevel" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" "ContestMode" NOT NULL,
    "information" TEXT,
    "instructions" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 20,
    "secondsPerQuestion" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "edition" INTEGER NOT NULL DEFAULT 2026,
    "startsAt" TIMESTAMP(3),
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Choice" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'EN_COURS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPosition" INTEGER NOT NULL DEFAULT 1,
    "questionServedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "unansweredCount" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalTimeMs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "given" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "timeMs" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePage" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePage_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contest_slug_key" ON "Contest"("slug");

-- CreateIndex
CREATE INDEX "Contest_mode_isActive_idx" ON "Contest"("mode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Question_contestId_position_key" ON "Question"("contestId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Choice_questionId_label_key" ON "Choice"("questionId", "label");

-- CreateIndex
CREATE INDEX "Attempt_userId_contestId_idx" ON "Attempt"("userId", "contestId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_attemptId_questionId_key" ON "Answer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "News_publishedAt_idx" ON "News"("publishedAt");

-- CreateIndex
CREATE INDEX "Partner_position_idx" ON "Partner"("position");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
