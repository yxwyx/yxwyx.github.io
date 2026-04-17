document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.bibtex-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-bibtex');
      navigator.clipboard.writeText(text).then(function () {
        var orig = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('bibtex-copied');
        setTimeout(function () {
          btn.textContent = orig;
          btn.classList.remove('bibtex-copied');
        }, 1600);
      }).catch(function () {
        // Fallback for older browsers
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Cite'; }, 1600);
      });
    });
  });
});
