document.addEventListener('DOMContentLoaded', () => {
  const complaintsTbody = document.getElementById('complaintsTbody');
  const refreshButton = document.getElementById('refreshComplaintsBtn');
  const statuses = ['Pending', 'Reviewed', 'Resolved'];

  const escapeHTML = (value) => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));

  const request = async (url, options = {}) => {
    options.credentials = 'include';
    options.headers = { 'Content-Type': 'application/json', ...options.headers };

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
      throw new Error(data.error || 'Authentication required');
    }
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const notify = (message, type = 'success') => {
    if (window.showToast) window.showToast(message, type);
  };

  const renderComplaints = (complaints) => {
    if (!complaints.length) {
      complaintsTbody.innerHTML = '<tr><td colspan="7" class="text-center">No complaints have been submitted.</td></tr>';
      return;
    }

    complaintsTbody.innerHTML = complaints.map(complaint => {
      const statusOptions = statuses.map(status =>
        `<option value="${status}"${complaint.status === status ? ' selected' : ''}>${status}</option>`
      ).join('');
      const photo = complaint.photoUrl
        ? `<a href="${escapeHTML(complaint.photoUrl)}" target="_blank" rel="noopener">
             <img src="${escapeHTML(complaint.photoUrl)}" alt="Pollution reported at ${escapeHTML(complaint.locationPin)}" style="width:72px;height:54px;object-fit:cover;border-radius:8px;">
           </a>`
        : '<span class="text-muted">No photo</span>';

      return `
        <tr>
          <td>${photo}</td>
          <td>${escapeHTML(complaint.citizenName)}</td>
          <td>${escapeHTML(complaint.locationPin)}</td>
          <td>${escapeHTML(complaint.description)}</td>
          <td>${new Date(complaint.createdAt).toLocaleString()}</td>
          <td>
            <select class="form-select complaint-status" data-complaint-id="${complaint.complaintId}" aria-label="Complaint status">
              ${statusOptions}
            </select>
          </td>
          <td>
            <button type="button" class="btn btn-sm btn-danger delete-complaint" data-complaint-id="${complaint.complaintId}">
              <span class="material-icons-outlined">delete</span> Delete
            </button>
          </td>
        </tr>`;
    }).join('');
  };

  const loadComplaints = async () => {
    complaintsTbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner"></div></td></tr>';
    try {
      renderComplaints(await request('/api/pollution'));
    } catch (error) {
      complaintsTbody.innerHTML = '<tr><td colspan="7" class="text-center">Unable to load complaints.</td></tr>';
      notify(error.message, 'error');
    }
  };

  complaintsTbody.addEventListener('change', async event => {
    const select = event.target.closest('.complaint-status');
    if (!select) return;

    select.disabled = true;
    try {
      const result = await request(`/api/pollution/${select.dataset.complaintId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: select.value })
      });
      notify(result.message);
    } catch (error) {
      notify(error.message, 'error');
      await loadComplaints();
    } finally {
      select.disabled = false;
    }
  });

  complaintsTbody.addEventListener('click', async event => {
    const button = event.target.closest('.delete-complaint');
    if (!button || !window.confirm('Delete this complaint permanently?')) return;

    button.disabled = true;
    try {
      const result = await request(`/api/pollution/${button.dataset.complaintId}`, { method: 'DELETE' });
      notify(result.message);
      await loadComplaints();
    } catch (error) {
      notify(error.message, 'error');
      button.disabled = false;
    }
  });

  refreshButton.addEventListener('click', loadComplaints);
  loadComplaints();
});
