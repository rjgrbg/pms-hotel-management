// ===== PAGINATION UTILITY FUNCTIONS =====
function paginateData(data, page, itemsPerPage) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

function getTotalPages(dataLength, itemsPerPage) {
  return Math.ceil(dataLength / itemsPerPage);
}

function renderPaginationControls(containerId, totalPages, currentPage, onPageChange) {
  const container = document.querySelector(`#${containerId} .paginationControls`);
  if (!container) return;
  
  container.innerHTML = '';
  
  const prevBtn = document.createElement('button');
  prevBtn.className = 'paginationBtn';
  prevBtn.textContent = '←';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => onPageChange(currentPage - 1);
  container.appendChild(prevBtn);
  
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.className = 'paginationBtn';
    firstBtn.textContent = '1';
    firstBtn.onclick = () => onPageChange(1);
    container.appendChild(firstBtn);
    
    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.className = 'paginationDots';
      dots.textContent = '...';
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
      dots.className = 'paginationDots';
      dots.textContent = '...';
      container.appendChild(dots);
    }
    
    const lastBtn = document.createElement('button');
    lastBtn.className = 'paginationBtn';
    lastBtn.textContent = totalPages;
    lastBtn.onclick = () => onPageChange(totalPages);
    container.appendChild(lastBtn);
  }
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'paginationBtn';
  nextBtn.textContent = '→';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => onPageChange(currentPage + 1);
  container.appendChild(nextBtn);
}