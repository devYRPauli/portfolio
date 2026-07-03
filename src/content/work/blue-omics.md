---
title: Blue Omics
summary: Full-stack research data platform
role: Software Engineer to Lead
year: "2025"
stack:
  - Django REST
  - React
  - TypeScript
  - PostgreSQL
  - GCP + Kubernetes
  - Terraform
  - Docker
order: 1
---

A Django, React, and PostgreSQL platform that grew from zero to 5M+ live records and became the primary system for an entire research lab.

## Problem

A research lab ran its data on a sprawl of spreadsheets and manual workflows. Submitting, searching, and cross-referencing records was slow, error-prone, and impossible to scale across 30+ researchers and 5 labs.

## Approach

- Designed and built Blue Omics from scratch: a React frontend on a Django REST backend with PostgreSQL, structured across 32 data models and 58 API endpoints.
- Built 7 ingestion pipelines for heterogeneous formats (PDF, Excel, CSV, Word, PowerPoint), cutting manual data prep from hours to minutes.
- Tuned PostgreSQL with 35 explicit indexes and caching to hold low-millisecond latency under concurrent access by 30+ users.
- Deployed on GCP with Kubernetes and Terraform, Docker multi-stage builds, and CI/CD. Optimized the frontend from 8s to 3s load time.

## Results

- **Live records:** 0 -> 5M+
- **Trait-lookup latency:** spreadsheet -> ~25 ms
- **Frontend load time:** 8 s -> 3 s
- **Daily active users:** baseline -> +40%

## Trade-offs

Chose a well-indexed PostgreSQL core over premature service-splitting to keep one clear backup and monitoring story. The platform replaced manual workflows entirely and became the system of record, which is what earned the promotion path from Software Engineer to Lead.
