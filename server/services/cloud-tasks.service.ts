import { CloudTasksClient } from '@google-cloud/tasks';

let client: CloudTasksClient | null = null;
function getClient(): CloudTasksClient {
  if (!client) {
    client = new CloudTasksClient();
  }
  return client;
}

export class CloudTasksService {
  private static PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8';
  private static LOCATION = 'us-east1';
  private static QUEUE = 'article-publishing-queue';

  static async scheduleArticlePublication(articleId: string, publishTime: Date) {
    const parent = getClient().queuePath(this.PROJECT, this.LOCATION, this.QUEUE);
    
    // Convert to seconds
    const seconds = Math.floor(publishTime.getTime() / 1000);
    
    const serviceAccountEmail = process.env.SERVICE_ACCOUNT_EMAIL;
    if (!serviceAccountEmail) {
       throw new Error("SERVICE_ACCOUNT_EMAIL is not configured");
    }

    const task = {
      httpRequest: {
        httpMethod: 'POST' as any,
        url: `${process.env.APP_URL}/api/magazine/publish/${articleId}`,
        oidcToken: {
          serviceAccountEmail: serviceAccountEmail,
        },
      },
      scheduleTime: {
        seconds: seconds,
      },
    };

    await getClient().createTask({ parent, task: task as any });
  }
}
