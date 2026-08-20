---
title: Blue Omics
summary: Genomics research platform for the UF blueberry breeding program
role: Lead developer - UF IFAS
kind: Research platform
year: "2025-2026"
stack:
  - Django 5.1
  - Django REST Framework
  - PostgreSQL 16
  - React 18
  - Docker
  - BLAST+
  - JBrowse2
order: 1
featuredOrder: 1
---

An internal platform that gives the UF IFAS blueberry breeding program one place to search genes, run BLAST, browse assemblies, and read phenotype and metabolite data. It runs on a workstation inside the university network, so the data never leaves the building.

## Problem

The lab's genomics data lived in spreadsheets, FASTA files, and one-off scripts spread across machines. Answering a question like "which genes sit near this marker, and what do we know about them" meant finding the right file, remembering the right script, and trusting whoever ran it last.

Two people in the lab started the project as an idea and an early prototype. I joined in June 2025, when it was 81 source files. The developer leading it left that August, I took over as lead, and I hired two interns. It is 687 source files now.

## Approach

- Consolidated the data into one PostgreSQL schema: 30 Django models over 47 tables, loaded by 11 ingestion commands rather than by hand.
- Put every scientific tool behind one authenticated API, 75 routes covering gene search, BLAST, orthogroups, genome coordinates, transcriptome data, and metabolite assays.
- Wrote down what each tool promises, then wrote tests against those promises. A tool that returns a plausible wrong answer is worse than one that fails.
- Rebuilt the frontend and backend as a second platform version in November 2025.

## Results

- **Database:** 18 GB, 1,560,654 rows, 47 tables, 250 indexes.
- **Codebase:** 24,829 lines of Python and 47,022 of JavaScript, with 103 backend and 57 frontend tests passing.
- **BLAST correctness:** BLASTn was running Megablast, which only finds near-identical sequences. Cross-species searches came back empty and looked like real negatives. I switched it to the sensitive nucleotide task, then audited all 126 production BLAST databases.
- **Truncated downloads:** CSV and FASTA exports silently inherited the 200-row display window. A scientist could search, see 200 rows, download, and get a short file with no warning. Complete results now run to 5,000 matches.
- **Honest heatmaps:** the metabolite view labelled its rows "genotypes" when each row was really a genotype, location, year, and postharvest context. Missing assay cells stay missing now instead of being averaged away.

## Trade-offs

Access is five role-scoped accounts on shared lab machines rather than one login per person. That fits how the lab works, because people walk up to a machine and use it. It also means the platform cannot attribute an action to an individual, and that has to change if provenance ever matters.

I removed browser-based FASTQ quality control after lab review. It worked, but sequencing QC belongs in the controlled HiPerGator pipelines, and a second path only invites argument about which result is real. Deleting a working feature was right and still the least satisfying call I made.

The repository and deployment are private to the university, so there is no public link.
