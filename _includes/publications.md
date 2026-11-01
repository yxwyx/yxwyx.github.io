<h1 class="section-heading" id="publications">Selected Publications</h1>

{% assign ordered_papers = site.data.publications.main | sort: 'year' | reverse %}
<h2>First &amp; co-first author</h2>
{% for paper in ordered_papers %}
{% if paper.research_role == 'First' or paper.research_role == 'Co-first' %}
{% include editorial-paper.html paper=paper %}
{% endif %}
{% endfor %}

<h2>Other publications · newest first</h2>
{% for paper in ordered_papers %}
{% unless paper.research_role == 'First' or paper.research_role == 'Co-first' %}
{% include editorial-paper.html paper=paper %}
{% endunless %}
{% endfor %}

<p><a href="{{ site.google_scholar }}">Full publication record on Google Scholar</a></p>
