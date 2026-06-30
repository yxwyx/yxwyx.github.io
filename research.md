---
layout: page
permalink: /research.html
extra_css: ./assets/css/research-story.css
---

{% assign research_papers = site.data.publications.main | where: "research_featured", true %}
{% assign gwas_papers = research_papers | where: "research_theme", "gwas" %}
{% assign wgs_papers = research_papers | where: "research_theme", "wgs" %}

<header class="research-header">
  <p class="research-kicker">Research</p>
  <h1 class="research-title">Statistical genetics of lipid traits</h1>
  <p class="story-hero">
    My work uses large-scale genetic studies to understand why blood lipid levels vary across people and populations. I combine GWAS meta-analysis, whole-genome sequencing, rare-variant association testing, and Bayesian modeling to move from loci to mechanisms: which variants matter, which genes they implicate, and how robust those signals are across studies and ancestries.
  </p>
  <div class="research-summary-tags">
    <span>GWAS meta-analysis</span>
    <span>Whole-genome sequencing</span>
    <span>Rare variants</span>
    <span>Functional genomics</span>
    <span>Bayesian methods</span>
  </div>
</header>

<div class="impact-bar">
  <div class="impact-stat">
    <span class="impact-number" data-target="{{ research_papers.size }}">{{ research_papers.size }}</span>
    <span class="impact-label">Papers</span>
  </div>
  <div class="impact-divider"></div>
  <div class="impact-stat">
    <span class="impact-number" data-target="2">2</span>
    <span class="impact-label">Themes</span>
  </div>
  <div class="impact-divider"></div>
  <div class="impact-stat">
    <span class="impact-number" data-target="4">4</span>
    <span class="impact-label">Journals</span>
  </div>
</div>

<section class="story-chapter">
  <div class="story-chapter-label">Theme A</div>
  <h2 class="story-chapter-title">Lipid GWAS meta-analysis</h2>

  <div class="story-narrative">
    The first systematic maps of the lipid genome came from genome-wide association studies: experiments that genotype hundreds of thousands of people and test millions of common DNA variants for association with cholesterol and triglyceride levels. My work in the Global Lipids Genetics Consortium pushes this from cataloguing loci toward interpreting which genes, biological pathways, and regulatory mechanisms those loci implicate.
  </div>

  <ul class="story-paper-list">
    {% for paper in gwas_papers %}
      {% include research-paper-card.html paper=paper %}
    {% endfor %}
  </ul>
</section>

<section class="story-chapter">
  <div class="story-chapter-label">Theme B</div>
  <h2 class="story-chapter-title">Lipid whole-genome sequencing</h2>

  <div class="story-narrative">
    Array-based GWAS captures mostly common variants. Whole-genome sequencing reads every base pair, opening the genome to rarer and potentially more impactful variation. In TOPMed and related lipid sequencing studies, I help connect rare noncoding and coding variation to lipid biology at biobank scale.
  </div>

  <ul class="story-paper-list">
    {% for paper in wgs_papers %}
      {% include research-paper-card.html paper=paper %}
    {% endfor %}
  </ul>
</section>

<script>
(function () {
  var observed = false;
  var counters = document.querySelectorAll('.impact-number[data-target]');

  function animateCounters() {
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      var start = 0;
      var duration = 1200;
      var step = Math.max(1, Math.ceil(target / (duration / 16)));
      var timer = setInterval(function () {
        start = Math.min(start + step, target);
        el.textContent = start;
        if (start >= target) clearInterval(timer);
      }, 16);
    });
  }

  if ('IntersectionObserver' in window) {
    var bar = document.querySelector('.impact-bar');
    if (bar) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !observed) {
          observed = true;
          animateCounters();
          observer.disconnect();
        }
      }, { threshold: 0.4 });
      observer.observe(bar);
    }
  } else {
    animateCounters();
  }
})();
</script>
