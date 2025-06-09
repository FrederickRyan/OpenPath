// script.js

document.addEventListener('DOMContentLoaded', () => {
  // ─── 0) Authentication / “Logged‐In State” Setup ────────────────────────────
  const loginLink   = document.getElementById('loginLink');
  const signupLink  = document.getElementById('signupLink');
  const profileDiv  = document.getElementById('profileContainer');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  if (currentUser) {
    // We have a logged‐in user → Replace the Login/Signup links
    if (loginLink)  loginLink.style.display  = 'none';
    if (signupLink) signupLink.style.display = 'none';

    // Build a tiny “profile‐icon + FirstName + (optional Logout)” HTML
    const firstName = currentUser.fullName.split(' ')[0];
    profileDiv.style.display = 'flex';
    profileDiv.style.alignItems = 'center';
    profileDiv.style.gap = '0.5rem';

    // profile avatar (use stored profileImage if available)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userRecord = users.find(u => u.email === currentUser.email) || {};
    const avatar = document.createElement('img');
    avatar.src = userRecord.profileImage || 'assets/OP_Logo.png';
    avatar.alt = 'Profile';
    avatar.style.width = '28px';
    avatar.style.height = '28px';
    avatar.style.borderRadius = '50%';

    // clickable name → goes to profile.html
    const nameLink = document.createElement('a');
    nameLink.href = 'profile.html';
    nameLink.classList.add('js-transition');
    nameLink.innerText = firstName;
    nameLink.style.color = '#fff';
    nameLink.style.fontWeight = 'bold';
    nameLink.style.textDecoration = 'none';

    // optional “Log Out” link next to it
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.innerText = '(Log Out)';
    logoutLink.style.color = '#fff';
    logoutLink.style.marginLeft = '0.5rem';
    logoutLink.style.fontSize = '0.85rem';
    logoutLink.onclick = function(e) {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      // reload the page so nav resets
      window.location.reload();
    };

    profileDiv.appendChild(avatar);
    profileDiv.appendChild(nameLink);
    profileDiv.appendChild(logoutLink);
  } else {
    // no user → ensure the profileDiv stays hidden
    if (profileDiv) profileDiv.style.display = 'none';
  }


  // ─── 1) Hamburger / Nav‐toggle (unchanged) ─────────────────────────────────
  const burger = document.getElementById('burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const navLinks = document.getElementById('navLinks');
      navLinks && navLinks.classList.toggle('show');
    });
  }

  // ─── 2) Fade‐out transitions on .js-transition links (unchanged) ─────────────
  document.querySelectorAll('.js-transition').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.getAttribute('href');
      document.body.classList.add('fade-out');
      setTimeout(() => window.location.href = href, 500);
    });
  });

  // ─── 3) Scroll‐animations for modules / job cards (unchanged) ───────────────
  const animatedItems = document.querySelectorAll('.module-card, .module-explanation, .job-card');
  if (animatedItems.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('visible', entry.isIntersecting);
      });
    }, { threshold: 0.2 });
    animatedItems.forEach(el => io.observe(el));
  }

  // ─── 4) index: Job autocomplete & redirect to JobVacancy.html (unchanged) ───
  if (location.pathname.endsWith('index.html') || location.pathname.endsWith('/')) {
    const input = document.getElementById('job-search-input');
    const sugg  = document.getElementById('suggestions');
    if (input && sugg) {
      let vacancies = [];
      fetch('JobVacancy.html')
        .then(r => r.text())
        .then(html => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          doc.querySelectorAll('.job-card h2').forEach(h2 => {
            vacancies.push(h2.textContent.trim());
          });
        });

      function go(query) {
        document.body.classList.add('fade-out');
        setTimeout(() => {
          const url = query
            ? `JobVacancy.html?search=${encodeURIComponent(query)}`
            : 'JobVacancy.html';
          window.location.href = url;
        }, 500);
      }

      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        sugg.innerHTML = '';
        if (!q) {
          sugg.style.display = 'none';
          return;
        }
        const matches = vacancies.filter(v => v.toLowerCase().includes(q));
        if (!matches.length) {
          sugg.style.display = 'none';
          return;
        }
        sugg.style.display = 'block';
        matches.forEach(v => {
          const li = document.createElement('li');
          li.textContent = v;
          li.addEventListener('click', () => go(v));
          sugg.appendChild(li);
        });
      });

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          go(input.value.trim());
        }
      });

      // index: Disability toggle (unchanged from before)
      const homeIcon   = document.getElementById('disabilityIcon');
      const homeToggle = document.querySelector('.disability-toggle');
      if (homeIcon && homeToggle) {
        const saved = localStorage.getItem('filterDisability') === 'true';
        homeIcon.style.visibility = saved ? 'visible' : 'hidden';

        homeToggle.addEventListener('click', () => {
          const nowOn = homeIcon.style.visibility === 'hidden';
          homeIcon.style.visibility = nowOn ? 'visible' : 'hidden';
          localStorage.setItem('filterDisability', nowOn);
        });
      }
    }
  }

  // ─── 5) Modules page: In‐page autocomplete & filter (unchanged) ──────────────
  if (location.pathname.endsWith('modules.html')) {
    const inputM  = document.getElementById('module-search-input');
    const suggM   = document.getElementById('module-suggestions');
    const noResM  = document.getElementById('module-no-results');
    const cardsM  = Array.from(document.querySelectorAll('.module-card'));
    if (inputM && suggM && noResM && cardsM.length) {
      const titlesM = cardsM.map(c => c.querySelector('h2').textContent.trim());

      function applyModuleFilter(q) {
        const term = q.toLowerCase();
        cardsM.forEach(card => {
          const title = card.querySelector('h2').textContent.toLowerCase();
          const match = term === '' || title.includes(term);
          if (match) {
            card.style.display = '';
            card.classList.remove('visible');
            void card.offsetWidth;
            card.classList.add('visible');
          } else {
            card.style.display = 'none';
            card.classList.remove('visible');
          }
        });
        const anyVisible = cardsM.some(c => c.style.display !== 'none');
        noResM.style.display = anyVisible ? 'none' : 'block';
        suggM.style.display = 'none';
      }

      inputM.addEventListener('input', () => {
        const q = inputM.value.trim().toLowerCase();
        suggM.innerHTML = '';
        if (!q) {
          suggM.style.display = 'none';
          return;
        }
        const matches = titlesM.filter(t => t.toLowerCase().includes(q));
        if (!matches.length) {
          suggM.style.display = 'none';
          return;
        }
        suggM.style.display = 'block';
        matches.forEach(t => {
          const li = document.createElement('li');
          li.textContent = t;
          li.addEventListener('click', () => {
            inputM.value = t;
            applyModuleFilter(t);
          });
          suggM.appendChild(li);
        });
      });

      inputM.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyModuleFilter(inputM.value.trim());
        }
      });
    }
  }

  // ─── 6) JobVacancy page: Autocomplete + Filter + Disability toggle + Login/Confirm/Success popups ─
  if (location.pathname.endsWith('JobVacancy.html')) {
    const icon         = document.getElementById('disabilityIcon');
    const input        = document.getElementById('job-search-input');
    const sugg         = document.getElementById('suggestions');
    const noResJ       = document.getElementById('job-no-results');
    const cardsJ       = Array.from(document.querySelectorAll('.job-card'));

    // Grab all three modals by ID:
    const loginModal   = document.getElementById('loginModalOverlay');
    const confirmModal = document.getElementById('confirmModalOverlay');
    const successModal = document.getElementById('successModalOverlay');

    // 1) “Apply Now” handler:
    document.querySelectorAll('.apply-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        // Check if user is logged in:
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser) {
          // Not logged in → show “Login Required”
          loginModal.classList.add('show');
        } else {
          // Logged in → show “Profile Check” popup
          confirmModal.classList.add('show');
        }
      });
    });

    // 2) Close “Login Required” popup:
    document.getElementById('closeModal')
      .addEventListener('click', () => {
        loginModal.classList.remove('show');
      });
    loginModal.addEventListener('click', e => {
      if (e.target === loginModal) {
        loginModal.classList.remove('show');
      }
    });

    // 3) “Profile Check” popup buttons:
    //  a) If user clicks “Submit” → hide confirm, show success:
    document.getElementById('confirmSubmit')
      .addEventListener('click', () => {
        // Hide “Profile Check”:
        confirmModal.classList.remove('show');

        // Fill in the success message with the user’s email:
        const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const email   = current ? current.email : '';
        document.getElementById('successMessage').innerText =
          `Data is successfully sent. Please wait for further information at your email: ${email}`;

        // Show the “Success” popup
        successModal.classList.add('show');
      });

    //  b) If user clicks “Go to Profile” → just navigate to profile.html
    document.getElementById('confirmProfile')
      .addEventListener('click', () => {
        window.location.href = 'profile.html';
      });

    // If user clicks outside the “Profile Check” modal, close it:
    confirmModal.addEventListener('click', e => {
      if (e.target === confirmModal) {
        confirmModal.classList.remove('show');
      }
    });

    // 4) “Success” popup close button:
    document.getElementById('successClose')
      .addEventListener('click', () => {
        successModal.classList.remove('show');
      });
    // If user clicks outside the “Success” modal, close it:
    successModal.addEventListener('click', e => {
      if (e.target === successModal) {
        successModal.classList.remove('show');
      }
    });


    // ─── 5) The rest of your existing JobVacancy logic (autocomplete + disability) ─
    if (icon && input && sugg && noResJ && cardsJ.length) {
      const vacanciesJ = cardsJ.map(c => c.querySelector('h2').textContent.trim());

      // Restore disability toggle state:
      const saved = localStorage.getItem('filterDisability') === 'true';
      icon.style.visibility = saved ? 'visible' : 'hidden';

      /* ── NEW: apply saved filter on load ── */
      applyFilter(input.value.trim());

      // Prefill search box from query string (if present)
      const urlQ = new URLSearchParams(location.search).get('search') || '';
      if (urlQ) {
        input.value = urlQ;
        applyFilter(input.value.trim());
      }

      // Autocomplete dropdown
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        sugg.innerHTML = '';
        if (!q) {
          sugg.style.display = 'none';
          return;
        }
        const matches = vacanciesJ.filter(v => v.toLowerCase().includes(q));
        if (!matches.length) {
          sugg.style.display = 'none';
          return;
        }
        sugg.style.display = 'block';
        matches.forEach(v => {
          const li = document.createElement('li');
          li.textContent = v;
          li.addEventListener('click', () => {
            input.value = v;
            applyFilter(v);
          });
          sugg.appendChild(li);
        });
      });

      // “Enter” key → filter
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyFilter(input.value.trim());
        }
      });

      // Disability toggle button
      document.querySelector('.disability-toggle').addEventListener('click', () => {
        const nowOn = icon.style.visibility === 'hidden';
        icon.style.visibility = nowOn ? 'visible' : 'hidden';
        localStorage.setItem('filterDisability', nowOn);
        applyFilter(input.value.trim());
      });

      // Core filter function
      function applyFilter(q) {
        const term     = q.toLowerCase();
        const filterOn = icon.style.visibility !== 'hidden';
        cardsJ.forEach(card => {
          const title      = card.querySelector('h2').textContent.toLowerCase();
          const textOk     = term === '' || title.includes(term);
          const isFriendly = Boolean(card.querySelector('.disability-icon'));

          if (textOk && (!filterOn || isFriendly)) {
            card.style.display = '';
            card.classList.remove('visible');
            void card.offsetWidth;  // force reflow for animation
            card.classList.add('visible');
          } else {
            card.style.display = 'none';
            card.classList.remove('visible');
          }
        });

        // Show/hide “no‐results” banner
        const anyVisible = cardsJ.some(c => c.style.display !== 'none');
        noResJ.style.display = anyVisible ? 'none' : 'block';

        sugg.style.display = 'none';
      }
    }
  }

  // ─── 7) Profile page prefill (handled inline in profile.html script) ─────────
  // (That code lives inside the <script> in profile.html, so we do not repeat it here.)
}); // end DOMContentLoaded
