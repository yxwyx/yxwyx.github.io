document.addEventListener('DOMContentLoaded', function () {
  var papers = [
    { doi: '10.1016/j.ajhg.2023.08.007', label: 'Wang 2023' },
    { doi: '10.1186/s13059-022-02837-1',  label: 'Kanoni 2022' },
    { doi: '10.1016/j.ajhg.2022.05.012',  label: 'Ramdas 2022' },
    { doi: '10.1177/09622802221085080',    label: 'Li 2022' }
  ];

  var totalEl = document.getElementById('citation-total');
  var sparkEl = document.getElementById('citation-spark');
  if (!totalEl && !sparkEl) return;

  var counts = papers.map(function () { return null; });
  var done = 0;

  papers.forEach(function (p, i) {
    fetch('https://api.semanticscholar.org/graph/v1/paper/DOI:' + p.doi + '?fields=citationCount')
      .then(function (r) { return r.json(); })
      .then(function (d) { counts[i] = d.citationCount || 0; })
      .catch(function () { counts[i] = 0; })
      .finally(function () {
        if (++done === papers.length) render();
      });
  });

  function render() {
    var total = counts.reduce(function (a, b) { return a + b; }, 0);
    if (totalEl) totalEl.textContent = total;
    if (!sparkEl) return;

    var max = Math.max.apply(null, counts) || 1;
    var bw = 26, gap = 6, h = 36;
    var w = papers.length * (bw + gap) - gap;

    var bars = papers.map(function (p, i) {
      var bh = Math.max(3, Math.round((counts[i] / max) * h));
      var y  = h - bh;
      return [
        '<g>',
        '<title>' + p.label + ': ' + counts[i] + ' citations</title>',
        '<rect x="' + (i * (bw + gap)) + '" y="' + y + '" width="' + bw + '" height="' + bh + '" fill="#0f4d92" rx="3" opacity="0.75"/>',
        '<text x="' + (i * (bw + gap) + bw / 2) + '" y="' + (h + 13) + '" text-anchor="middle" font-size="9" fill="#999">' + counts[i] + '</text>',
        '</g>'
      ].join('');
    }).join('');

    sparkEl.innerHTML = '<svg width="' + w + '" height="' + (h + 16) + '" style="overflow:visible;display:block;margin:6px auto 0">' + bars + '</svg>';
  }
});
