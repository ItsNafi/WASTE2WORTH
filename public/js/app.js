// WASTE2WORTH Client-Side Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  
  // Toast container setup
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  window.showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    
    toast.innerHTML = `
      <span class="material-icons-outlined toast-icon">${icon}</span>
      <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  const apiCall = async (url, options = {}) => {
    try {
      // Default headers for JSON (skip if FormData)
      if (!options.body || !(options.body instanceof FormData)) {
        options.headers = {
          'Content-Type': 'application/json',
          ...options.headers
        };
      }
      
      options.credentials = options.credentials || 'include';
      const res = await fetch(url, options);
      
      // Attempt to parse JSON response
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // If not JSON, it might be a redirect page or plain text error
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'An error occurred');
        return text;
      }

      if (!res.ok) {
        // If authentication/authorization issues, redirect to login
        if (res.status === 401 || res.status === 403) {
          if (!options.ignoreAuthError) {
            showToast(data.error || 'Authentication required', 'error');
            setTimeout(() => { window.location.href = '/login'; }, 700);
          }
          throw new Error(data.error || 'Authentication required');
        }
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ============================================================
  // SIDEBAR & NAVIGATION
  // ============================================================
  
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('active') && !sidebar.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });
  }

  // Highlight active nav item
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const btn = loginForm.querySelector('button[type="submit"]');
      
      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Signing in...';
        
        const res = await apiCall('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        
        showToast(res.message, 'success');
        if (res.redirect) setTimeout(() => window.location.href = res.redirect, 500);
      } catch (err) {
        // Error already handled by apiCall
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
      
      if (password.length < 6) {
        return showToast('Password must be at least 6 characters', 'error');
      }
      
      const btn = registerForm.querySelector('button[type="submit"]');
      
      try {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Creating account...';
        
        const res = await apiCall('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role })
        });
        
        showToast(res.message, 'success');
        if (res.redirect) setTimeout(() => window.location.href = res.redirect, 500);
      } catch (err) {
        // Error already handled
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await apiCall('/api/auth/logout');
        window.location.href = res.redirect || '/login';
      } catch (err) {}
    });
  }

  // ============================================================
  // USER INFO LOADING
  // ============================================================
  
  const loadUserInfo = async (isPublic = false) => {
    // Only load if elements exist on page
    if (!document.querySelector('.user-name') && !document.getElementById('headerUser')) return;
    
    try {
      const user = await apiCall('/api/auth/me', { ignoreAuthError: isPublic });
      
      // Reveal header user details if logged in
      const headerUser = document.getElementById('headerUser');
      if (headerUser) headerUser.style.display = 'flex';
      
      // Update sidebar links dynamically for logged-in user
      const authLink = document.getElementById('navAuthLink');
      if (authLink) {
        authLink.innerHTML = '<span class="material-icons-outlined">logout</span> Logout';
        authLink.id = 'logoutBtn'; // Hook up logout listener
        authLink.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            const res = await apiCall('/api/auth/logout');
            window.location.href = res.redirect || '/login';
          } catch (err) {}
        });
      }
      
      const dashboardLink = document.getElementById('navDashboardLink');
      if (dashboardLink) {
        let route = '/dashboard/citizen';
        if (user.role === 'BhangariShop') route = '/dashboard/bhangari';
        else if (user.role === 'Creator') route = '/dashboard/creator';
        else if (user.role === 'Admin') route = '/dashboard/admin';
        else if (user.role === 'Volunteer') route = '/dashboard/volunteer';
        dashboardLink.href = route;
      }

      const creatorProfileLink = document.getElementById('navCreatorProfileLink');
      if (creatorProfileLink && user.role === 'Creator') {
        creatorProfileLink.href = `/creator-profile/${user.id}`;
        creatorProfileLink.style.display = 'flex';
      }
      
      document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
      document.querySelectorAll('.user-role').forEach(el => el.textContent = user.role);
      document.querySelectorAll('.green-points-value').forEach(el => el.textContent = user.greenPoints || 0);
      
      const avatarStr = user.name.substring(0, 2).toUpperCase();
      document.querySelectorAll('.user-avatar').forEach(el => el.textContent = avatarStr);
      
      const pointsStat = document.getElementById('statPoints');
      if (pointsStat) pointsStat.textContent = user.greenPoints || 0;
      
      // Fetch and render notifications
      try {
        const notifs = await apiCall('/api/notifications', { ignoreAuthError: true });
        if (notifs) {
          const unreadCount = notifs.filter(n => !n.isRead).length;
          
          let notifDropdown = document.getElementById('notifDropdown');
          if (!notifDropdown) {
            notifDropdown = document.createElement('div');
            notifDropdown.id = 'notifDropdown';
            notifDropdown.style.cssText = 'position:relative; margin-right: 15px; cursor: pointer; display: flex; align-items: center;';
            notifDropdown.innerHTML = `
              <span class="material-icons-outlined" style="font-size:24px; color: var(--color-text-secondary);">notifications</span>
              <span id="notifBadge" style="display:none; position:absolute; top:-5px; right:-5px; background:var(--color-accent-amber); color:white; font-size:10px; font-weight:bold; padding:2px 5px; border-radius:10px;">0</span>
              <div id="notifList" style="display:none; position:absolute; top:35px; right:0; width:300px; background:white; box-shadow:var(--shadow-card); border-radius:var(--radius-md); border:1px solid var(--color-border); z-index:100; max-height:300px; overflow-y:auto;">
              </div>
            `;
            headerUser.insertBefore(notifDropdown, headerUser.firstChild);
            
            notifDropdown.addEventListener('click', async (e) => {
              const list = document.getElementById('notifList');
              if (list.style.display === 'none') {
                list.style.display = 'block';
                // Mark as read
                if (unreadCount > 0) {
                  await apiCall('/api/notifications/mark-read', { method: 'POST', ignoreAuthError: true });
                  document.getElementById('notifBadge').style.display = 'none';
                }
              } else {
                list.style.display = 'none';
              }
            });
            
            // Close dropdown if clicked outside
            document.addEventListener('click', (e) => {
              if (!notifDropdown.contains(e.target)) {
                document.getElementById('notifList').style.display = 'none';
              }
            });
          }
          
          const badge = document.getElementById('notifBadge');
          if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'block';
          } else {
            badge.style.display = 'none';
          }
          
          const list = document.getElementById('notifList');
          if (notifs.length === 0) {
            list.innerHTML = '<div style="padding:15px; text-align:center; color:var(--color-text-muted); font-size:0.9rem;">No notifications</div>';
          } else {
            list.innerHTML = notifs.map(n => `
              <div style="padding:12px 15px; border-bottom:1px solid var(--color-border-light); background:${n.isRead ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.05)'};">
                <div style="font-size:0.9rem; color:var(--color-text-primary); margin-bottom:4px;">${escapeHTML(n.message)}</div>
                <div style="font-size:0.75rem; color:var(--color-text-muted);">${formatDate(n.createdAt)}</div>
              </div>
            `).join('');
          }
        }
      } catch (err) {
        console.warn("Could not load notifications", err);
      }
      
    } catch (err) {
      console.warn("User not logged in or failed to load user info:", err.message);
    }
  };

  // Profile Upgrade Helper
  window.upgradeRole = async (newRole) => {
    if (!confirm(`Are you sure you want to apply/upgrade to ${newRole}?`)) return;
    try {
      const res = await apiCall('/api/auth/role', {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      showToast(res.message, 'success');
      if (res.redirect) {
        setTimeout(() => window.location.href = res.redirect, 1000);
      } else {
        loadUserInfo();
      }
    } catch (err) {
      // Error handled by apiCall
    }
  };

  // Setup photo preview helper
  const setupPhotoPreview = (inputId, previewId, zoneId) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const zone = document.getElementById(zoneId);
    
    if (!input || !preview) return;
    
    // Click zone to trigger input
    if (zone) {
      zone.addEventListener('click', () => input.click());
      
      // Drag & Drop
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('active');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('active'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('active');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          input.files = e.dataTransfer.files;
          const event = new Event('change');
          input.dispatchEvent(event);
        }
      });
    }

    input.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          let img = preview.querySelector('img');
          if (!img) {
            img = document.createElement('img');
            preview.appendChild(img);
          }
          img.src = e.target.result;
          preview.classList.add('has-image');
        }
        reader.readAsDataURL(this.files[0]);
      }
    });
  };

  // ============================================================
  // CITIZEN: SCRAP LISTING
  // ============================================================
  
  if (currentPath.includes('/citizen')) {
    setupPhotoPreview('scrapPhoto', 'photoPreview', 'uploadZone');
    
    const scrapForm = document.getElementById('scrapForm');
    if (scrapForm) {
      scrapForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(scrapForm);
        const btn = scrapForm.querySelector('button[type="submit"]');
        
        try {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Submitting...';
          
          await apiCall('/api/scrap', {
            method: 'POST',
            body: formData // Let fetch set boundary for multipart
          });
          
          showToast('Scrap listing created! +10 Green Points', 'success');
          scrapForm.reset();
          document.getElementById('photoPreview').classList.remove('has-image');
          
          // Reload lists & user info (points update)
          loadMyListings();
          loadUserInfo();
        } catch (err) {
          // Handled
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">add_circle</span> Submit Listing';
        }
      });
    }

    const loadMyListings = async () => {
      const container = document.getElementById('myListings');
      const statTotal = document.getElementById('statTotal');
      const statActive = document.getElementById('statActive');
      
      if (!container) return;
      
      try {
        const listings = await apiCall('/api/scrap/my');
        
        if (statTotal) statTotal.textContent = listings.length;
        if (statActive) statActive.textContent = listings.filter(l => l.status === 'Available').length;
        
        if (listings.length === 0) {
          container.innerHTML = `
            <div class="empty-state animate-fade-in">
              <span class="material-icons-outlined empty-state-icon">inventory_2</span>
              <p class="empty-state-text">You haven't listed any scrap yet.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = `
          <div class="table-responsive animate-fade-in">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Category</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Listed On</th>
                </tr>
              </thead>
              <tbody>
                ${listings.map(item => `
                  <tr>
                    <td>
                      ${item.photoUrl 
                        ? `<img src="${item.photoUrl}" class="table-photo" alt="Scrap">` 
                        : `<div class="table-photo" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;"><span class="material-icons-outlined">image</span></div>`
                      }
                    </td>
                    <td style="font-weight:500;">${escapeHTML(item.category)}</td>
                    <td>${item.weight} kg</td>
                    <td><span class="status-pill" data-status="${item.status}">${item.status}</span></td>
                    <td style="color:var(--color-text-secondary);">${formatDate(item.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } catch (err) {
        container.innerHTML = `<div class="form-error">Failed to load listings.</div>`;
      }
    };
    
    const loadPriceDirectory = async () => {
      const tbody = document.getElementById('citizenPriceDirectory');
      if (!tbody) return;
      try {
        const prices = await apiCall('/api/scrap/prices');
        tbody.innerHTML = prices.map(p => `
          <tr>
            <td style="font-weight: 600; color: var(--color-primary);">${escapeHTML(p.categoryName)}</td>
            <td style="font-weight: 500;">$${parseFloat(p.pricePerKg).toFixed(2)} / kg</td>
          </tr>
        `).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center form-error">Failed to load price directory.</td></tr>`;
      }
    };
    
    // Initial loads
    loadUserInfo();
    loadMyListings();
    loadPriceDirectory();
  }

  // ============================================================
  // BHANGARI: BUYING BOARD
  // ============================================================
  
  if (currentPath.includes('/bhangari')) {
    let allBoardListings = [];
    
    // Global purchase function attached to window so inline onclick works
    window.purchaseScrap = async (listingId) => {
      if(!confirm('Are you sure you want to purchase this scrap material?')) return;
      
      try {
        await apiCall(`/api/bhangari/purchase/${listingId}`, { method: 'POST' });
        showToast('Purchase successful! +15 Green Points', 'success');
        loadBhangariBoard();
        loadUserInfo();
      } catch (err) {
        // Handled
      }
    };

    const renderBoardTable = (data) => {
      const tbody = document.getElementById('bhangariBoard');
      if (!tbody) return;
      
      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--color-text-muted);">No listings found for this category.</td></tr>`;
        return;
      }
      
      tbody.innerHTML = data.map(item => `
        <tr class="animate-fade-in">
          <td>
            ${item.photoUrl 
              ? `<img src="${item.photoUrl}" class="table-photo" alt="Scrap">` 
              : `<div class="table-photo" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;"><span class="material-icons-outlined">image</span></div>`
            }
          </td>
          <td>
            <div style="font-weight:500;">${escapeHTML(item.ownerName)}</div>
          </td>
          <td>${escapeHTML(item.category)}</td>
          <td style="font-weight:600;color:var(--color-primary);">${item.weight} kg</td>
          <td><span class="status-pill" data-status="${item.status}">${item.status}</span></td>
          <td style="color:var(--color-text-secondary);">${formatDate(item.createdAt)}</td>
          <td>
            ${item.status === 'Available' 
              ? `<button class="btn btn-primary btn-sm" onclick="purchaseScrap(${item.listingId})">Buy Now</button>`
              : `<button class="btn btn-ghost btn-sm" disabled>Sold Out</button>`
            }
          </td>
        </tr>
      `).join('');
    };

    const loadBhangariBoard = async () => {
      try {
        allBoardListings = await apiCall('/api/bhangari/board');
        
        // Update stats
        const statAvail = document.getElementById('statAvailable');
        const statPurch = document.getElementById('statPurchased');
        if (statAvail) statAvail.textContent = allBoardListings.filter(l => l.status === 'Available').length;
        if (statPurch) statPurch.textContent = allBoardListings.filter(l => l.status === 'Sold').length;
        
        // Setup initial render
        const activeChip = document.querySelector('.chip.active');
        const activeCat = activeChip ? activeChip.dataset.cat : 'All';
        filterBoard(activeCat);
        
      } catch (err) {
        const tbody = document.getElementById('bhangariBoard');
        if(tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center form-error">Failed to load board data.</td></tr>`;
      }
    };

    const filterBoard = (category) => {
      if (category === 'All') {
        renderBoardTable(allBoardListings);
      } else {
        renderBoardTable(allBoardListings.filter(l => l.category === category));
      }
    };

    // Chip click listeners
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterBoard(chip.dataset.cat);
      });
    });

    window.purchaseVolunteerWaste = async (registrationId, weight) => {
      const category = prompt('Specify waste category to buy (e.g. Plastic, Metal, Paper, Glass, E-Waste):', 'Plastic');
      if (!category) return;
      
      try {
        await apiCall(`/api/payments/purchase-campaign-waste/${registrationId}`, {
          method: 'POST',
          body: JSON.stringify({ category })
        });
        showToast('Purchase successful! Funds routed to campaign fund.', 'success');
        loadVolunteerWaste();
        loadCampaignFundBalance();
        loadUserInfo();
      } catch (err) {}
    };

    const loadCampaignFundBalance = async () => {
      const el = document.getElementById('statCampaignFund');
      if (!el) return;
      try {
        const data = await apiCall('/api/payments/campaign-fund');
        el.textContent = `$${data.balance}`;
      } catch (err) {}
    };

    const loadVolunteerWaste = async () => {
      const tbody = document.getElementById('volunteerWasteBoard');
      if (!tbody) return;
      
      try {
        const data = await apiCall('/api/payments/attended-registrations');
        const withWaste = data.filter(r => parseFloat(r.wasteCollectedKg) > 0);
        
        if (withWaste.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:20px;color:var(--color-text-muted);">No campaign waste available for purchase.</td></tr>`;
          return;
        }
        
        tbody.innerHTML = withWaste.map(item => `
          <tr class="animate-fade-in">
            <td><div style="font-weight:500;">${escapeHTML(item.campaignTitle)}</div></td>
            <td>${escapeHTML(item.volunteerName)}</td>
            <td style="font-weight:600;color:var(--color-primary);">${item.wasteCollectedKg} kg</td>
            <td><span class="status-pill" data-status="Available">Available</span></td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="purchaseVolunteerWaste(${item.registrationId}, ${item.wasteCollectedKg})">Buy Waste</button>
            </td>
          </tr>
        `).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center form-error">Failed to load campaign waste data.</td></tr>`;
      }
    };

    const loadBhangariPriceDirectory = async () => {
      const tbody = document.getElementById('bhangariPriceDirectory');
      if (!tbody) return;
      try {
        const prices = await apiCall('/api/scrap/prices');
        tbody.innerHTML = prices.map(p => `
          <tr>
            <td style="font-weight: 600; color: var(--color-primary);">${escapeHTML(p.categoryName)}</td>
            <td style="font-weight: 500;">$${parseFloat(p.pricePerKg).toFixed(2)} / kg</td>
          </tr>
        `).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center form-error">Failed to load price directory.</td></tr>`;
      }
    };

    loadUserInfo();
    loadBhangariBoard();
    loadVolunteerWaste();
    loadCampaignFundBalance();
    loadBhangariPriceDirectory();
  }

  // ============================================================
  // CREATOR: RAW MATERIALS & CRAFTS
  // ============================================================
  
  if (currentPath.includes('/creator')) {
    
    // Setup for raw materials view
    if (document.getElementById('rawMaterialsFeed')) {
      
      window.secureMaterial = async (listingId) => {
        try {
          await apiCall(`/api/creator/purchase/${listingId}`, { method: 'POST' });
          showToast('Material secured! +25 Green Points', 'success');
          loadRawMaterials();
          loadUserInfo();
        } catch (err) {}
      };

      const loadRawMaterials = async () => {
        const feed = document.getElementById('rawMaterialsFeed');
        const statAvail = document.getElementById('statAvailable');
        
        try {
          const listings = await apiCall('/api/creator/materials');
          
          if(statAvail) statAvail.textContent = listings.length;
          
          if(listings.length === 0) {
            feed.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No available raw materials right now.</div>`;
            return;
          }
          
          feed.innerHTML = listings.map(item => `
            <div class="product-card animate-fade-in">
              <img src="${item.photoUrl || '/api/placeholder/400/300'}" class="product-card-image" alt="Scrap">
              <div class="product-card-body">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                  <h3 class="product-card-title">${escapeHTML(item.category)}</h3>
                  <span class="inventory-badge" style="background:var(--color-primary-bg);color:var(--color-primary);">${item.weight} kg</span>
                </div>
                <div class="product-card-creator">Source: ${escapeHTML(item.ownerName)}</div>
                
                <div style="margin-top:auto; padding-top:16px;">
                  <button class="btn btn-outline btn-block" onclick="secureMaterial(${item.listingId})">Secure Material</button>
                </div>
              </div>
            </div>
          `).join('');
          
        } catch (err) {
          feed.innerHTML = `<div class="form-error">Failed to load materials.</div>`;
        }
      };
      
      loadRawMaterials();
    }
    
    // Setup for create craft form
    if (document.getElementById('craftForm')) {
      setupPhotoPreview('beforePhoto', 'beforePreview', 'beforeZone');
      setupPhotoPreview('afterPhoto', 'afterPreview', 'afterZone');
      
      const form = document.getElementById('craftForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const btn = form.querySelector('button[type="submit"]');
        
        try {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Listing...';
          
          await apiCall('/api/crafts', {
            method: 'POST',
            body: formData
          });
          
          showToast('Upcycled craft listed successfully! +30 Points', 'success');
          form.reset();
          document.getElementById('beforePreview').classList.remove('has-image');
          document.getElementById('afterPreview').classList.remove('has-image');
          loadUserInfo();
        } catch (err) {
          // Handled
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">storefront</span> List Craft on Store';
        }
      });
    }

    loadUserInfo();
  }

  // ============================================================
  // STOREFRONT
  // ============================================================
  
  if (currentPath === '/storefront' || currentPath === '/storefront/') {
    
    const storefrontGrid = document.getElementById('storefrontGrid');
    let storefrontCrafts = [];

    window.buyCraft = async (craftId, title, price, creatorName) => {
      // Build a payment confirmation modal
      const existing = document.getElementById('paymentModal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'paymentModal';
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
        z-index:9999;display:flex;align-items:center;justify-content:center;
        animation:fadeIn 200ms ease;
      `;
      modal.innerHTML = `
        <div style="background:white;border-radius:16px;padding:32px;max-width:420px;width:90%;
                    box-shadow:0 24px 60px rgba(0,0,0,0.2);animation:slideUp 250ms ease;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--color-primary-bg);
                        color:var(--color-primary);display:flex;align-items:center;justify-content:center;">
              <span class="material-icons-outlined">shopping_bag</span>
            </div>
            <div>
              <div style="font-weight:700;font-size:1.1rem;color:var(--color-text-primary);">Confirm Purchase</div>
              <div style="font-size:0.85rem;color:var(--color-text-secondary);">Secure checkout</div>
            </div>
          </div>
          <div style="background:var(--color-border-light);border-radius:12px;padding:16px;margin-bottom:20px;">
            <div style="font-weight:600;font-size:1rem;color:var(--color-text-primary);margin-bottom:4px;">${escapeHTML(title)}</div>
            <div style="color:var(--color-text-secondary);font-size:0.9rem;">By ${escapeHTML(creatorName)}</div>
            <div style="margin-top:12px;font-size:1.5rem;font-weight:800;color:var(--color-primary);">$${parseFloat(price).toFixed(2)}</div>
          </div>
          <p style="font-size:0.85rem;color:var(--color-text-secondary);margin-bottom:20px;">
            🌱 Your purchase directly supports this artisan and awards you <strong>+10 Green Points</strong>.
          </p>
          <div style="display:flex;gap:10px;">
            <button id="payConfirmBtn" class="btn btn-primary" style="flex:1;">
              <span class="material-icons-outlined">payment</span> Pay Now
            </button>
            <button id="payCancelBtn" class="btn btn-ghost" style="flex:1;">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Cancel
      document.getElementById('payCancelBtn').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

      // Confirm pay
      document.getElementById('payConfirmBtn').addEventListener('click', async () => {
        const btn = document.getElementById('payConfirmBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Processing...';
        try {
          await apiCall(`/api/payments/checkout/${craftId}`, { method: 'POST' });
          modal.remove();
          showToast(`✅ Purchase successful! +10 Green Points earned.`, 'success');
          loadStorefront();
          loadUserInfo();
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">payment</span> Pay Now';
        }
      });
    };

    const renderStorefront = (items) => {
      if (!storefrontGrid) return;
      if (items.length === 0) {
        storefrontGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No crafts found for this category.</div>`;
        return;
      }

      storefrontGrid.innerHTML = items.map(item => `
        <div class="product-card animate-fade-in">
          <div style="position:relative; overflow:hidden;" class="craft-img-container">
            <img src="${item.afterPhotoUrl || '/api/placeholder/400/300'}" class="product-card-image" alt="${escapeHTML(item.title)}">
            ${item.beforePhotoUrl ? `<div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); color:white; font-size:10px; padding:2px 8px; border-radius:10px; text-transform:uppercase;">Upcycled</div>` : ''}
          </div>
          <div class="product-card-body">
            <h3 class="product-card-title">${escapeHTML(item.title)}</h3>
            <div class="product-card-creator">By <a href="/creator-profile/${item.creatorId}" class="creator-link" style="color: var(--color-primary); font-weight: 600; text-decoration: none;">${escapeHTML(item.creatorName)}</a></div>
            <div class="product-card-category" style="margin: 8px 0 0; color: var(--color-text-secondary); font-size: 0.95rem;">${escapeHTML(item.category || 'Uncategorized')}</div>
            <div class="product-card-desc" style="margin-top:10px;">
              ${escapeHTML(item.description || 'No description provided.')}
            </div>
            <div class="product-card-meta">
              <div class="product-card-price">$${item.price}</div>
              <div class="inventory-badge">${item.inventoryCount} in stock</div>
            </div>
            <div style="margin-top:16px;">
              ${item.inventoryCount > 0 
                ? `<button class="btn btn-primary btn-block btn-sm" onclick="buyCraft(${item.craftId}, '${escapeHTML(item.title).replace(/'/g,"\\'")}', ${item.price}, '${escapeHTML(item.creatorName).replace(/'/g,"\\'")}')">Buy Now</button>`
                : `<button class="btn btn-ghost btn-block btn-sm" disabled>Out of Stock</button>`
              }
            </div>
          </div>
        </div>
      `).join('');
    };

    const filterStorefront = (category) => {
      if (!category || category === 'All') {
        return renderStorefront(storefrontCrafts);
      }

      const filtered = storefrontCrafts.filter(item => item.category === category);
      renderStorefront(filtered);
    };

    const loadStorefront = async () => {
      if (!storefrontGrid) return;
      
      try {
        const crafts = await apiCall('/api/crafts');
        storefrontCrafts = crafts;
        
        if (crafts.length === 0) {
          storefrontGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No upcycled crafts available yet.</div>`;
          return;
        }
        
        filterStorefront('All');
      } catch (err) {
        storefrontGrid.innerHTML = `<div class="form-error">Failed to load storefront products.</div>`;
      }
    };

    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterStorefront(chip.dataset.cat || 'All');
      });
    });
    
    loadStorefront();
    loadUserInfo(true);
  }

  // ============================================================
  // VOLUNTEER: CAMPAIGNS
  // ============================================================
  if (currentPath.includes('/volunteer')) {
    const loadCampaigns = async () => {
      const feed = document.getElementById('campaignsFeed');
      if (!feed) return;
      try {
        const campaigns = await apiCall('/api/campaigns');
        if (campaigns.length === 0) {
          feed.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No upcoming campaigns.</div>`;
          return;
        }
        feed.innerHTML = campaigns.map(c => `
          <div class="product-card animate-fade-in">
            <div class="product-card-body">
              <h3 class="product-card-title">${escapeHTML(c.title)}</h3>
              <div class="product-card-creator">Date: ${formatDate(c.date)}</div>
              <div class="product-card-desc">Zone: ${escapeHTML(c.boundaryZone)}</div>
              <div class="product-card-meta">
                <div>Volunteers: ${c.currentVolunteers}/${c.participantCap}</div>
              </div>
              <div style="margin-top:16px;">
                <button class="btn btn-outline btn-block" onclick="registerCampaign(${c.campaignId})">Register</button>
              </div>
            </div>
          </div>
        `).join('');
      } catch (err) {
        feed.innerHTML = `<div class="form-error">Failed to load campaigns.</div>`;
      }
    };

    window.registerCampaign = async (id) => {
      try {
        await apiCall(`/api/campaigns/${id}/register`, { method: 'POST' });
        showToast('Registered successfully!', 'success');
        loadCampaigns();
      } catch (err) {}
    };

    const mockScanBtn = document.getElementById('mockScanBtn');
    if (mockScanBtn) {
      mockScanBtn.addEventListener('click', async () => {
        const campaignId = prompt('Enter Campaign ID you are attending:');
        if (!campaignId) return;
        const wasteKg = prompt('Enter Waste Collected in KG (optional):', '0');
        
        // Need volunteer ID, but API will get it from req.user
        // So we just send campaignId and wasteCollectedKg
        const volunteerId = 999; // API uses req.user.id instead, so we just pass dummy if needed or API will handle.
        // Wait, campaign scan route expects volunteerId in body?
        // Let's pass it if needed, or rely on req.user.
        // Wait, the API requires volunteerId in body. Let's just fetch it from profile.
        const user = await apiCall('/api/auth/me');

        try {
          const res = await apiCall('/api/campaigns/scan', {
            method: 'POST',
            body: JSON.stringify({ campaignId: parseInt(campaignId), volunteerId: user.id, wasteCollectedKg: parseFloat(wasteKg) })
          });
          showToast(res.message, 'success');
          loadUserInfo();
        } catch(err) {}
      });
    }

    loadUserInfo();
    loadCampaigns();
  }

  // ============================================================
  // CITIZEN: POLLUTION COMPLAINTS
  // ============================================================
  if (currentPath.includes('/citizen/pollution')) {
    setupPhotoPreview('scrapPhoto', 'photoPreview', 'uploadZone');
    
    const form = document.getElementById('pollutionForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const btn = form.querySelector('button[type="submit"]');
        try {
          btn.disabled = true;
          btn.innerHTML = 'Submitting...';
          const res = await apiCall('/api/pollution', { method: 'POST', body: formData });
          showToast(res.message, 'success');
          form.reset();
          document.getElementById('photoPreview').classList.remove('has-image');
          loadReports();
          loadUserInfo();
        } catch (err) {} finally {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons-outlined">send</span> Submit Report';
        }
      });
    }

    const loadReports = async () => {
      const tbody = document.getElementById('myPollutionReports');
      if (!tbody) return;
      try {
        const reports = await apiCall('/api/pollution/my');
        if (reports.length === 0) {
          tbody.innerHTML = `<tr><td colspan="3" class="text-center">No reports yet.</td></tr>`;
          return;
        }
        tbody.innerHTML = reports.map(r => `
          <tr>
            <td>${escapeHTML(r.locationPin)}</td>
            <td><span class="status-pill">${r.status}</span></td>
            <td>${formatDate(r.createdAt)}</td>
          </tr>
        `).join('');
      } catch (err) {}
    };

    loadUserInfo();
    loadReports();
  }

  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================
  if (currentPath.includes('/admin')) {
    const loadAdminDashboard = async () => {
      try {
        const data = await apiCall('/api/admin/dashboard');
        
        // Prices
        const pTbody = document.getElementById('priceDirectoryTbody');
        if (pTbody) {
          pTbody.innerHTML = data.prices.map(p => `
            <tr>
              <td>${escapeHTML(p.categoryName)}</td>
              <td><input type="number" step="0.01" class="form-input" style="width:100px; padding:4px;" value="${p.pricePerKg}" id="price-${p.categoryId}"></td>
              <td><button class="btn btn-sm btn-primary" onclick="updatePrice(${p.categoryId})">Update</button></td>
            </tr>
          `).join('');
        }
        
        // Pollution
        const rTbody = document.getElementById('pollutionAdminTbody');
        if (rTbody) {
          if (data.complaints.length === 0) {
            rTbody.innerHTML = `<tr><td colspan="5" class="text-center">No reports loaded.</td></tr>`;
          } else {
            rTbody.innerHTML = data.complaints.map(c => `
              <tr>
                <td>${escapeHTML(c.citizenName)}</td>
                <td>${escapeHTML(c.locationPin)}</td>
                <td>${escapeHTML(c.description)}</td>
                <td><span class="status-pill">${c.status}</span></td>
                <td>${formatDate(c.createdAt)}</td>
              </tr>
            `).join('');
          }
        }
      } catch (err) {}
    };

    window.updatePrice = async (id) => {
      const val = document.getElementById(`price-${id}`).value;
      try {
        await apiCall(`/api/admin/prices/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ pricePerKg: val })
        });
        showToast('Price updated successfully');
      } catch (err) {}
    };

    const campaignForm = document.getElementById('adminCampaignForm');
    if (campaignForm) {
      campaignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
          title: document.getElementById('campaignTitle').value,
          date: document.getElementById('campaignDate').value,
          participantCap: document.getElementById('campaignCap').value,
          boundaryZone: document.getElementById('campaignZone').value
        };
        try {
          await apiCall('/api/admin/campaigns', { method: 'POST', body: JSON.stringify(body) });
          showToast('Campaign launched successfully!', 'success');
          campaignForm.reset();
        } catch (err) {}
      });
    }

    loadUserInfo();
    loadAdminDashboard();
  }

  // Certificate Download Helper
  const downloadCertBtn = document.getElementById('downloadCertBtn');
  if (downloadCertBtn) {
    downloadCertBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('/api/rewards/certificate', '_blank');
    });
  }

  if (currentPath === '/dashboard/volunteer/product-story') {

    const storyForm = document.getElementById('productStoryForm');
    if (storyForm) {
      storyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(storyForm);
        const btn = storyForm.querySelector('button[type="submit"]');
        try {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-icons-outlined spin">sync</span> Adding...';
          await apiCall('/api/crafts', {
            method: 'POST',
            body: formData
          });
          showToast('Product Story added successfully!', 'success');
          storyForm.reset();
          loadProductStories();
          loadUserInfo();
        } catch (err) {
        } finally {
          btn.disabled = false;
          btn.innerHTML = 'Add Product Story';
        }
      });
    }

    const loadProductStories = async () => {
      const grid = document.getElementById('storiesGrid');
      if (!grid) return;
      grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

      try {
        const crafts = await apiCall('/api/crafts');
        const filtered = crafts.filter(c => c.origin || c.materialsUsed || c.transformation || c.storyNarrative || c.title);

        if (filtered.length === 0) {
          grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
              <span class="material-icons-outlined empty-state-icon">eco</span>
              <p class="empty-state-text">No product stories yet. Add one above!</p>
            </div>`;
          return;
        }

        grid.innerHTML = filtered.map(item => {
          const mockReviews = [
            { user: 'Anon Buyer', text: 'This item is beautiful, highly recommend!' },
            { user: 'Eco Friend', text: 'Amazing environmental impact! Let\'s save Dhaka!' }
          ];

          return `
            <div class="story-card animate-fade-in" id="storyCard-${item.craftId}">
              <div class="story-card-header">
                <h3>🌱 ${escapeHTML(item.title || 'Product Story')}</h3>
                <span class="story-card-badge">
                  <span class="material-icons-outlined" style="font-size:12px;">sell</span>
                  ৳${parseFloat(item.price).toFixed(2)}
                </span>
              </div>

              ${item.afterPhotoUrl || item.beforePhotoUrl ? `
              <div style="width:100%;height:240px;overflow:hidden;background:#f0f4f0;">
                <img src="${item.afterPhotoUrl || item.beforePhotoUrl}" alt="Product picture"
                     style="width:100%;height:100%;object-fit:cover;">
              </div>` : `
              <div style="width:100%;height:140px;display:flex;align-items:center;justify-content:center;background:#f0f4f0;color:#94a3b8;">
                <span class="material-icons-outlined" style="font-size:48px;">image_not_supported</span>
              </div>`}

              <div class="story-card-body">
                ${item.description ? `
                <div class="story-section-block">
                  <span class="story-label-title">Description:</span>
                  <span class="story-value-text">${escapeHTML(item.description)}</span>
                </div>
                <div class="story-divider"></div>` : ''}

                <div class="story-section-block">
                  <span class="story-label-title">Origin:</span>
                  <span class="story-value-text">${escapeHTML(item.origin || 'Collected from Community Campaign')}</span>
                </div>

                <div class="story-section-block">
                  <span class="story-label-title">Materials Used:</span>
                  <span class="story-value-text">${escapeHTML(item.materialsUsed || 'Recycled materials')}</span>
                </div>

                <div class="story-section-block">
                  <span class="story-label-title">Created By:</span>
                  <span class="story-value-text" style="font-weight:600;color:var(--color-primary-dark);">${escapeHTML(item.creatorName || '—')}</span>
                </div>

                <div class="story-divider"></div>

                <div class="story-section-block">
                  <span class="story-label-title">Transformation:</span>
                  <span class="story-value-text" style="font-style:italic;white-space:pre-line;">${escapeHTML(item.transformation || item.storyNarrative || 'N/A')}</span>
                </div>

                <div class="story-divider"></div>

                <div class="story-section-block">
                  <span class="story-label-title">Environmental Impact:</span>
                  <ul class="story-impact-list">
                    <li class="story-impact-item">
                      <span class="material-icons-outlined icon">check_circle</span>
                      <span>${item.unitsRecycled || 0} units recycled</span>
                    </li>
                    <li class="story-impact-item">
                      <span class="material-icons-outlined icon">check_circle</span>
                      <span>${item.wasteKgDiverted ? parseFloat(item.wasteKgDiverted).toFixed(1) : '0.0'} kg waste diverted</span>
                    </li>
                    ${item.environmentalNote ? `
                    <li class="story-impact-item">
                      <span class="material-icons-outlined icon">check_circle</span>
                      <span>${escapeHTML(item.environmentalNote)}</span>
                    </li>` : ''}
                  </ul>
                </div>
              </div>

              <div class="story-reviews-box">
                <div class="story-reviews-header">
                  <span>Customer Reviews</span>
                  <span style="font-size:0.75rem;color:var(--color-primary);font-weight:600;text-transform:none;cursor:pointer;"
                        onclick="addMockReview(${item.craftId})">Write Review</span>
                </div>
                <div id="reviewsList-${item.craftId}">
                  ${mockReviews.map(r => `
                    <div class="story-review-item">
                      <span class="story-review-user">${escapeHTML(r.user)}</span>
                      <span>${escapeHTML(r.text)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('');
      } catch (err) {
        grid.innerHTML = `<div class="form-error">Failed to load product stories.</div>`;
      }
    };

    window.addMockReview = (craftId) => {
      const text = prompt('Write a review text:');
      if (!text) return;
      const reviewsList = document.getElementById(`reviewsList-${craftId}`);
      if (!reviewsList) return;
      const user = prompt('Enter your name:', 'Eco Volunteer') || 'Eco Volunteer';
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'story-review-item';
      reviewDiv.innerHTML = `
        <span class="story-review-user">${escapeHTML(user)}</span>
        <span>${escapeHTML(text)}</span>
      `;
      reviewsList.appendChild(reviewDiv);
      showToast('Review submitted successfully!', 'success');
    };

    const searchInput = document.getElementById('storySearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll('.story-card').forEach(card => {
          card.style.display = card.textContent.toLowerCase().includes(query) ? 'flex' : 'none';
        });
      });
    }

    loadUserInfo();
    loadProductStories();
  }

});
