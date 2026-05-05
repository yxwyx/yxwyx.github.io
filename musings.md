---
layout: wide
permalink: /musings.html
extra_css: /assets/css/blog.css
---

<h2 class="section-heading" id="musings">Musings</h2>

<div class="blog-list">
{% for post in site.posts %}
  <article class="blog-card">
    <div class="blog-card-date">{{ post.date | date: "%B %-d, %Y" }}</div>
    <h3 class="blog-card-title">
      <a href="{{ post.url }}">{{ post.title }}</a>
    </h3>
    <p class="blog-card-excerpt">{{ post.excerpt | strip_html | truncatewords: 40 }}</p>
    {% if post.tags.size > 0 %}
    <div class="blog-card-tags">
      {% for tag in post.tags %}
        <span class="tag">{{ tag }}</span>
      {% endfor %}
    </div>
    {% endif %}
  </article>
{% endfor %}
</div>
