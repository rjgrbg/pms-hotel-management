// ===== PAGINATION UTILITIES =====
function paginateData(data, page, itemsPerPage) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

function getTotalPages(dataLength, itemsPerPage) {
  return Math.ceil(dataLength / itemsPerPage);
}

function renderPaginationControls(controlsContainerId, totalPages, currentPage, onPageChange) {
    const container = document.getElementById(controlsContainerId);
    if (!container) return;

    container.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'paginationBtn';
    prevBtn.textContent = '←';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    container.appendChild(prevBtn);

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.className = 'paginationBtn';
        firstPageBtn.textContent = '1';
        firstPageBtn.onclick = () => onPageChange(1);
        container.appendChild(firstPageBtn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'paginationDots';
            container.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `paginationBtn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => onPageChange(i);
        container.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'paginationDots';
            container.appendChild(dots);
        }
        const lastPageBtn = document.createElement('button');
        lastPageBtn.className = 'paginationBtn';
        lastPageBtn.textContent = totalPages;
        lastPageBtn.onclick = () => onPageChange(totalPages);
        container.appendChild(lastPageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'paginationBtn';
    nextBtn.textContent = '→';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    container.appendChild(nextBtn);
}