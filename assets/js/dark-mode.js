// Apply saved preference before page renders to avoid flash
(function () {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('dark-mode-toggle');
  if (!btn) return;

  function updateIcon() {
    var isDark = document.documentElement.classList.contains('dark');
    btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  updateIcon();

  btn.addEventListener('click', function () {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme',
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    updateIcon();
  });
});
