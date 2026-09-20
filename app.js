const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const toast = document.querySelector('.egg-toast');
let toastTimer;
const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-active');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-active'), 2800);
};

const sprinkle = (x, y) => {
  if (reducedMotion) return;
  for (let i = 0; i < 14; i += 1) {
    const dot = document.createElement('i');
    dot.className = 'sparkle';
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.setProperty('--dx', `${Math.cos(i / 14 * Math.PI * 2) * (35 + Math.random() * 35)}px`);
    dot.style.setProperty('--dy', `${Math.sin(i / 14 * Math.PI * 2) * (35 + Math.random() * 35)}px`);
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }
};

const logo = document.querySelector('.brand-mark');
let logoClicks = 0;
let logoReset;
logo?.addEventListener('click', (event) => {
  event.preventDefault();
  logoClicks += 1;
  clearTimeout(logoReset);
  logoReset = setTimeout(() => { logoClicks = 0; }, 1100);
  if (logoClicks === 3) {
    document.body.classList.toggle('secret-mode');
    sprinkle(event.clientX, event.clientY);
    showToast(document.body.classList.contains('secret-mode') ? '小小的 Qt 灵魂，已被唤醒 ✦' : '彩蛋已收好，继续设计吧');
    logoClicks = 0;
  }
});

const secretKeys = ['q', 't', '6'];
let keyBuffer = [];
document.addEventListener('keydown', (event) => {
  if (event.key.length !== 1) return;
  keyBuffer = [...keyBuffer, event.key.toLowerCase()].slice(-secretKeys.length);
  if (keyBuffer.join('') === secretKeys.join('')) {
    document.body.classList.add('secret-mode');
    sprinkle(window.innerWidth / 2, window.innerHeight / 2);
    showToast('Qt 6 mode · smoothness increased');
    keyBuffer = [];
  }
});

document.querySelector('.secret-footer')?.addEventListener('click', () => {
  showToast('源码里藏着下一颗彩蛋 ↗');
});

if (!reducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

  const glow = document.querySelector('.pointer-glow');
  if (glow) {
    window.addEventListener('pointermove', (event) => {
      glow.style.transform = `translate3d(${event.clientX - 110}px, ${event.clientY - 110}px, 0)`;
    }, { passive: true });
  }

  document.querySelectorAll('.magnetic').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const box = button.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * 0.12;
      const y = (event.clientY - box.top - box.height / 2) * 0.18;
      button.style.transform = `translate(${x}px, ${y}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });

  const tilt = document.querySelector('.tilt-card');
  if (tilt) {
    tilt.addEventListener('pointermove', (event) => {
      const box = tilt.getBoundingClientRect();
      const rotateX = ((event.clientY - box.top) / box.height - 0.5) * -5;
      const rotateY = ((event.clientX - box.left) / box.width - 0.5) * 6;
      tilt.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(2deg) translateY(-6px)`;
    });
    tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }
}
