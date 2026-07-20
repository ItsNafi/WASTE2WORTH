// WASTE2WORTH Client-Side Gallery Feature 7 Logic
document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // DOM ELEMENT REFERENCE
  // ============================================================
  const galleryGrid = document.getElementById('galleryGrid');
  const galleryLoading = document.getElementById('galleryLoading');
  const galleryError = document.getElementById('galleryError');
  const galleryErrorMessage = document.getElementById('galleryErrorMessage');
  const galleryRetryBtn = document.getElementById('galleryRetryBtn');
  const galleryEmpty = document.getElementById('galleryEmpty');
  const searchInput = document.getElementById('gallerySearchInput');
  const filterChipsContainer = document.getElementById('galleryFilterChips');
  const sortSelect = document.getElementById('gallerySortSelect');
  
  // Stats Counters
  const statsTotalCount = document.getElementById('statsTotalCount');
  const statsPointsIssued = document.getElementById('statsPointsIssued');

  // Modal Details
  const sliderModal = document.getElementById('sliderModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalTitle = document.getElementById('modalTitle');
  const sliderBeforeImg = document.getElementById('sliderBeforeImg');
  const sliderAfterImg = document.getElementById('sliderAfterImg');
  const sliderAfterWrapper = document.getElementById('sliderAfterWrapper');
  const sliderHandle = document.getElementById('sliderHandle');
  const modalCreatorName = document.getElementById('modalCreatorName');
  const modalPrice = document.getElementById('modalPrice');
  const modalNarrativeText = document.getElementById('modalNarrativeText');
  const modalDescriptionText = document.getElementById('modalDescriptionText');
  const modalStock = document.getElementById('modalStock');

  // Local State Store
  let allCrafts = [];
  let filteredCrafts = [];
  let currentCategory = 'all';
  let currentSearchQuery = '';
  let currentSort = 'newest';

  // ============================================================
  // AUTHENTICATION & HEADER STATE
  // ============================================================
  const loadUserInfo = async () => {
    const headerUser = document.getElementById('headerUser');
    const authLink = document.getElementById('navAuthLink');
    const dashboardLink = document.getElementById('navDashboardLink');
    if (!headerUser) return;

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) throw new Error('Not logged in');
      const user = await res.json();
      
      // Update Header
      headerUser.style.display = 'flex';
      const userNameEl = headerUser.querySelector('.user-name');
      const userRoleEl = headerUser.querySelector('.user-role');
      const userPointsEl = headerUser.querySelector('.green-points-value');
      const userAvatarEl = headerUser.querySelector('.user-avatar');

      if (userNameEl) userNameEl.textContent = user.name;
      if (userRoleEl) userRoleEl.textContent = user.role;
      if (userPointsEl) userPointsEl.textContent = user.greenPoints || 0;
      if (userAvatarEl) userAvatarEl.textContent = user.name.substring(0, 2).toUpperCase();

      // Update Navigation
      if (authLink) {
        authLink.innerHTML = '<span class="material-icons-outlined">logout</span> Logout';
        authLink.href = '#';
        authLink.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.reload();
          } catch (err) {
            console.error('Logout error:', err);
          }
        });
      }

      if (dashboardLink) {
        let dashboardRoute = '/dashboard/citizen';
        if (user.role === 'BhangariShop') dashboardRoute = '/dashboard/bhangari';
        else if (user.role === 'Creator') dashboardRoute = '/dashboard/creator';
        else if (user.role === 'Admin') dashboardRoute = '/dashboard/admin';
        else if (user.role === 'Volunteer') dashboardRoute = '/dashboard/volunteer';
        dashboardLink.href = dashboardRoute;
      }
    } catch (err) {
      console.warn('Session check failed or user guest:', err.message);
      if (headerUser) headerUser.style.display = 'none';
      if (authLink) {
        authLink.innerHTML = '<span class="material-icons-outlined">login</span> Login';
        authLink.href = '/login';
      }
    }
  };

  // Helper to escape HTML tags to avoid XSS vulnerabilities
  const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  };

  // Helper to check category keywords client-side since category field is absent in backend schema
  const inferCategory = (item) => {
    const text = `${item.title} ${item.description || ''} ${item.storyNarrative || ''}`.toLowerCase();
    
    // Keywords matching
    if (/\b(decor|vase|lamp|pot|chair|furniture|table|mirror|frame|shelf|clock|cushion|rug)\b/i.test(text)) {
      return 'decor';
    }
    if (/\b(wear|shirt|dress|jacket|pant|shoe|clothing|fabric|textile|denim|yarn|cotton|knit|wool)\b/i.test(text)) {
      return 'fashion';
    }
    if (/\b(bag|wallet|jewelry|necklace|bracelet|ring|belt|hat|cap|purse|pouch|keychain)\b/i.test(text)) {
      return 'accessories';
    }
    if (/\b(art|sculpture|painting|canvas|exhibit|sketch|craft|glass|ceramic|pottery|figure)\b/i.test(text)) {
      return 'art';
    }
    return 'decor'; // Default fallback
  };

  // ============================================================
  // DATA ACTIONS & CORE RENDERING
  // ============================================================
  const fetchGalleryData = async () => {
    galleryLoading.style.display = 'flex';
    galleryError.style.display = 'none';
    galleryGrid.style.display = 'none';
    galleryEmpty.style.display = 'none';

    try {
      const response = await fetch('/api/crafts', { credentials: 'include' });
      if (!response.ok) throw new Error('API server returned status: ' + response.status);
      
      allCrafts = await response.json();
      
      // Update statistics counters based on all upcycled items
      if (statsTotalCount) statsTotalCount.textContent = allCrafts.length;
      if (statsPointsIssued) statsPointsIssued.textContent = allCrafts.length * 30; // 30 points awarded per craft listing

      applyFiltersAndSort();
    } catch (err) {
      console.error('Fetch error:', err);
      galleryLoading.style.display = 'none';
      galleryGrid.style.display = 'none';
      galleryEmpty.style.display = 'none';
      
      galleryError.style.display = 'flex';
      if (galleryErrorMessage) {
        galleryErrorMessage.textContent = 'Unable to download upcycled crafts. Server may be offline or unreachable. (' + err.message + ')';
      }
    }
  };

  const applyFiltersAndSort = () => {
    // 1. Filter by category & search query
    filteredCrafts = allCrafts.filter(item => {
      const matchSearch = 
        item.title.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(currentSearchQuery.toLowerCase())) ||
        (item.storyNarrative && item.storyNarrative.toLowerCase().includes(currentSearchQuery.toLowerCase())) ||
        (item.creatorName && item.creatorName.toLowerCase().includes(currentSearchQuery.toLowerCase()));

      const matchCategory = currentCategory === 'all' || inferCategory(item) === currentCategory;

      return matchSearch && matchCategory;
    });

    // 2. Sort results
    if (currentSort === 'newest') {
      filteredCrafts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (currentSort === 'oldest') {
      filteredCrafts.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (currentSort === 'price-low') {
      filteredCrafts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (currentSort === 'price-high') {
      filteredCrafts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    renderGrid();
  };

  const renderGrid = () => {
    galleryLoading.style.display = 'none';
    
    if (filteredCrafts.length === 0) {
      galleryGrid.style.display = 'none';
      galleryEmpty.style.display = 'flex';
      return;
    }

    galleryEmpty.style.display = 'none';
    galleryGrid.style.display = 'grid';

    galleryGrid.innerHTML = filteredCrafts.map(item => {
      // Setup image placeholder strings
      const beforeImgHTML = item.beforePhotoUrl 
        ? `<img src="${item.beforePhotoUrl}" alt="Original Scrap" loading="lazy">`
        : `<div class="img-placeholder"><span class="material-icons-outlined">delete_outline</span><span>No Before Photo</span></div>`;
      
      const afterImgHTML = item.afterPhotoUrl 
        ? `<img src="${item.afterPhotoUrl}" alt="Upcycled Craft" loading="lazy">`
        : `<div class="img-placeholder"><span class="material-icons-outlined">storefront</span><span>No After Photo</span></div>`;

      return `
        <div class="transformation-card animate-fade-in" data-id="${item.craftId}">
          <!-- Comparison Timelines Panel -->
          <div class="timeline-comparison" title="Click to view interactive slider">
            <div class="img-container">
              ${beforeImgHTML}
              <span class="card-badge badge-before">Original Scrap</span>
            </div>
            
            <div class="timeline-separator" aria-label="Transformation arrow">
              →
            </div>
            
            <div class="img-container">
              ${afterImgHTML}
              <span class="card-badge badge-after">Upcycled Craft</span>
            </div>
          </div>

          <!-- Description Meta Info -->
          <div class="card-content">
            <div class="card-title-row">
              <h3 class="card-title">${escapeHTML(item.title)}</h3>
              <div class="card-price">$${parseFloat(item.price).toFixed(2)}</div>
            </div>
            <div class="card-creator">By ${escapeHTML(item.creatorName || 'Creator')}</div>
            
            <div class="card-narrative">
              "${escapeHTML(item.storyNarrative || 'Transforming trash into worth!')}"
            </div>
            
            <button class="btn-view-transformation" style="margin-top: 12px;">
              <span class="material-icons-outlined" style="font-size:16px;">unfold_more</span> View Side-by-Side
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events to card comparison areas and buttons
    document.querySelectorAll('.transformation-card').forEach(card => {
      const craftId = parseInt(card.getAttribute('data-id'));
      const craft = allCrafts.find(c => c.craftId === craftId);
      
      const triggerDetails = () => openSliderModal(craft);
      
      card.querySelector('.timeline-comparison').addEventListener('click', triggerDetails);
      card.querySelector('.btn-view-transformation').addEventListener('click', triggerDetails);
    });
  };

  // ============================================================
  // INTERACTIVE SPLIT SLIDER MODAL LOGIC
  // ============================================================
  let isDragging = false;

  const openSliderModal = (craft) => {
    if (!craft) return;

    modalTitle.textContent = escapeHTML(craft.title);
    modalCreatorName.textContent = escapeHTML(craft.creatorName || 'Creator');
    modalPrice.textContent = `$${parseFloat(craft.price).toFixed(2)}`;
    modalNarrativeText.textContent = craft.storyNarrative || 'No transformation narrative provided.';
    modalDescriptionText.textContent = craft.description || 'No description provided.';
    modalStock.textContent = craft.inventoryCount || 0;

    // Load before image or placeholder
    if (craft.beforePhotoUrl) {
      sliderBeforeImg.src = craft.beforePhotoUrl;
      sliderBeforeImg.style.display = 'block';
    } else {
      sliderBeforeImg.src = '/api/placeholder/400/300';
    }

    // Load after image or placeholder
    if (craft.afterPhotoUrl) {
      sliderAfterImg.src = craft.afterPhotoUrl;
      sliderAfterImg.style.display = 'block';
    } else {
      sliderAfterImg.src = '/api/placeholder/400/300';
    }

    // Reset slider handles to center (50%)
    sliderAfterWrapper.style.width = '50%';
    sliderHandle.style.left = '50%';

    sliderModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scroll
  };

  const closeSliderModal = () => {
    sliderModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Release background scroll
  };

  // Drag interaction logic for the slider
  const handleSliderMove = (clientX) => {
    const container = document.querySelector('.comparison-slider-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left; // Pixel position inside container
    let percentage = (x / rect.width) * 100;

    // Constrain percentage bounds between 0% and 100%
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    // Apply adjustments: we drag to reveal the After image on the right
    // The After image is loaded inside sliderAfterWrapper which has overflow: hidden.
    // However, the standard behavior is:
    // Left side displays the Before image (behind), and Right side displays After image (on top).
    // Or vice versa. Here, the after-wrapper is z-index 2 (top) and before-wrapper is z-index 1 (bottom).
    // To match standard image swipe sliders:
    // We adjust the width of sliderAfterWrapper to (100 - percentage) if it is absolute right, 
    // OR we change it so after-wrapper is on the left and has width equal to percentage.
    // In our HTML: 
    // before-img-wrapper: covers 100% width.
    // after-img-wrapper: left: 0, width: 50% (clipped from left).
    // So the After Image is revealed on the LEFT half, and Before Image is revealed on the RIGHT half.
    // Therefore, setting after-wrapper width to `percentage%` aligns exactly with the handle position `left: percentage%`.
    sliderAfterWrapper.style.width = `${percentage}%`;
    sliderHandle.style.left = `${percentage}%`;
  };

  // Slider event listeners
  const startDrag = (e) => {
    isDragging = true;
    e.preventDefault();
  };

  const dragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    handleSliderMove(clientX);
  };

  const stopDrag = () => {
    isDragging = false;
  };

  // Hook up event listeners for split slider
  sliderHandle.addEventListener('mousedown', startDrag);
  sliderHandle.addEventListener('touchstart', startDrag, { passive: true });

  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, { passive: true });

  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);

  // Close modal events
  modalCloseBtn.addEventListener('click', closeSliderModal);
  sliderModal.addEventListener('click', (e) => {
    if (e.target === sliderModal) closeSliderModal();
  });

  // ============================================================
  // SEARCH & FILTER COMPONENT CONTROLS
  // ============================================================
  
  // Search filtering with input debounce
  let searchDebounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
      currentSearchQuery = e.target.value;
      applyFiltersAndSort();
    }, 250);
  });

  // Category chip triggers
  filterChipsContainer.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filterChipsContainer.querySelector('.chip.active').classList.remove('active');
      chip.classList.add('active');
      
      currentCategory = chip.getAttribute('data-category');
      applyFiltersAndSort();
    });
  });

  // Sort dropdown changes
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
  });

  // Sidebar Toggle logic for mobile layouts
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('active') && !sidebar.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });
  }

  // Handle direct link query parameters e.g., ?craftId=5 to open modal on load
  const checkUrlParameters = () => {
    const params = new URLSearchParams(window.location.search);
    const craftId = parseInt(params.get('craftId'));
    if (craftId && allCrafts.length > 0) {
      const craft = allCrafts.find(c => c.craftId === craftId);
      if (craft) {
        openSliderModal(craft);
      }
    }
  };

  // Retry actions
  galleryRetryBtn.addEventListener('click', fetchGalleryData);

  // ============================================================
  // INITIALIZATION RUNS
  // ============================================================
  loadUserInfo();
  fetchGalleryData().then(() => {
    // Check parameters after the data is fully fetched
    setTimeout(checkUrlParameters, 300);
  });
});
