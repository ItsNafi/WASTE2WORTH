document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verificationForm');
  const input = document.getElementById('certificateId');
  const result = document.getElementById('verificationResult');

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

  const renderInvalid = (message) => {
    result.innerHTML = `<div class="verification-card invalid">
      <div class="verification-status-icon"><span class="material-icons-outlined">cancel</span></div>
      <span class="verification-kicker">Not verified</span>
      <h2>Certificate record not found</h2>
      <p>${escapeHTML(message)}</p>
    </div>`;
  };

  const renderValid = (data) => {
    const certificate = data.certificate;
    result.innerHTML = `<div class="verification-card valid">
      <div class="verification-status-icon"><span class="material-icons-outlined">verified</span></div>
      <span class="verification-kicker">Authentic WASTE2WORTH record</span>
      <h2>${escapeHTML(certificate.milestoneTitle)}</h2>
      <div class="verification-recipient">
        <span>Presented to</span>
        <strong>${escapeHTML(certificate.recipientName)}</strong>
      </div>
      <dl class="verification-details">
        <div><dt>Certificate ID</dt><dd>${escapeHTML(certificate.certificateId)}</dd></div>
        <div><dt>Green score at issuance</dt><dd>${Number(certificate.greenPointsAtIssue).toLocaleString()}</dd></div>
        <div><dt>Milestone threshold</dt><dd>${Number(certificate.threshold).toLocaleString()}</dd></div>
        <div><dt>Issued on</dt><dd>${escapeHTML(formatDate(certificate.issuedAt))}</dd></div>
      </dl>
      <p class="verification-statement">${escapeHTML(data.statement)}</p>
    </div>`;
  };

  const verify = async (certificateId) => {
    result.innerHTML = '<div class="verification-loading"><div class="spinner"></div><span>Checking the certificate registry...</span></div>';
    try {
      const response = await fetch(`/api/rewards/verify/${encodeURIComponent(certificateId)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.valid) {
        renderInvalid(data.error || 'The supplied certificate ID is not valid.');
        return;
      }
      renderValid(data);
    } catch (err) {
      renderInvalid('Verification is temporarily unavailable. Please try again.');
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const certificateId = input.value.trim().toUpperCase();
    if (!certificateId) return;
    window.history.replaceState(null, '', `/certificates/verify/${encodeURIComponent(certificateId)}`);
    verify(certificateId);
  });

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const routeCertificateId = pathParts.length >= 3 ? decodeURIComponent(pathParts[2]) : '';
  if (routeCertificateId) {
    input.value = routeCertificateId;
    verify(routeCertificateId.toUpperCase());
  }
});
