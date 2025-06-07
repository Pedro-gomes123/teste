document.addEventListener('DOMContentLoaded', function() {
  const animatedEls = document.querySelectorAll('.card, .bloco-dica, .missao-texto, .missao-layout section, .missao-layout main, .filtro-item');
  const observer = new window.IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  animatedEls.forEach(el => observer.observe(el));
});
