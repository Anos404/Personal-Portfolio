/* ============================================================
   js/projects.js — Add Project functionality with image upload
   ============================================================ */

(function () {
  const addBtn      = document.getElementById('addProjectBtn');
  const form        = document.getElementById('addProjectForm');
  const cancelBtn   = document.getElementById('apfCancel');
  const submitBtn   = document.getElementById('apfSubmit');
  const grid        = document.getElementById('projectsGrid');
  const uploadArea  = document.getElementById('apfUploadArea');
  const uploadInner = document.getElementById('apfUploadInner');
  const fileInput   = document.getElementById('apfImage');
  const previewImg  = document.getElementById('apfPreviewImg');

  if (!addBtn || !form || !grid) return;

  let uploadedImageDataUrl = null;
  let projectCount = document.querySelectorAll('.project-card').length;

  /* ── Open / close form ── */
  addBtn.addEventListener('click', () => {
    form.classList.toggle('open');
    addBtn.classList.toggle('active');
    if (form.classList.contains('open')) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  cancelBtn.addEventListener('click', () => {
    closeForm();
  });

  function closeForm() {
    form.classList.remove('open');
    addBtn.classList.remove('active');
    resetForm();
  }

  function resetForm() {
    document.getElementById('apfTitle').value = '';
    document.getElementById('apfDesc').value = '';
    document.getElementById('apfUrl').value = '';
    document.getElementById('apfTags').value = '';
    document.getElementById('apfCategory').value = 'vanilla';
    fileInput.value = '';
    uploadedImageDataUrl = null;
    previewImg.style.display = 'none';
    previewImg.src = '';
    uploadInner.style.display = 'flex';
  }

  /* ── Image upload via click ── */
  uploadArea.addEventListener('click', (e) => {
    if (e.target === previewImg) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) handleImageFile(file);
  });

  /* ── Drag & drop ── */
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageFile(file);
  });

  function handleImageFile(file) {
    if (file.size > 8 * 1024 * 1024) {
      alert('Image is too large. Please use an image under 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageDataUrl = e.target.result;
      previewImg.src = uploadedImageDataUrl;
      previewImg.style.display = 'block';
      uploadInner.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  /* ── Submit ── */
  submitBtn.addEventListener('click', () => {
    const title    = document.getElementById('apfTitle').value.trim();
    const desc     = document.getElementById('apfDesc').value.trim();
    const url      = document.getElementById('apfUrl').value.trim();
    const tagsRaw  = document.getElementById('apfTags').value.trim();
    const category = document.getElementById('apfCategory').value;

    if (!title) {
      document.getElementById('apfTitle').focus();
      document.getElementById('apfTitle').style.borderColor = 'var(--accent2)';
      setTimeout(() => document.getElementById('apfTitle').style.borderColor = '', 2000);
      return;
    }
    if (!desc) {
      document.getElementById('apfDesc').focus();
      document.getElementById('apfDesc').style.borderColor = 'var(--accent2)';
      setTimeout(() => document.getElementById('apfDesc').style.borderColor = '', 2000);
      return;
    }

    projectCount++;
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const card = buildCard(projectCount, title, desc, url, tags, category, uploadedImageDataUrl);

    grid.appendChild(card);

    /* trigger reveal animation */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.add('visible');
      });
    });

    /* re-apply active filter */
    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter && activeFilter.dataset.filter !== 'all') {
      const f = activeFilter.dataset.filter;
      const match = card.dataset.category.includes(f);
      card.style.opacity       = match ? '1' : '0.2';
      card.style.transform     = match ? '' : 'scale(0.97)';
      card.style.pointerEvents = match ? '' : 'none';
    }

    closeForm();
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  /* ── Card builder ── */
  function buildCard(num, title, desc, url, tags, category, imgSrc) {
    const card = document.createElement('div');
    card.className = 'project-card reveal';
    card.dataset.category = category;

    const previewColors = ['preview-1','preview-2','preview-3','preview-4','preview-5','preview-6'];
    const colorClass = previewColors[(num - 1) % previewColors.length];

    const tagsHtml = tags.map(t => `<span class="project-tag">${escHtml(t)}</span>`).join('');
    const linkHtml = url ? `<a href="${escHtml(url)}" class="project-link-btn" target="_blank" rel="noopener" title="Live Demo">↗</a>` : '';

    /* preview: real image if provided, otherwise decorative UI */
    let previewContent;
    if (imgSrc) {
      previewContent = `<img src="${imgSrc}" class="project-cover-img" alt="${escHtml(title)} cover">`;
    } else {
      previewContent = `
        <div class="preview-ui" style="flex-direction:column;gap:10px;">
          <div class="preview-bar accent" style="height:10px;border-radius:6px;width:45%"></div>
          <div class="preview-bar" style="height:7px;width:75%"></div>
          <div style="flex:1;display:flex;gap:8px;">
            <div class="preview-card-mini"></div>
            <div class="preview-card-mini"></div>
            <div class="preview-card-mini"></div>
          </div>
        </div>`;
    }

    card.innerHTML = `
      <div class="project-preview ${colorClass}">
        ${previewContent}
        <div class="project-preview-overlay"></div>
        <div class="project-links">${linkHtml}</div>
      </div>
      <div class="project-body">
        <div class="project-num">${String(num).padStart(2,'0')}</div>
        <h3 class="project-title">${escHtml(title)}</h3>
        <p class="project-desc">${escHtml(desc)}</p>
        <div class="project-tags">${tagsHtml}</div>
      </div>`;

    return card;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
