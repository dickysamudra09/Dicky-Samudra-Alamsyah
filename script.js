(function () {
  /*
    Semua kode dibungkus dalam function agar variabel di file ini tidak
    bocor ke global scope dan tidak bentrok dengan script lain.
  */
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  /*
    1. Memuat tema yang pernah dipilih
    localStorage menyimpan pilihan pengguna di browser. Jika belum ada
    pilihan, CSS akan mengikuti tema sistem melalui prefers-color-scheme.
  */
  try {
    var savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      root.setAttribute('data-theme', savedTheme);
    }
  } catch (error) {
    // Penyimpanan dapat tidak tersedia dalam mode privat atau konfigurasi tertentu.
  }

  /*
    2. Mengganti tema ketika tombol ditekan
    Atribut data-theme dibaca CSS untuk memilih kumpulan warna terang atau gelap.
  */
  toggle.addEventListener('click', function () {
    var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var currentTheme = root.getAttribute('data-theme') || (systemPrefersDark ? 'dark' : 'light');
    var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

    root.setAttribute('data-theme', nextTheme);

    try {
      localStorage.setItem('theme', nextTheme);
    } catch (error) {
      // Tema tetap berubah untuk sesi ini meskipun tidak bisa disimpan.
    }
  });

  /*
    3. Mengubah navigasi saat scroll
    Navigasi berubah menjadi icon rail setelah bagian hero dilewati.
    requestAnimationFrame menunggu waktu render browser yang tepat sehingga
    event scroll yang sangat sering tidak membuat halaman terasa berat.
  */
  var nav = document.querySelector('.site-nav');
  var hero = document.querySelector('.hero');
  var compactScrollPoint = hero ? hero.offsetTop + 120 : 120;
  var scrollUpdateQueued = false;

  /*
    Tooltip dikontrol oleh class, bukan selector :hover CSS.
    Dengan begitu, tooltip tidak ikut muncul saat navbar baru muncul
    tepat di bawah pointer ketika pengguna sedang scroll.
  */
  var tooltipItems = nav.querySelectorAll('a, button');
  var tooltipReady = false;

  function hideTooltips() {
    tooltipReady = false;

    tooltipItems.forEach(function (item) {
      item.classList.remove('tooltip-visible');
    });
  }

  nav.addEventListener('mousemove', function (event) {
    if (!tooltipReady) {
      return;
    }

    var item = event.target.closest('a, button');

    if (!item || !nav.classList.contains('is-compact')) {
      return;
    }

    tooltipItems.forEach(function (tooltipItem) {
      tooltipItem.classList.toggle('tooltip-visible', tooltipItem === item);
    });
  });

  nav.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'mouse' && nav.classList.contains('is-compact')) {
      tooltipReady = true;
    }
  });

  nav.addEventListener('mouseleave', hideTooltips);

  function updateCompactNavigation() {
    nav.classList.toggle('is-compact', window.scrollY > compactScrollPoint);
    scrollUpdateQueued = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      hideTooltips();

      if (scrollUpdateQueued) {
        return;
      }

      scrollUpdateQueued = true;
      window.requestAnimationFrame(updateCompactNavigation);
    },
    { passive: true }
  );

  // Menjalankan pengecekan satu kali saat halaman pertama kali dibuka.
  updateCompactNavigation();

  // Link navigasi dipakai untuk menandai section yang sedang terlihat.
  var links = document.querySelectorAll('.site-nav a[href^="#"]');
  var sections = Array.prototype.map.call(links, function (link) {
    return document.querySelector(link.getAttribute('href'));
  });

  function setActiveLink(sectionId) {
    links.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + sectionId);
    });
  }

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      setActiveLink(link.getAttribute('href').substring(1));
    });
  });

  /*
    5. Menandai link section yang sedang terlihat
    IntersectionObserver memberi tahu saat section masuk area pandang.
    Link yang sesuai diberi class "active", lalu CSS mengubah warnanya.
  */
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          setActiveLink(entry.target.id);
        });
      },
      {
        rootMargin: '-40% 0px -55% 0px'
      }
    );

    sections.forEach(function (section) {
      if (section) {
        observer.observe(section);
      }
    });
  }

  window.addEventListener(
    'scroll',
    function () {
      var isAtPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

      if (isAtPageBottom) {
        setActiveLink('contact');
      }
    },
    { passive: true }
  );

  /*
    6. Animasi timeline pengalaman
    Item baru dianimasikan saat mendekati viewport agar garis pengalaman
    terasa berjalan dari pengalaman terbaru ke pengalaman terdahulu.
  */
  var timelineItems = document.querySelectorAll('.timeline-item');

  if ('IntersectionObserver' in window) {
    var timelineObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            timelineObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    timelineItems.forEach(function (item) {
      timelineObserver.observe(item);
    });
  } else {
    timelineItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  /*
    7. Ringkasan deskripsi pengalaman
    Deskripsi dibatasi 35 kata agar timeline tetap ringkas, lalu dapat dibuka
    penuh melalui tombol Read more.
  */
  var experienceDescriptions = document.querySelectorAll('.timeline-item .job p');
  var experienceWordLimit = 35;

  experienceDescriptions.forEach(function (description) {
    var fullText = description.textContent.trim().replace(/\s+/g, ' ');
    var words = fullText.split(' ');

    if (words.length <= experienceWordLimit) {
      return;
    }

    var preview = words.slice(0, experienceWordLimit).join(' ');
    var previewWrapper = document.createElement('span');
    var previewText = document.createElement('span');
    var previewFade = document.createElement('span');
    var fullTextElement = document.createElement('span');
    var readMore = document.createElement('button');

    previewWrapper.className = 'experience-description-preview-wrapper';
    previewText.className = 'experience-description-preview';
    previewText.textContent = preview;
    previewFade.className = 'experience-description-fade';
    previewFade.setAttribute('aria-hidden', 'true');
    fullTextElement.className = 'experience-description-full';
    fullTextElement.textContent = ' ' + fullText;
    fullTextElement.hidden = true;
    readMore.className = 'read-more';
    readMore.type = 'button';
    readMore.textContent = 'Read more';
    readMore.setAttribute('aria-expanded', 'false');

    readMore.addEventListener('click', function () {
      var isExpanded = readMore.getAttribute('aria-expanded') === 'true';

      previewWrapper.hidden = !isExpanded;
      fullTextElement.hidden = isExpanded;
      readMore.textContent = isExpanded ? 'Read more' : 'Read less';
      readMore.setAttribute('aria-expanded', String(!isExpanded));
    });

    previewWrapper.append(previewText, previewFade);
    description.replaceChildren(previewWrapper, fullTextElement, readMore);
  });

  /*
    8. Preview foto pengalaman
    Modal tetap berada di area kolase agar timeline pengalaman tetap terlihat.
  */
  var experienceVisual = document.querySelector('.experience-visual');

  if (experienceVisual) {
    var photoTiles = experienceVisual.querySelectorAll('.photo-tile');
    var photoModal = experienceVisual.querySelector('.photo-modal');
    var photoModalImage = experienceVisual.querySelector('.photo-modal-image');
    var photoModalClose = experienceVisual.querySelector('.photo-modal-close');

    function closePhotoModal() {
      photoModal.classList.remove('is-open');
      photoModal.setAttribute('aria-hidden', 'true');
      photoModalImage.removeAttribute('src');
      photoModalImage.removeAttribute('alt');
    }

    function openPhotoModal(tile) {
      var image = tile.querySelector('img');

      if (!image) {
        return;
      }

      photoModalImage.src = image.src;
      photoModalImage.alt = image.alt;
      photoModal.classList.add('is-open');
      photoModal.setAttribute('aria-hidden', 'false');
      photoModalClose.focus();
    }

    photoTiles.forEach(function (tile) {
      tile.addEventListener('click', function () {
        openPhotoModal(tile);
      });

      tile.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPhotoModal(tile);
        }
      });
    });

    photoModalClose.addEventListener('click', closePhotoModal);
    photoModal.addEventListener('click', function (event) {
      if (event.target === photoModal) {
        closePhotoModal();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && photoModal.classList.contains('is-open')) {
        closePhotoModal();
      }
    });
  }

  /*
    8. Detail project
    Setiap card membuka satu modal bersama yang diisi dari data card.
  */
  var projectSection = document.querySelector('#projects');

  if (projectSection) {
    var projectCards = projectSection.querySelectorAll('.project-card');
    var projectModal = projectSection.querySelector('.project-modal');
    var projectModalPanel = projectSection.querySelector('.project-modal-panel');
    var projectModalImage = projectSection.querySelector('.project-modal-image');
    var projectModalPrevious = projectSection.querySelector('.project-modal-gallery-button.previous');
    var projectModalNext = projectSection.querySelector('.project-modal-gallery-button.next');
    var projectModalDots = projectSection.querySelector('.project-modal-gallery-dots');
    var projectModalTitle = projectSection.querySelector('#project-modal-title');
    var projectModalSummary = projectSection.querySelector('.project-modal-summary');
    var projectModalDescription = projectSection.querySelector('.project-modal-description');
    var projectModalTags = projectSection.querySelector('.project-modal-tags');
    var projectModalLink = projectSection.querySelector('.project-modal-link');
    var projectModalClose = projectSection.querySelector('.project-modal-close');
    var lastProjectTrigger = null;
    var activeProjectImages = [];
    var activeProjectImageIndex = 0;
    var activeProjectHasNavigation = false;

    function closeProjectModal() {
      projectModal.classList.remove('is-open');
      projectModal.setAttribute('aria-hidden', 'true');
      if (lastProjectTrigger) {
        lastProjectTrigger.focus();
      }
    }

    function showProjectModalImage(index) {
      activeProjectImageIndex = (index + activeProjectImages.length) % activeProjectImages.length;
      projectModalImage.src = activeProjectImages[activeProjectImageIndex].src;
      projectModalImage.alt = activeProjectImages[activeProjectImageIndex].alt;
      var showNavigation = activeProjectHasNavigation && activeProjectImages.length > 1;
      projectModalPrevious.hidden = !showNavigation;
      projectModalNext.hidden = !showNavigation;
      projectModalDots.hidden = !showNavigation;

      projectModalDots.querySelectorAll('.project-modal-gallery-dot').forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === activeProjectImageIndex);
      });
    }

    function openProjectModal(card) {
      var skills = card.dataset.skills.split('|');
      var isMccInventory = card.dataset.title === 'MCC Inventory';
      activeProjectHasNavigation = isMccInventory;

      activeProjectImages = isMccInventory
        ? Array.prototype.map.call(
            card.querySelectorAll('.project-photo-slide img'),
            function (image) {
              return { src: image.src, alt: image.alt };
            }
          )
        : [];

      if (!activeProjectImages.length) {
        var image = card.querySelector('.project-image img');
        activeProjectImages = [{ src: image.src, alt: image.alt }];
      }

      projectModalDots.replaceChildren();
      activeProjectImages.forEach(function (_, imageIndex) {
        var dot = document.createElement('button');
        dot.className = 'project-modal-gallery-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Tampilkan foto project ' + (imageIndex + 1));
        dot.addEventListener('click', function () {
          showProjectModalImage(imageIndex);
        });
        projectModalDots.appendChild(dot);
      });

      showProjectModalImage(0);

      projectModalTitle.textContent = card.dataset.title;
      projectModalSummary.textContent = card.dataset.summary;
      projectModalDescription.textContent = card.dataset.description;
      projectModalTags.replaceChildren();
      skills.forEach(function (skill) {
        var tag = document.createElement('li');
        tag.textContent = skill;
        projectModalTags.appendChild(tag);
      });
      projectModalLink.href = card.dataset.link;
      projectModalLink.textContent = card.dataset.linkLabel;
      if (card.dataset.link.charAt(0) === '#') {
        projectModalLink.removeAttribute('target');
        projectModalLink.removeAttribute('rel');
      } else {
        projectModalLink.target = '_blank';
        projectModalLink.rel = 'noopener';
      }
      lastProjectTrigger = card;
      projectModal.classList.add('is-open');
      projectModal.setAttribute('aria-hidden', 'false');
      projectModalClose.focus();
    }

    projectCards.forEach(function (card) {
      card.addEventListener('click', function () {
        openProjectModal(card);
      });

      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openProjectModal(card);
        }
      });
    });

    projectModalClose.addEventListener('click', closeProjectModal);
    projectModalPrevious.addEventListener('click', function () {
      showProjectModalImage(activeProjectImageIndex - 1);
    });

    projectModalNext.addEventListener('click', function () {
      showProjectModalImage(activeProjectImageIndex + 1);
    });
    projectModal.addEventListener('click', function (event) {
      if (event.target === projectModal) {
        closeProjectModal();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && projectModal.classList.contains('is-open')) {
        closeProjectModal();
      }
    });

    projectModalPanel.addEventListener('click', function (event) {
      event.stopPropagation();
    });
  }

  /*
    9. Detail recognition
    Sertifikat dan paten memakai format detail yang sama seperti project.
  */
  var recognitionSection = document.querySelector('#recognition');

  if (recognitionSection) {
    var recognitionCards = recognitionSection.querySelectorAll('.recognition-trigger');
    var recognitionModal = recognitionSection.querySelector('.recognition-modal');
    var recognitionPanel = recognitionSection.querySelector('.project-modal-panel');
    var recognitionImage = recognitionSection.querySelector('.project-modal-image');
    var recognitionTitle = recognitionSection.querySelector('#recognition-modal-title');
    var recognitionYear = recognitionSection.querySelector('.recognition-modal-year');
    var recognitionInstitution = recognitionSection.querySelector('.recognition-modal-institution');
    var recognitionDescription = recognitionSection.querySelector('.project-modal-description');
    var recognitionLink = recognitionSection.querySelector('.project-modal-link');
    var recognitionClose = recognitionSection.querySelector('.project-modal-close');
    var lastRecognitionTrigger = null;

    function closeRecognitionModal() {
      recognitionModal.classList.remove('is-open');
      recognitionModal.setAttribute('aria-hidden', 'true');
      if (lastRecognitionTrigger) {
        lastRecognitionTrigger.focus();
      }
    }

    function openRecognitionModal(card) {
      var image = card.querySelector('img');

      recognitionImage.src = image.src;
      recognitionImage.alt = image.alt;
      recognitionTitle.textContent = card.dataset.title;
      recognitionYear.textContent = card.dataset.year ? 'Tahun terbit: ' + card.dataset.year : '';
      recognitionInstitution.textContent = card.dataset.institution || '';
      recognitionDescription.textContent = card.dataset.description;
      recognitionLink.href = card.dataset.link;
      recognitionLink.textContent = card.dataset.linkLabel;
      lastRecognitionTrigger = card;
      recognitionModal.classList.add('is-open');
      recognitionModal.setAttribute('aria-hidden', 'false');
      recognitionClose.focus();
    }

    recognitionCards.forEach(function (card) {
      card.addEventListener('click', function () {
        openRecognitionModal(card);
      });

      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openRecognitionModal(card);
        }
      });
    });

    recognitionClose.addEventListener('click', closeRecognitionModal);
    recognitionModal.addEventListener('click', function (event) {
      if (event.target === recognitionModal) {
        closeRecognitionModal();
      }
    });

    recognitionPanel.addEventListener('click', function (event) {
      event.stopPropagation();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && recognitionModal.classList.contains('is-open')) {
        closeRecognitionModal();
      }
    });

    recognitionSection.querySelectorAll('[data-carousel]').forEach(function (carousel) {
      var slides = carousel.querySelectorAll('.recognition-photo-card');
      var previousButton = carousel.querySelector('.previous');
      var nextButton = carousel.querySelector('.next');
      var currentSlide = 0;

      function showRecognitionSlide(index) {
        currentSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('is-active', slideIndex === currentSlide);
        });
      }

      previousButton.addEventListener('click', function (event) {
        event.stopPropagation();
        showRecognitionSlide(currentSlide - 1);
      });

      nextButton.addEventListener('click', function (event) {
        event.stopPropagation();
        showRecognitionSlide(currentSlide + 1);
      });

      showRecognitionSlide(0);
    });
  }
})();
