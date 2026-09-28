# JMeter evidence and video notes

**The app completed the 1, 10 and 25-user stages without errors. At 50 and 100 users, database timeouts caused substantial failures and reduced throughput.** These are findings from this workload on this laptop, not general capacity guarantees.

Measured on 17 September 2026, 13:07–13:14 AEST. The test used the current working tree, including the new dashboard, rather than only the last committed source.

## Results

| Concurrent users | HTTP requests | Failed requests | Error rate | Mean response | p95 response | Requests/second |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 259 | 0 | 0% | 17.77 ms | 36 ms | 4.43 |
| 10 | 2,508 | 0 | 0% | 14.59 ms | 34 ms | 42.85 |
| 25 | 5,970 | 0 | 0% | 25.24 ms | 76 ms | 102.09 |
| 50 | 1,136 | 184 | 16.20% | 2,510.61 ms | 11,609 ms | 16.55 |
| 100 | 1,043 | 354 | 33.94% | 5,792.99 ms | 15,012 ms | 14.26 |

The two-iteration smoke test passed all 14 HTTP checks and generated one output of each type. Every measured stage reached its configured number of active JMeter threads. The five stages produced 702 successful Wordle downloads and 705 successful Word Search downloads, excluding smoke testing.

## What was tested

Each user alternated Wordle and Word Search, loaded the builder and dictionary, saved a uniquely named activity, verified its stored IPA phonemes, generated and validated its HTML, deleted its own activity, and read the dashboard metrics. HTTP status and response-content assertions were enabled. Wordle used one target word; Word Search used five words in a 7 × 7 grid.

Each stage was scheduled for 60 seconds including a 10-second ramp-up, with a 200 ms pause before every request. The 50/100-user stages took longer to finish because outstanding requests were allowed to reach their 15-second response timeout. Mean and p95 cover individual HTTP requests, including failures, not complete user journeys. p95 means approximately 95% of the recorded requests completed within that time or failed by then.

JMeter and a production Next.js server shared a Windows 11 laptop with an Intel Core Ultra 5 125H, 18 logical processors and 15.47 GiB RAM. Versions: JMeter 5.6.3, Temurin Java 17.0.20.1, Node 24.15.0, Next.js 16.3.2 and Prisma 6.12.0. Each stage began with a fresh temporary SQLite database and the same seeded activities. The normal app database was not the load-test target.

## Interpretation

- **Light to moderate load:** throughput increased through 25 users, with p95 remaining below 100 ms and no recorded errors. The slightly lower mean at 10 than at 1 user should not be interpreted as a scalability improvement from a single short run.
- **Overload:** at 50 users, throughput fell from 102.09 to 16.55 requests/second and p95 increased to 11.61 seconds. At 100 users, about one-third of all requests failed and p95 approached the configured 15-second client timeout.
- **Affected operations:** at 100 users, activity creation failed on 147/224 requests (65.63%), dashboard metrics on 135/162 (83.33%), and HTML generation on 11/59 (18.64%). Builder page requests themselves had no failures. Fewer generation requests were attempted because failed saves skipped the ID-dependent steps.
- **Evidence of a database problem:** server logs contain Prisma `P1008` database operation timeouts and `P2028` transaction errors. JMeter records HTTP 500/503 responses and client socket timeouts. Prisma documents these [error categories](https://www.prisma.io/docs/orm/v6/reference/error-reference). The pattern is consistent with database contention or transaction/pool pressure under this workload, but the test does not isolate the precise cause. More profiling is needed before attributing all failures to SQLite itself.
- **Recovery:** `/health` and `/api/dashboard` both returned 200 after every stage without restarting that stage's server first. This confirms recovery at those checkpoints, not continuous health throughout the test.
- **Observability limit:** at 50 users, JMeter received 112 successful generated outputs while the dashboard recorded 104. The logs show 14 failed generation-metric writes. At 100 users, JMeter received 48 successful outputs while 51 successes were recorded server-side; a client can time out while server processing later completes. The dashboard's zero failed-generation count therefore does not mean all client requests succeeded. Retain JMeter's independent client measurements alongside application counters.

The heavy workload includes a dashboard metrics read in every loop, much more often per user than the dashboard's normal 30-second refresh. It is a stress comparison, not a model of 50 or 100 teachers reading and typing at normal speed. No performance fixes were applied between stages. A useful follow-up would be to profile the dashboard transaction and database writes, make a targeted change, and repeat this same plan while retaining this baseline.

## Evidence to open

- [Complete evidence archive](evidence/jmeter-2026-09-17.zip): all native HTML reports, raw JTL samples, logs, environment metadata, summaries and the exact JMX plan. Extract it before opening a report's `index.html`; keep neighbouring assets together.
- [Local 25-user JMeter report](../artifacts/jmeter/2026-09-17T03-07-51-121Z/users-25/report/index.html)
- [Local 100-user JMeter report](../artifacts/jmeter/2026-09-17T03-07-51-121Z/users-100/report/index.html)
- [Reproducible test plan](../tests/load/phoneme-builder.jmx) and [run instructions](../tests/load/README.md)

The archive is the portable evidence; the local report links work in this checkout. The load server was stopped and its temporary databases removed after the run. Leftover activities caused by failed deletes or interrupted final loops existed only in those temporary databases.

## Suggested video explanation

“I used JMeter to test both activity builders and their generated HTML. I increased the load from one to 100 concurrent users across five stages. Up to 25 users, this run had no failures and a 95th-percentile response time below 100 milliseconds. At 50 and 100 users, database timeouts caused errors and throughput fell. The app recovered after load stopped. This shows the current configuration's limits under this test, rather than proving it supports that many real users. The raw reports and server logs provide the evidence.”

## Scope of the evidence

These are equivalent staged local loads under the brief, not tests of 1,000 or 10,000 concurrent users. There was one run per level on one shared machine; the results should not be presented as a repeatable maximum capacity or production SLA. JMeter operates at HTTP level and [does not execute page JavaScript](https://jmeter.apache.org/). Browser rendering, page-time tracking and playing the downloaded games still require Playwright evidence. Lighthouse and the final video remain separate assessment tasks.
