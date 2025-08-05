-- Alter the vector dimension from 768 to 3072
ALTER TABLE "public"."Rule" 
  ALTER COLUMN "embedding" TYPE vector(3072);
