// ===== TAB NAVIGATION =====
function initTabNavigation(btnSelector, contentSelectorPrefix) {
    const tabBtns = document.querySelectorAll(btnSelector);
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute(btnSelector.replace(/[\[\]]/g, ''));
        
        tabBtns.forEach(b => b.classList.remove('active'));
        
        document.querySelectorAll(`[id^="${contentSelectorPrefix}-"][id$="-tab"]`).forEach(tab => {
          tab.classList.remove('active');
        });

        btn.classList.add('active');
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
          selectedTab.classList.add('active');
          
          // Specific logic for user logs tab
          if (tabName === 'user-logs') {
            fetchAndRenderUserLogs();
          }
        }
      });
    });
}

// ===== PAGE NAVIGATION =====
function initPageNavigation() {
    const navLinks = document.querySelectorAll('.navLink');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        navLinks.forEach(l => l.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        
        link.classList.add('active');
        
        const pageName = link.getAttribute('data-page');
        const page = document.getElementById(`${pageName}-page`);
        
        if (page) {
          page.classList.add('active');
        }
      });
    });
}

// ===== LOGOUT FUNCTIONALITY =====
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutBtn = document.getElementById('closeLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (logoutModal) logoutModal.style.display = 'flex'; 
      });
    }

    if (closeLogoutBtn) {
      closeLogoutBtn.addEventListener('click', () => {
        if (logoutModal) logoutModal.style.display = 'none'; 
      });
    }

    if (cancelLogoutBtn) {
      cancelLogoutBtn.addEventListener('click', () => {
        if (logoutModal) logoutModal.style.display = 'none'; 
      });
    }

    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener('click', () => {
        console.log('Logout confirmed - redirecting to logout script');
        window.location.href = 'logout.php'; 
      });
    }
    
    if (logoutModal) {
      logoutModal.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          logoutModal.style.display = 'none';
        }
      });
    }
}

// ===== MODAL BACKDROP CLICK HANDLERS =====
function initModalBackdropClicks() {
    roomModal?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        roomModal.style.display = 'none';
        hideFormMessage();
      }
    });

    deleteRoomModal?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        deleteRoomModal.style.display = 'none';
      }
    });

    userModal?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        userModal.style.display = 'none';
        hideFormMessage(true);
      }
    });

    deleteUserModal?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        deleteUserModal.style.display = 'none';
      }
    });
}