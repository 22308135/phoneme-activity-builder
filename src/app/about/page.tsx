import { existsSync } from "node:fs";
import path from "node:path";
import { SiteShell } from "@/components/SiteShell";

export default function AboutPage() {
  const configuredVideo = process.env.NEXT_PUBLIC_WALKTHROUGH_VIDEO_URL;
  const hasLocalVideo = existsSync(path.join(process.cwd(), "public", "walkthrough.mp4"));
  const videoSource = configuredVideo || (hasLocalVideo ? "/walkthrough.mp4" : null);
  return <SiteShell><section className="content-page"><p className="eyebrow">About the project</p><h1>Phoneme Play Builder</h1><p className="lead">A database-backed Wordle and Word Search builder for Speech Pathology teachers. Activities, phoneme lists and settings can be saved, edited, previewed and downloaded for classroom use.</p>
    <div className="info-grid"><article><h2>Stored content</h2><p>Teachers enter their own written words, ordered IPA phonemes and hints. Prisma stores multiple reusable configurations in SQLite.</p></article><article><h2>Portable activities</h2><p>Saved Wordle and Word Search records generate self-contained HTML that runs independently in a modern browser.</p></article></div>
    <section className="walkthrough" aria-labelledby="walkthrough-heading"><h2 id="walkthrough-heading">Project walkthrough</h2>{videoSource ? <video controls preload="metadata"><source src={videoSource} type="video/mp4" /><track kind="captions" src="/walkthrough.vtt" srcLang="en" label="English" default />Your browser does not support HTML video.</video> : <div className="video-missing" role="note"><strong>Walkthrough recording required</strong><p>Add the final recording as <code>public/walkthrough.mp4</code> and captions as <code>public/walkthrough.vtt</code>, or set <code>NEXT_PUBLIC_WALKTHROUGH_VIDEO_URL</code>.</p></div>}</section>
    <p className="identity">Created by <strong>Louis Callander</strong> · Student number: <strong>22308135</strong></p></section></SiteShell>;
}
