document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('certificateGrid');
  const alertBox = document.getElementById('certificateAlert');
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');

  const escapeHTML = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));

  const formatDate = (value) => new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value));

  const dashboardRoute = (role) => ({
    Citizen: '/dashboard/citizen',
    Volunteer: '/dashboard/volunteer',
    BhangariShop: '/dashboard/bhangari',
    Creator: '/dashboard/creator',
    Admin: '/dashboard/admin'
  }[role] || '/storefront');

  const apiRequest = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const showAlert = (message, type = 'error') => {
    alertBox.className = `certificate-alert ${type}`;
    alertBox.textContent = message;
  };

  const hideAlert = () => {
    alertBox.className = 'certificate-alert hidden';
    alertBox.textContent = '';
  };

  const renderMilestone = (milestone) => {
    const certificateDetails = milestone.certificate
      ? `<div class="certificate-record">
          <span><strong>Certificate ID</strong>${escapeHTML(milestone.certificate.certificateId)}</span>
          <span><strong>Issued</strong>${escapeHTML(formatDate(milestone.certificate.issuedAt))}</span>
        </div>`
      : '<p class="certificate-ready-note">Your certificate record will be created automatically when you download it.</p>';

    const action = milestone.earned
      ? `<button class="btn btn-primary certificate-download" data-milestone-key="${escapeHTML(milestone.key)}">
          <span class="material-icons-outlined">download</span> Download Certificate
        </button>
        ${milestone.certificate
          ? `<a class="btn btn-outline" href="${escapeHTML(milestone.certificate.verificationUrl)}">
              <span class="material-icons-outlined">verified</span> Verify
            </a>`
          : ''}`
      : `<button class="btn certificate-locked-button" disabled>
          <span class="material-icons-outlined">lock</span> ${Number(milestone.remainingPoints).toLocaleString()} points to unlock
        </button>`;

    return `<article class="certificate-milestone-card ${milestone.earned ? 'earned' : 'locked'}">
      <div class="certificate-card-topline">
        <span class="certificate-status ${milestone.earned ? 'earned' : 'locked'}">
          <span class="material-icons-outlined">${milestone.earned ? 'verified' : 'lock'}</span>
          ${milestone.earned ? 'Milestone earned' : 'Not yet earned'}
        </span>
        <span class="certificate-threshold">${Number(milestone.threshold).toLocaleString()} points</span>
      </div>
      <div class="certificate-card-icon">
        <span class="material-icons-outlined">${milestone.earned ? 'workspace_premium' : 'eco'}</span>
      </div>
      <h3>${escapeHTML(milestone.title)}</h3>
      <p>${escapeHTML(milestone.recognition)}</p>
      <div class="certificate-progress-label">
        <span>Green score progress</span>
        <strong>${milestone.progress}%</strong>
      </div>
      <div class="certificate-progress" aria-label="${milestone.progress}% complete">
        <span style="width: ${milestone.progress}%"></span>
      </div>
      ${milestone.earned ? certificateDetails : ''}
      <div class="certificate-actions">${action}</div>
    </article>`;
  };

  const renderPage = (data) => {
    const earnedCount = data.milestones.filter((milestone) => milestone.earned).length;
    const certificateCount = data.milestones.filter((milestone) => milestone.certificate).length;

    document.getElementById('certificateUserName').textContent = data.user.name;
    document.getElementById('certificateUserRole').textContent = data.user.role;
    document.getElementById('certificateUserAvatar').textContent = data.user.name.slice(0, 2).toUpperCase();
    document.getElementById('certificateGreenPoints').textContent = Number(data.user.greenPoints).toLocaleString();
    document.getElementById('summaryGreenPoints').textContent = Number(data.user.greenPoints).toLocaleString();
    document.getElementById('summaryMilestones').textContent = `${earnedCount} / ${data.milestones.length}`;
    document.getElementById('summaryCertificates').textContent = certificateCount;
    document.getElementById('certificateDashboardLink').href = dashboardRoute(data.user.role);

    grid.innerHTML = data.milestones.map(renderMilestone).join('');
  };

  const loadMilestones = async () => {
    try {
      hideAlert();
      const data = await apiRequest('/api/rewards/milestones');
      renderPage(data);
    } catch (err) {
      if (err.message !== 'Authentication required') {
        showAlert(err.message);
        grid.innerHTML = '<div class="certificate-empty">Milestones could not be loaded.</div>';
      }
    }
  };

  grid.addEventListener('click', async (event) => {
    const button = event.target.closest('.certificate-download');
    if (!button) return;

    const originalLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="material-icons-outlined spin">sync</span> Preparing PDF...';

    try {
      hideAlert();
      const data = await apiRequest(
        `/api/rewards/certificates/${encodeURIComponent(button.dataset.milestoneKey)}`,
        { method: 'POST' }
      );
      const downloadLink = document.createElement('a');
      downloadLink.href = data.certificate.downloadUrl;
      downloadLink.download = '';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      await loadMilestones();
      showAlert('Your verified certificate PDF is downloading.', 'success');
    } catch (err) {
      showAlert(err.message);
    } finally {
      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  });

  document.getElementById('certificateLogoutBtn').addEventListener('click', async (event) => {
    event.preventDefault();
    await fetch('/api/auth/logout', { credentials: 'same-origin' });
    window.location.href = '/login';
  });

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      sidebar.classList.toggle('active');
    });
  }

  loadMilestones();
});
