const { Client } = require("minio");

class MinioService {
   constructor() {
      this.client = new Client({
         endPoint: process.env.MINIO_ENDPOINT || "minio",
         port: parseInt(process.env.MINIO_PORT) || 9000,
         useSSL: process.env.MINIO_USE_SSL === "true",
         accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
         secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
         region: process.env.MINIO_REGION || "us-east-1"
      });

      this.bucketName = process.env.MINIO_BUCKET_NAME || "training-media";
      this.publicBucketName = process.env.MINIO_PUBLIC_BUCKET_NAME || "training-media-public";
      this.publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || "localhost";
      this.port = parseInt(process.env.MINIO_PORT) || 9000;

      this.initBuckets();
   }

   async initBuckets() {
      try {
         const mainExists = await this.client.bucketExists(this.bucketName);
         if (!mainExists) {
            await this.client.makeBucket(this.bucketName, this.client.region);
            console.log("✅ MinIO bucket created:", this.bucketName);
         }

         if (this.publicBucketName && this.publicBucketName !== this.bucketName) {
            const publicExists = await this.client.bucketExists(this.publicBucketName);
            if (!publicExists) {
               await this.client.makeBucket(this.publicBucketName, this.client.region);
               await this.setBucketPublicPolicy(this.publicBucketName);
               console.log("✅ Public MinIO bucket created:", this.publicBucketName);
            }
         }
      } catch (error) {
         console.error("❌ MinIO init error:", error.message);
      }
   }

   async setBucketPublicPolicy(bucketName) {
      try {
         const policy = {
            Version: "2012-10-17",
            Statement: [
               {
                  Effect: "Allow",
                  Principal: { AWS: ["*"] },
                  Action: ["s3:GetObject"],
                  Resource: [`arn:aws:s3:::${bucketName}/*`]
               }
            ]
         };
         await this.client.setBucketPolicy(bucketName, JSON.stringify(policy));
         console.log("✅ Public policy set for bucket:", bucketName);
      } catch (error) {
         console.warn("⚠️ Could not set public policy:", error.message);
      }
   }

   async generateUploadUrl(objectName, expiry = 900, usePublic = false) {
      const bucket = usePublic ? this.publicBucketName : this.bucketName;
      const url = await this.client.presignedPutObject(bucket, objectName, expiry);
      console.log("🔄 Generated upload URL (before fix):", url.substring(0, 100) + "...");

      // ВСЕГДА заменяем endpoint
      const fixedUrl = this.replaceEndpointInUrl(url);
      console.log("🔄 Generated upload URL (after fix):", fixedUrl.substring(0, 100) + "...");
      return fixedUrl;
   }

   async generateDownloadUrl(objectName, expiry = 3600, usePublic = false) {
      const bucket = usePublic ? this.publicBucketName : this.bucketName;
      const url = await this.client.presignedGetObject(bucket, objectName, expiry);
      return this.replaceEndpointInUrl(url);
   }

   getPublicUrl(objectName, usePublic = true) {
      const bucket = usePublic ? this.publicBucketName : this.bucketName;
      return `http://${this.publicEndpoint}:${this.port}/${bucket}/${objectName}`;
   }

   replaceEndpointInUrl(url) {
      const fromEndpoint = this.client.endPoint;
      const toEndpoint = this.publicEndpoint;
      const fromPort = this.client.port;
      const toPort = this.port;

      if (fromEndpoint !== toEndpoint) {
         const newUrl = url.replace(
            `${fromEndpoint}:${fromPort}`,
            `${toEndpoint}:${toPort}`
         );
         console.log(`🔀 Endpoint replaced: ${fromEndpoint}:${fromPort} -> ${toEndpoint}:${toPort}`);
         return newUrl;
      }
      return url;
   }

   async fileExists(objectName, usePublic = false) {
      try {
         const bucket = usePublic ? this.publicBucketName : this.bucketName;
         await this.client.statObject(bucket, objectName);
         return true;
      } catch {
         return false;
      }
   }

   async deleteFile(objectName, usePublic = false) {
      const bucket = usePublic ? this.publicBucketName : this.bucketName;
      await this.client.removeObject(bucket, objectName);
      console.log(`🗑️ Deleted file: ${bucket}/${objectName}`);
   }

   generateObjectName(userId, filename, fileType) {
      const ext = filename.split(".").pop() || "";
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const safeName = filename.substring(0, filename.lastIndexOf("."))
         .replace(/[^a-zA-Z0-9-_.]/g, "_")
         .substring(0, 100);

      return `${fileType}/${userId}/${timestamp}_${random}_${safeName}.${ext}`;
   }

   async getFileMetadata(objectName, usePublic = false) {
      const bucket = usePublic ? this.publicBucketName : this.bucketName;
      return await this.client.statObject(bucket, objectName);
   }

   // НОВЫЙ МЕТОД: Копирование объекта между бакетами
   async copyObject(sourceBucket, sourceObject, destBucket, destObject) {
      try {
         console.log(`📋 Copying object: ${sourceBucket}/${sourceObject} -> ${destBucket}/${destObject}`);

         // Используем метод copyObject MinIO
         await this.client.copyObject(
            destBucket,
            destObject,
            `/${sourceBucket}/${sourceObject}`
         );

         console.log(`✅ Successfully copied: ${sourceBucket}/${sourceObject} to ${destBucket}/${destObject}`);
         return true;
      } catch (error) {
         console.error(`❌ Error copying object ${sourceBucket}/${sourceObject}:`, error.message);
         throw new Error(`Copy failed: ${error.message}`);
      }
   }

   // НОВЫЙ МЕТОД: Перемещение объекта между бакетами
   async moveObject(sourceBucket, sourceObject, destBucket, destObject) {
      try {
         console.log(`🚚 Moving object: ${sourceBucket}/${sourceObject} -> ${destBucket}/${destObject}`);

         // 1. Копируем файл
         await this.copyObject(sourceBucket, sourceObject, destBucket, destObject);

         // 2. Удаляем оригинал (только если копирование успешно)
         await this.client.removeObject(sourceBucket, sourceObject);

         console.log(`✅ Successfully moved: ${sourceBucket}/${sourceObject} to ${destBucket}/${destObject}`);
         return true;
      } catch (error) {
         console.error(`❌ Error moving object ${sourceBucket}/${sourceObject}:`, error.message);

         // Пытаемся удалить скопированный файл, если он существует (чтобы избежать дубликатов)
         try {
            await this.client.removeObject(destBucket, destObject);
         } catch (cleanupError) {
            // Игнорируем ошибку очистки
         }

         throw new Error(`Move failed: ${error.message}`);
      }
   }

   // НОВЫЙ МЕТОД: Получение политики бакета
   async getBucketPolicy(bucketName) {
      try {
         return await this.client.getBucketPolicy(bucketName);
      } catch (error) {
         console.warn(`⚠️ Could not get policy for bucket ${bucketName}:`, error.message);
         return null;
      }
   }

   // НОВЫЙ МЕТОД: Проверка существования объекта
   async objectExists(bucketName, objectName) {
      try {
         await this.client.statObject(bucketName, objectName);
         return true;
      } catch (error) {
         if (error.code === 'NotFound') {
            return false;
         }
         throw error;
      }
   }

   async testConnection() {
      try {
         await this.client.listBuckets();
         console.log("✅ MinIO connection successful");
         return true;
      } catch (error) {
         console.error("❌ MinIO connection failed:", error.message);
         return false;
      }
   }
}

module.exports = new MinioService();