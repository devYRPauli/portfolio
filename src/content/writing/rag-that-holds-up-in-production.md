---
title: RAG That Holds Up in Production
description: Retrieval, reranking, and the evals that keep it honest
pubDate: 2026-07-03
tags:
  - rag
  - evals
---

Most RAG demos look great and most RAG systems quietly disappoint, because the demo never stressed retrieval. The model is rarely the bottleneck. The retrieval and the chunking are.

## Garbage chunks, garbage answers

Retrieval quality is capped by chunk quality. Documents that parse badly (watermarked PDFs, image-only pages, broken tables) produce chunks the retriever cannot use. Fix ingestion before you tune anything downstream.

## Hybrid retrieval beats pure vector

Dense embeddings miss exact terms; lexical search misses paraphrase. Combining dense and sparse (lexical) retrieval catches both. A good embedding model plus hybrid search is a stronger default than either alone.

## Rerank, but watch the dilution

A reranker over a candidate set sharpens results, but feeding it too many low-quality candidates can dilute the good ones and add latency. Tune the candidate ceiling deliberately rather than maximizing it.

## Cite or it did not happen

In production RAG, an answer without traceable sources is a liability. Return the supporting passages alongside the answer so a human can verify, and so you can debug what the model actually retrieved.

## Build the eval before you optimize

You cannot improve what you cannot measure. A fixed benchmark of questions with expected sources, scored on recall and answer accuracy, turns "I think this is better" into "this is 3 points better or it is not shipping."
