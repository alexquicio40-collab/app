import { apiOnline, apiUploadOnline } from "@/lib/api";
import { isNetworkError } from "@/lib/offline/net";
import { listJobs, replaceJobs } from "@/lib/offline/queue";
import { hayInternet } from "@/lib/red";
import type { OfflineJob, UploadJob } from "@/lib/offline/types";

let flushing = false;

export async function flushOfflineJobs() {
  if (flushing) return { sent: 0, left: 0 };
  if (!(await hayInternet())) {
    const jobs = await listJobs();
    return { sent: 0, left: jobs.length };
  }

  flushing = true;
  try {
    const current = await listJobs();
    if (!current.length) return { sent: 0, left: 0 };
    const left: OfflineJob[] = [];
    let sent = 0;
    let blocked = false;

    for (const job of current) {
      if (blocked) {
        left.push(job);
        continue;
      }
      try {
        if (job.kind === "json") {
          await apiOnline(job.path, { method: job.method, body: job.body });
        } else {
          await replayUpload(job);
        }
        sent += 1;
      } catch (err) {
        left.push(job);
        if (isNetworkError(err)) blocked = true;
      }
    }

    await replaceJobs(left);
    return { sent, left: left.length };
  } finally {
    flushing = false;
  }
}

async function replayUpload(job: UploadJob) {
  const form = new FormData();
  for (const [key, value] of Object.entries(job.fields)) {
    form.append(key, value);
  }
  for (const file of job.files) {
    if (file.uri.startsWith("blob:") || file.uri.startsWith("data:")) {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      form.append(file.field, blob, file.name);
      continue;
    }
    form.append(file.field, {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }
  return apiUploadOnline(job.path, form, { method: job.method });
}
