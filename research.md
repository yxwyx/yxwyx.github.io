---
layout: terminal
title: Research
description: Multi-ancestry lipid GWAS, rare-variant analyses in whole-genome sequencing, and Bayesian methods for replicability.
permalink: /research.html
---

{% assign research_papers = site.data.publications.main | where: 'research_featured', true %}
{% assign gwas_papers = research_papers | where: 'research_theme', 'gwas' %}
{% assign wgs_papers = research_papers | where: 'research_theme', 'wgs' %}
<header class="research-hero">
  <p class="eyebrow">Research / Genetic architecture & human health</p>
  <h1>Different scales.<br><em>Connected questions.</em></h1>
  <p class="research-lead">How do common and rare variants shape blood lipid levels? Which genes do association signals implicate? And how well do those signals hold up across studies and populations?</p>
  <nav class="research-index" aria-label="Research themes"><a href="#gwas">01 &nbsp; GWAS & interpretation ↓</a><a href="#wgs">02 &nbsp; Rare variation ↓</a><a href="#methods">03 &nbsp; Statistical methods ↓</a></nav>
</header>
<section class="research-chapter" id="gwas">
  <div class="chapter-heading"><p class="eyebrow">01 / GWAS & interpretation</p><h2>A wider view<br>of lipid genetics.</h2><p>In the Global Lipids Genetics Consortium, I work on multi-ancestry meta-analysis and the interpretation of lipid-associated loci through gene prioritization, pleiotropy, sex differences, and functional genomic annotations.</p><a class="text-link" href="https://github.com/Global-Lipids-Genetics/glgc_biology_paper">Explore the analysis code ↗</a></div>
  <div class="chapter-papers">{% for paper in gwas_papers %}{% include editorial-paper.html paper=paper %}{% endfor %}</div>
</section>
<section class="research-chapter" id="wgs">
  <div class="chapter-heading"><p class="eyebrow">02 / Rare variation</p><h2>Looking beyond<br>the common.</h2><p>Whole-genome sequencing expands the search to rare coding and noncoding variation. My work in TOPMed includes rare-variant association analyses of long noncoding RNAs and collaborative studies of blood lipid levels.</p><p class="chapter-note">Whole-genome sequencing · Rare-variant association · Noncoding variation</p></div>
  <div class="chapter-papers">{% for paper in wgs_papers %}{% include editorial-paper.html paper=paper %}{% endfor %}</div>
</section>
<section class="research-chapter methods-chapter" id="methods">
  <div class="chapter-heading"><p class="eyebrow">03 / Statistical methods</p><h2>How robust<br>is the signal?</h2><p>I am interested in Bayesian frameworks for quantifying the replicability of pleiotropic loci across studies and populations, and how heterogeneity affects the interpretation of genetic associations.</p></div>
  <div class="methods-feature"><p class="paper-meta">Featured presentation · NESS 2025</p><h3>RePlei: Replication of pleiotropic loci with GWAS summary statistics</h3><p>A methodological direction focused on assessing evidence for replication when genetic loci are associated with multiple traits.</p><a class="text-link" href="/presentations.html">Presentations & talks ↗</a></div>
</section>
<div class="research-outro"><p class="eyebrow">Continue exploring</p><h2>The papers.<br>The methods. The details.</h2><a class="button-primary" href="/publications.html">Selected publications ↗</a></div>
