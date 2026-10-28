(function () {
  /*
    Semua kode dibungkus dalam function agar variabel di file ini tidak
    bocor ke global scope dan tidak bentrok dengan script lain.
  */
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  document.addEventListener(
    'keydown',
    function (event) {
      if ((event.ctrlKey || event.metaKey) && ['+', '-', '=', '0'].indexOf(event.key) !== -1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    'wheel',
    function (event) {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    'gesturestart',
    function (event) {
      event.preventDefault();
    },
    { passive: false }
  );

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
  var activeClickLockUntil = 0;

  function setActiveLink(sectionId) {
    links.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + sectionId);
    });
  }

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      setActiveLink(link.getAttribute('href').substring(1));
      activeClickLockUntil = Date.now() + 1200;
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
        if (Date.now() < activeClickLockUntil) {
          return;
        }

        var visibleEntries = entries.filter(function (entry) {
          return entry.isIntersecting;
        });

        if (!visibleEntries.length) {
          return;
        }

        visibleEntries.sort(function (first, second) {
          return second.intersectionRatio - first.intersectionRatio;
        });

        setActiveLink(visibleEntries[0].target.id);
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
    penuh melalui tombol Baca selengkapnya.
  */
  var experienceDescriptions = document.querySelectorAll('.timeline-item .job .experience-description');
  var experienceWordLimit = 35;

  experienceDescriptions.forEach(function (description) {
    var listItems = Array.from(description.querySelectorAll(':scope > ul > li'));
    var fullText = listItems
      .map(function (item) { return item.textContent.trim().replace(/\s+/g, ' '); })
      .join(' ');
    var words = fullText.split(' ');

    if (words.length <= experienceWordLimit) {
      return;
    }

    var remainingWords = experienceWordLimit;
    var previewItems = listItems.map(function (item) {
      if (remainingWords <= 0) {
        return null;
      }

      var itemWords = item.textContent.trim().replace(/\s+/g, ' ').split(' ');
      var previewWords = itemWords.slice(0, remainingWords);
      remainingWords -= previewWords.length;
      return previewWords.join(' ');
    }).filter(Boolean);
    var previewWrapper = document.createElement('span');
    var previewText = document.createElement('ul');
    var previewFade = document.createElement('span');
    var fullTextElement = document.createElement('ul');
    var readMore = document.createElement('button');

    previewWrapper.className = 'experience-description-preview-wrapper';
    previewText.className = 'experience-description-preview';
    previewText.replaceChildren();
    previewItems.forEach(function (itemText) {
      var item = document.createElement('li');
      item.textContent = itemText;
      previewText.append(item);
    });
    previewFade.className = 'experience-description-fade';
    previewFade.setAttribute('aria-hidden', 'true');
    fullTextElement.className = 'experience-description-full';
    listItems.forEach(function (sourceItem) {
      var item = document.createElement('li');
      item.textContent = sourceItem.textContent.trim().replace(/\s+/g, ' ');
      fullTextElement.append(item);
    });
    fullTextElement.hidden = true;
    readMore.className = 'read-more';
    readMore.type = 'button';
    readMore.textContent = 'Baca selengkapnya';
    readMore.setAttribute('aria-expanded', 'false');

    readMore.addEventListener('click', function () {
      var isExpanded = readMore.getAttribute('aria-expanded') === 'true';

      previewWrapper.hidden = !isExpanded;
      fullTextElement.hidden = isExpanded;
      readMore.textContent = isExpanded ? 'Baca selengkapnya' : 'Tampilkan lebih sedikit';
      readMore.setAttribute('aria-expanded', String(!isExpanded));
    });

    previewWrapper.append(previewText, previewFade);
    description.replaceChildren(previewWrapper, fullTextElement, readMore);
  });

  /*
    8. Ringkasan deskripsi project
    Card utama menampilkan maksimal 50 kata, sedangkan card pendukung
    menampilkan maksimal 30 kata agar ukuran grid tetap rapi.
  */
  var projectDescriptions = document.querySelectorAll('.project-card-description');

  projectDescriptions.forEach(function (description) {
    var fullText = description.textContent.trim().replace(/\s+/g, ' ');
    var words = fullText.split(' ');
    var projectCard = description.closest('.project-card');
    var projectWordLimit = projectCard && projectCard.classList.contains('project-card-featured') ? 50 : 30;

    if (words.length <= projectWordLimit) {
      return;
    }

    var preview = words.slice(0, projectWordLimit).join(' ') + '...';
    var previewWrapper = document.createElement('span');
    var previewText = document.createElement('span');
    var previewFade = document.createElement('span');
    var fullTextElement = document.createElement('span');
    var readMore = document.createElement('button');

    previewWrapper.className = 'project-card-description-preview-wrapper';
    previewText.className = 'project-card-description-preview';
    previewText.textContent = preview;
    previewFade.className = 'project-card-description-fade';
    previewFade.setAttribute('aria-hidden', 'true');
    fullTextElement.className = 'project-card-description-full';
    fullTextElement.textContent = fullText;
    fullTextElement.hidden = true;
    readMore.className = 'read-more';
    readMore.type = 'button';
    readMore.textContent = 'Baca selengkapnya';
    readMore.setAttribute('aria-expanded', 'false');

    readMore.addEventListener('click', function (event) {
      event.stopPropagation();
      var isExpanded = readMore.getAttribute('aria-expanded') === 'true';

      previewWrapper.hidden = !isExpanded;
      fullTextElement.hidden = isExpanded;
      readMore.textContent = isExpanded ? 'Baca selengkapnya' : 'Tampilkan lebih sedikit';
      readMore.setAttribute('aria-expanded', String(!isExpanded));
    });

    previewWrapper.append(previewText, previewFade);
    description.replaceChildren(previewWrapper, fullTextElement, readMore);
  });

  /*
    9. Preview foto pengalaman
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
    var projectModalTitle = projectSection.querySelector('#project-modal-title');
    var projectModalDescription = projectSection.querySelector('.project-modal-description');
    var projectModalClose = projectSection.querySelector('.project-modal-close');
    var lastProjectTrigger = null;

    function closeProjectModal() {
      projectModal.classList.remove('is-open');
      projectModal.setAttribute('aria-hidden', 'true');
      if (lastProjectTrigger) {
        lastProjectTrigger.focus();
      }
    }

    function renderProjectDescription(description) {
      projectModalDescription.replaceChildren();
      var lines = description.split('\n').map(function (line) {
        return line.trim();
      }).filter(Boolean);
      var currentList = null;

      lines.forEach(function (line) {
        var labeledParagraph = line.match(/^(Tentang):\s*(.+)$/);
        if (labeledParagraph) {
          var paragraphHeading = document.createElement('h4');
          paragraphHeading.textContent = labeledParagraph[1];
          projectModalDescription.append(paragraphHeading);
          var labeledText = document.createElement('p');
          labeledText.textContent = labeledParagraph[2];
          projectModalDescription.append(labeledText);
          currentList = null;
          return;
        }

        if (line.endsWith(':')) {
          var heading = document.createElement('h4');
          heading.textContent = line.slice(0, -1);
          projectModalDescription.append(heading);
          currentList = null;
          return;
        }

        if (line.startsWith('- ')) {
          if (!currentList) {
            currentList = document.createElement('ul');
            projectModalDescription.append(currentList);
          }
          var item = document.createElement('li');
          item.textContent = line.slice(2);
          currentList.append(item);
          return;
        }

        var paragraph = document.createElement('p');
        paragraph.textContent = line;
        projectModalDescription.append(paragraph);
        currentList = null;
      });
    }

    function openProjectModal(card) {
      projectModalTitle.textContent = card.dataset.title;
      renderProjectDescription(card.dataset.description);
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
    var recognitionZoomIn = recognitionSection.querySelector('.recognition-zoom-in');
    var recognitionZoomOut = recognitionSection.querySelector('.recognition-zoom-out');
    var lastRecognitionTrigger = null;
    var recognitionZoom = 1;
    var recognitionPanX = 0;
    var recognitionPanY = 0;
    var isRecognitionDragging = false;
    var recognitionDragStartX = 0;
    var recognitionDragStartY = 0;

    recognitionImage.draggable = false;

    function getRecognitionPanLimits() {
      var imageWidth = recognitionImage.clientWidth;
      var imageHeight = recognitionImage.clientHeight;
      var naturalRatio = recognitionImage.naturalWidth / recognitionImage.naturalHeight;
      var containerRatio = imageWidth / imageHeight;
      var contentWidth = imageWidth;
      var contentHeight = imageHeight;

      if (!Number.isFinite(naturalRatio) || !imageWidth || !imageHeight) {
        return { x: 0, y: 0 };
      }

      if (naturalRatio > containerRatio) {
        contentHeight = imageWidth / naturalRatio;
      } else {
        contentWidth = imageHeight * naturalRatio;
      }

      return {
        x: Math.max(0, (contentWidth * recognitionZoom - contentWidth) / 2),
        y: Math.max(0, (contentHeight * recognitionZoom - contentHeight) / 2)
      };
    }

    function clampRecognitionPan() {
      var limits = getRecognitionPanLimits();
      recognitionPanX = Math.max(-limits.x, Math.min(recognitionPanX, limits.x));
      recognitionPanY = Math.max(-limits.y, Math.min(recognitionPanY, limits.y));
    }

    function updateRecognitionImageTransform() {
      clampRecognitionPan();
      recognitionImage.style.transform =
        'translate(' + recognitionPanX + 'px, ' + recognitionPanY + 'px) scale(' + recognitionZoom + ')';
    }

    function resetRecognitionImagePosition() {
      recognitionZoom = 1;
      recognitionPanX = 0;
      recognitionPanY = 0;
      updateRecognitionImageTransform();
    }

    function closeRecognitionModal() {
      isRecognitionDragging = false;
      recognitionImage.classList.remove('is-dragging');
      recognitionModal.classList.remove('is-open');
      recognitionModal.classList.remove('copyright-modal');
      recognitionModal.setAttribute('aria-hidden', 'true');
      if (lastRecognitionTrigger) {
        lastRecognitionTrigger.focus();
      }
    }

    function openRecognitionModal(card) {
      var image = card.querySelector('img');
      var isCopyright = card.classList.contains('copyright-card');

      recognitionImage.src = image.src;
      recognitionImage.alt = image.alt;
      resetRecognitionImagePosition();
      recognitionTitle.textContent = card.dataset.title;
      recognitionYear.textContent = card.dataset.year ? 'Tahun terbit: ' + card.dataset.year : '';
      recognitionInstitution.textContent = card.dataset.institution || '';
      recognitionDescription.textContent = card.dataset.description;
      recognitionLink.href = card.dataset.link;
      recognitionLink.textContent = card.dataset.linkLabel;
      recognitionModal.classList.toggle('copyright-modal', isCopyright);
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
    recognitionZoomIn.addEventListener('click', function () {
      recognitionZoom = Math.min(recognitionZoom + 0.25, 3);
      updateRecognitionImageTransform();
    });

    recognitionZoomOut.addEventListener('click', function () {
      recognitionZoom = Math.max(recognitionZoom - 0.25, 1);
      if (recognitionZoom === 1) {
        recognitionPanX = 0;
        recognitionPanY = 0;
      }
      updateRecognitionImageTransform();
    });

    recognitionImage.addEventListener('pointerdown', function (event) {
      if (!recognitionModal.classList.contains('copyright-modal') || recognitionZoom <= 1) {
        return;
      }

      event.preventDefault();
      isRecognitionDragging = true;
      recognitionDragStartX = event.clientX - recognitionPanX;
      recognitionDragStartY = event.clientY - recognitionPanY;
      recognitionImage.classList.add('is-dragging');
      recognitionImage.setPointerCapture(event.pointerId);
    });

    recognitionImage.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });

    recognitionImage.addEventListener('pointermove', function (event) {
      if (!isRecognitionDragging) {
        return;
      }

      recognitionPanX = event.clientX - recognitionDragStartX;
      recognitionPanY = event.clientY - recognitionDragStartY;
      updateRecognitionImageTransform();
    });

    function stopRecognitionDragging(event) {
      if (!isRecognitionDragging) {
        return;
      }

      isRecognitionDragging = false;
      recognitionImage.classList.remove('is-dragging');
      if (event && recognitionImage.hasPointerCapture(event.pointerId)) {
        recognitionImage.releasePointerCapture(event.pointerId);
      }
    }

    recognitionImage.addEventListener('pointerup', stopRecognitionDragging);
    recognitionImage.addEventListener('pointercancel', stopRecognitionDragging);
    recognitionImage.addEventListener('lostpointercapture', function () {
      isRecognitionDragging = false;
      recognitionImage.classList.remove('is-dragging');
    });

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
      var autoSlideTimer = null;

      function showRecognitionSlide(index) {
        currentSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('is-active', slideIndex === currentSlide);
        });
      }

      function startAutoSlide() {
        if (autoSlideTimer || slides.length < 2) {
          return;
        }

        autoSlideTimer = window.setInterval(function () {
          showRecognitionSlide(currentSlide + 1);
        }, 7000);
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

      if (carousel.classList.contains('award-carousel')) {
        startAutoSlide();
      }
    });
  }
})();
