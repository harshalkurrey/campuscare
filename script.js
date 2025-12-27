// Application State
let currentUser = null;
let currentUserRole = null;
let submissions = JSON.parse(localStorage. getItem('campusCareSubmissions')) || [];
let users = JSON.parse(localStorage.getItem('campusCareUsers')) || [];
let adminPoints = parseInt(localStorage.getItem('adminPoints')) || 0;
let notifications = JSON.parse(localStorage.getItem('campusCareNotifications')) || [];

// Constants
const ADMIN_CODE = 'ADMIN2025';
const pages = {
    login: 'loginPage',
    signup: 'signUpPage',
    forgotPassword: 'forgotPasswordPage',
    dashboard: 'dashboardPage',
    submissionType: 'submissionTypePage',
    submissionForm: 'submissionFormPage',
    updateDetails: 'updateDetailsPage'
};

let currentSubmissionType = null;
let currentCategory = null;

// Utility Functions
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage. classList.add('active');
    }
    
    const profileSection = document.getElementById('profileSection');
    if (pageId === pages.login || pageId === pages. signup || pageId === pages. forgotPassword) {
        profileSection. style.display = 'none';
        updateAdminPointsDisplay();
    } else {
        profileSection.style.display = 'block';
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => element.classList.remove('show'), 5000);
    }
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element. textContent = message;
        element.classList.add('show');
        setTimeout(() => element.classList.remove('show'), 3000);
    }
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.classList.remove('show');
}

function saveToLocalStorage() {
    localStorage. setItem('campusCareUsers', JSON.stringify(users));
    localStorage.setItem('campusCareSubmissions', JSON.stringify(submissions));
    localStorage.setItem('campusCareNotifications', JSON.stringify(notifications));
    localStorage.setItem('adminPoints', adminPoints. toString());
}

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function updateAdminPointsDisplay() {
    const adminPointsDisplay = document.getElementById('adminPointsDisplay');
    const roleSelect = document.getElementById('roleSelect');
    
    if (roleSelect && roleSelect.value === 'admin') {
        adminPointsDisplay.style.display = 'block';
        document.getElementById('adminPoints').textContent = adminPoints;
    } else {
        adminPointsDisplay.style.display = 'none';
    }
}

// Authentication Functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function findUser(email, role) {
    return users.find(user => user.email === email && user. role === role);
}

function authenticateUser(email, password, role, adminCode = null) {
    const user = findUser(email, role);
    
    if (! user) {
        return { success: false, message: 'User not found.  Please sign up first.' };
    }
    
    if (user.password !== password) {
        return { success: false, message: 'Invalid password.' };
    }
    
    if (role === 'admin' && adminCode !== ADMIN_CODE) {
        return { success: false, message: 'Invalid admin code.' };
    }
    
    return { success: true, user: user };
}

function createUser(userData) {
    const existingUser = findUser(userData.email, userData.role);
    
    if (existingUser) {
        return { success: false, message:  'User with this email and role already exists.' };
    }
    
    if (userData.role === 'admin' && userData.adminCode !== ADMIN_CODE) {
        return { success: false, message: 'Admin code wrong' };
    }
    
    const newUser = {
        id: generateId(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        erp: userData.erp || null,
        course: userData.course || null,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveToLocalStorage();
    
    return { success: true, user: newUser };
}

function createSubmission(submissionData) {
    const submission = {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        type: submissionData. type,
        category: submissionData. category,
        description: submissionData. description,
        isUrgent: submissionData.isUrgent || false,
        fileName: submissionData. fileName || null,
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    submissions.push(submission);
    saveToLocalStorage();
    return submission;
}

function getUserSubmissions(userId, filter = 'all') {
    let userSubmissions = submissions. filter(sub => sub.userId === userId);
    
    if (filter === 'urgent') {
        userSubmissions = userSubmissions.filter(sub => sub.isUrgent);
    } else if (filter === 'normal') {
        userSubmissions = userSubmissions.filter(sub => !sub.isUrgent);
    }
    
    return userSubmissions. sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getAllSubmissions(filter = 'all') {
    let filteredSubmissions = [... submissions];
    
    if (filter === 'urgent') {
        filteredSubmissions = filteredSubmissions.filter(sub => sub.isUrgent);
    } else if (filter === 'normal') {
        filteredSubmissions = filteredSubmissions.filter(sub => !sub. isUrgent);
    } else if (filter === 'new') {
        filteredSubmissions = filteredSubmissions.filter(sub => sub. status === 'new');
    }
    
    return filteredSubmissions. sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateSubmissionStatus(submissionId, newStatus) {
    const submissionIndex = submissions. findIndex(sub => sub.id === submissionId);
    
    if (submissionIndex === -1) return false;
    
    submissions[submissionIndex].status = newStatus;
    submissions[submissionIndex]. updatedAt = new Date().toISOString();
    
    const submission = submissions[submissionIndex];
    let notificationMessage = '';
    
    switch (newStatus) {
        case 'read':
            notificationMessage = `Your ${submission.type} has been reviewed by admin.`;
            break;
        case 'in-progress':
            notificationMessage = `Admin has started working on your ${submission.type}. `;
            break;
        case 'resolved':
            notificationMessage = `Your ${submission.type} has been resolved.  Please rate the admin's response.`;
            break;
    }
    
    if (notificationMessage) {
        const notification = {
            id: generateId(),
            userId: submission.userId,
            submissionId: submissionId,
            message: notificationMessage,
            type: newStatus,
            isUrgent: submission. isUrgent,
            createdAt: new Date().toISOString(),
            isRead: false
        };
        
        notifications.push(notification);
    }
    
    saveToLocalStorage();
    return true;
}

// UI Update Functions
function updateProfileDisplay() {
    if (currentUser) {
        const profileInitial = document.getElementById('profileInitial');
        const welcomeMessage = document. getElementById('welcomeMessage');
        const roleMessage = document.getElementById('roleMessage');
        
        if (profileInitial) profileInitial.textContent = currentUser.name.charAt(0).toUpperCase();
        if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${currentUser.name}`;
        if (roleMessage) roleMessage.textContent = `Your role: ${currentUser. role. charAt(0).toUpperCase() + currentUser.role.slice(1)}`;
        
        const studentDashboard = document.getElementById('studentDashboard');
        const adminDashboard = document.getElementById('adminDashboard');
        
        if (currentUser.role === 'student') {
            if (studentDashboard) studentDashboard.style.display = 'block';
            if (adminDashboard) adminDashboard.style. display = 'none';
        } else {
            if (studentDashboard) studentDashboard.style.display = 'none';
            if (adminDashboard) adminDashboard.style.display = 'block';
            loadAdminSubmissions();
        }
    }
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    if (! currentUser || !historyList) return;
    
    const historyFilter = document.getElementById('historyFilter');
    const filter = historyFilter ?  historyFilter.value : 'all';
    const userSubmissions = getUserSubmissions(currentUser.id, filter);
    
    historyList.innerHTML = '';
    
    if (userSubmissions.length === 0) {
        historyList.innerHTML = '<div class="no-data"><p>📋 No submissions found. </p></div>';
        return;
    }
    
    userSubmissions.forEach(submission => {
        const historyItem = document. createElement('div');
        historyItem. className = 'history-item';
        
        const statusClass = `status-${submission. status.replace('-', '-')}`;
        const urgentBadge = submission.isUrgent ? '<span class="urgent-badge">⚡ Urgent</span>' :  '';
        const statusBadge = `<span class="status-badge ${statusClass}">${submission.status. replace('-', ' ').toUpperCase()}</span>`;
        
        const ratingSection = submission.rating ? 
            `<div class="rating-display">⭐ Your Rating: ${submission. rating}/10</div>` : '';
        
        historyItem.innerHTML = `
            <div class="history-header">
                <h4>📝 ${submission.type. charAt(0).toUpperCase() + submission.type.slice(1)} - ${submission.category. charAt(0).toUpperCase() + submission.category.slice(1)}</h4>
                <div class="badges">${urgentBadge} ${statusBadge}</div>
            </div>
            <div class="meta">📅 Submitted: ${new Date(submission.createdAt).toLocaleString()}</div>
            <div class="description">${submission.description}</div>
            ${submission.fileName ? `<div class="file-info">📎 ${submission.fileName}</div>` : ''}
            ${ratingSection}
        `;
        
        historyList.appendChild(historyItem);
    });
}

function updateNotificationsDisplay() {
    const notificationsList = document.getElementById('notificationsList');
    if (!currentUser || !notificationsList) return;
    
    const userNotifications = notifications
        .filter(notif => notif. userId === currentUser. id && ! notif.isRead)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    notificationsList.innerHTML = '';
    
    if (userNotifications. length === 0) return;
    
    userNotifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.isUrgent ? 'urgent' : ''}`;
        
        notificationItem.innerHTML = `
            <div class="notification-header">
                <h5>🔔 Notification</h5>
                <small>${new Date(notification.createdAt).toLocaleString()}</small>
            </div>
            <p>${notification.message}</p>
        `;
        
        if (notification.type === 'resolved') {
            notificationItem.style.cursor = 'pointer';
            notificationItem.addEventListener('click', () => {
                showRatingModal(notification.submissionId);
            });
        }
        
        notificationsList.appendChild(notificationItem);
    });
}

function loadAdminSubmissions() {
    const submissionsList = document. getElementById('submissionsList');
    if (!submissionsList) return;
    
    const adminFilter = document.getElementById('adminFilter');
    const filter = adminFilter ? adminFilter.value : 'all';
    const allSubmissions = getAllSubmissions(filter);
    
    submissionsList.innerHTML = '';
    
    if (allSubmissions. length === 0) {
        submissionsList.innerHTML = '<div class="no-data"><p>📋 No submissions found.</p></div>';
        return;
    }
    
    allSubmissions. forEach(submission => {
        const submissionItem = document.createElement('div');
        submissionItem.className = 'submission-item';
        
        const statusClass = `status-${submission.status.replace('-', '-')}`;
        const urgentBadge = submission.isUrgent ? '<span class="urgent-badge">⚡ Urgent</span>' :  '';
        const statusBadge = `<span class="status-badge ${statusClass}">${submission.status.replace('-', ' ').toUpperCase()}</span>`;
        
        submissionItem.innerHTML = `
            <div class="submission-header">
                <h4>📝 ${submission.type. charAt(0).toUpperCase() + submission.type.slice(1)} - ${submission.category.charAt(0).toUpperCase() + submission.category.slice(1)}</h4>
                <div class="badges">${urgentBadge} ${statusBadge}</div>
            </div>
            <div class="meta">👤 From: ${submission.userName} (${submission.userEmail}) | 📅 ${new Date(submission.createdAt).toLocaleString()}</div>
            <div class="description">${submission.description}</div>
            ${submission.fileName ?  `<div class="file-info">📎 ${submission. fileName}</div>` : ''}
            <div class="submission-actions">
                <button class="btn btn-sm btn-secondary" onclick="updateSubmissionStatusHandler('${submission.id}', 'read')" ${submission.status !== 'new' ? 'disabled' : ''}>
                    👁️ Mark as Read
                </button>
                <button class="btn btn-sm btn-warning" onclick="updateSubmissionStatusHandler('${submission.id}', 'in-progress')" ${submission.status === 'resolved' || submission.status === 'in-progress' ? 'disabled' : ''}>
                    🔄 Start Action
                </button>
                <button class="btn btn-sm btn-success" onclick="updateSubmissionStatusHandler('${submission.id}', 'resolved')" ${submission.status === 'resolved' ?  'disabled' :  ''}>
                    ✅ Resolved
                </button>
            </div>
        `;
        
        submissionsList.appendChild(submissionItem);
    });
}

// Modal Functions
function showRatingModal(submissionId) {
    const modal = document. getElementById('ratingModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.dataset.submissionId = submissionId;
        
        document.querySelectorAll('.star').forEach(star => {
            star. classList.remove('selected');
        });
        document.getElementById('selectedRating').textContent = '0';
    }
}

function hideRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.style.display = 'none';
        delete modal.dataset.submissionId;
    }
}

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style. display = 'flex';
    }
}

function hideLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal. style.display = 'none';
    }
}

function logoutUser() {
    currentUser = null;
    currentUserRole = null;
    
    document.querySelectorAll('form').forEach(form => form.reset());
    document.querySelectorAll('.error-message, .success-message').forEach(msg => {
        msg.classList.remove('show');
    });
    
    const profileSection = document.getElementById('profileSection');
    if (profileSection) profileSection.style. display = 'none';
    
    showPage(pages.login);
    hideLogoutModal();
}

// Event Handlers
function updateSubmissionStatusHandler(submissionId, newStatus) {
    updateSubmissionStatus(submissionId, newStatus);
    loadAdminSubmissions();
}

// Global Click Handler
document.addEventListener('click', function(e) {
    // Category buttons
    if (e.target.classList.contains('category-btn')) {
        e.preventDefault();
        currentCategory = e.target. getAttribute('data-category');
        
        if (currentCategory && currentSubmissionType) {
            showPage(pages.submissionForm);
            
            const formTitle = document.getElementById('submissionFormTitle');
            const descriptionLabel = document.getElementById('descriptionLabel');
            const urgentGroup = document.getElementById('urgentGroup');
            const fileUploadGroup = document.getElementById('fileUploadGroup');
            
            if (currentSubmissionType === 'complaint') {
                if (formTitle) formTitle.textContent = '📝 Submit Complaint';
                if (descriptionLabel) descriptionLabel.textContent = 'Describe your issue';
                if (urgentGroup) urgentGroup.style.display = 'block';
                if (fileUploadGroup) fileUploadGroup.style.display = 'block';
            } else {
                if (formTitle) formTitle.textContent = '💡 Submit Suggestion';
                if (descriptionLabel) descriptionLabel.textContent = 'Describe your suggestion';
                if (urgentGroup) urgentGroup.style.display = 'none';
                if (fileUploadGroup) fileUploadGroup.style. display = 'none';
            }
        }
    }
    
    // Profile button
    if (e.target.matches('#profileBtn') || e.target. closest('#profileBtn')) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.toggle('show');
    }
    
    // Profile dropdown links
    if (e.target.matches('#updateDetailsLink')) {
        e.preventDefault();
        document.getElementById('profileDropdown').classList.remove('show');
        showPage(pages.updateDetails);
        
        if (currentUser) {
            const updateName = document.getElementById('updateName');
            const updateEmail = document.getElementById('updateEmail');
            if (updateName) updateName.value = currentUser.name || '';
            if (updateEmail) updateEmail.value = currentUser.email || '';
            
            if (currentUser.role === 'student') {
                document.getElementById('updateErpGroup').style.display = 'block';
                document.getElementById('updateCourseGroup').style.display = 'block';
                document.getElementById('updateErp').value = currentUser.erp || '';
                document.getElementById('updateCourse').value = currentUser.course || '';
            }
        }
    }
    
    if (e.target. matches('#logoutLink')) {
        e.preventDefault();
        document.getElementById('profileDropdown').classList.remove('show');
        showLogoutModal();
    }
    
    // Modal buttons
    if (e.target.matches('#confirmLogout')) {
        logoutUser();
    }
    
    if (e.target.matches('#cancelLogout')) {
        hideLogoutModal();
    }
    
    if (e.target. matches('#submitRating')) {
        const modal = document.getElementById('ratingModal');
        const submissionId = modal. dataset.submissionId;
        const rating = parseInt(document.getElementById('selectedRating').textContent);
        
        if (rating > 0) {
            const submissionIndex = submissions.findIndex(sub => sub. id === submissionId);
            if (submissionIndex !== -1) {
                submissions[submissionIndex].rating = rating;
                adminPoints += rating;
                
                const notification = notifications.find(notif => 
                    notif.submissionId === submissionId && notif.type === 'resolved'
                );
                if (notification) notification.isRead = true;
                
                saveToLocalStorage();
                hideRatingModal();
                updateHistoryDisplay();
                updateNotificationsDisplay();
                alert(`Thank you for rating!  You gave ${rating}/10 stars.`);
            }
        } else {
            alert('Please select a rating.');
        }
    }
    
    if (e. target.matches('#cancelRating')) {
        hideRatingModal();
    }
    
    // Close dropdowns
    if (! e.target.closest('.profile-section')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList. remove('show');
    }
    
    if (e.target.matches('#logoutModal')) hideLogoutModal();
    if (e.target. matches('#ratingModal')) hideRatingModal();
});

// Rating stars
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('star')) {
        const rating = parseInt(e.target.dataset.rating);
        document.getElementById('selectedRating').textContent = rating;
        
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('selected');
            } else {
                star. classList.remove('selected');
            }
        });
    }
});

// DOMContentLoaded Event
document.addEventListener('DOMContentLoaded', function() {
    showPage(pages.login);
    
    // Login role select
    const roleSelect = document.getElementById('roleSelect');
    if (roleSelect) {
        roleSelect. addEventListener('change', function() {
            const adminCodeGroup = document.getElementById('adminCodeGroup');
            if (this. value === 'admin') {
                adminCodeGroup.style. display = 'block';
                document.getElementById('adminCode').required = true;
            } else {
                adminCodeGroup.style.display = 'none';
                document.getElementById('adminCode').required = false;
            }
            updateAdminPointsDisplay();
        });
    }
    
    // Signup role select
    const signupRoleSelect = document.getElementById('signupRole');
    if (signupRoleSelect) {
        signupRoleSelect. addEventListener('change', function() {
            const erpGroup = document. getElementById('erpGroup');
            const courseGroup = document. getElementById('courseGroup');
            const adminCodeGroup = document. getElementById('signupAdminCodeGroup');
            
            // Hide all first
            [erpGroup, courseGroup, adminCodeGroup].forEach(group => {
                if (group) {
                    group. style.display = 'none';
                    const input = group.querySelector('input');
                    if (input) input.required = false;
                }
            });
            
            // Show relevant fields
            if (this.value === 'student') {
                [erpGroup, courseGroup].forEach(group => {
                    if (group) {
                        group. style.display = 'block';
                        const input = group.querySelector('input');
                        if (input) input.required = true;
                    }
                });
            } else if (this.value === 'admin') {
                if (adminCodeGroup) {
                    adminCodeGroup.style. display = 'block';
                    const input = adminCodeGroup.querySelector('input');
                    if (input) input.required = true;
                }
            }
        });
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm. addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const role = document.getElementById('roleSelect').value;
            const adminCode = document. getElementById('adminCode').value;
            
            hideMessage('loginError');
            
            if (! validateEmail(email)) {
                showError('loginError', 'Please enter a valid email address.');
                return;
            }
            
            if (!email || !password || !role) {
                showError('loginError', 'Please fill in all required fields.');
                return;
            }
            
            const result = authenticateUser(email, password, role, adminCode);
            
            if (result. success) {
                currentUser = result.user;
                currentUserRole = role;
                updateProfileDisplay();
                showPage(pages.dashboard);
            } else {
                showError('loginError', result.message);
            }
        });
    }
    
    // Signup form
    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm. addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const erp = document.getElementById('signupErp') ? document.getElementById('signupErp').value. trim() : '';
            const course = document.getElementById('signupCourse') ? document.getElementById('signupCourse').value.trim() : '';
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const role = document.getElementById('signupRole').value;
            const adminCode = document. getElementById('signupAdminCode') ? document.getElementById('signupAdminCode').value : '';
            
            hideMessage('signupError');
            hideMessage('signupSuccess');
            
            if (!name || !email || ! password || !role) {
                showError('signupError', 'Please fill in all required fields.');
                return;
            }
            
            if (! validateEmail(email)) {
                showError('signupError', 'Please enter a valid email address.');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('signupError', 'Passwords do not match.');
                return;
            }
            
            if (password.length < 6) {
                showError('signupError', 'Password must be at least 6 characters long.');
                return;
            }
            
            if (role === 'student' && (! erp || !course)) {
                showError('signupError', 'ERP number and course are required for students.');
                return;
            }
            
            if (role === 'admin' && ! adminCode) {
                showError('signupError', 'Admin code is required for admin registration.');
                return;
            }
            
            const userData = {
                name, email, password, role,
                erp:  role === 'student' ? erp : null,
                course:  role === 'student' ? course : null,
                adminCode: role === 'admin' ? adminCode : null
            };
            
            const result = createUser(userData);
            
            if (result.success) {
                showSuccess('signupSuccess', '✅ Sign up successful! Account created.  Redirecting to login...');
                
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = '✅ Account Created';
                
                this.reset();
                
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign Up';
                    showPage(pages.login);
                    
                    setTimeout(() => {
                        const loginContainer = document.querySelector('.login-container');
                        if (loginContainer) {
                            const successDiv = document.createElement('div');
                            successDiv.className = 'success-message show';
                            successDiv.textContent = '✅ Account created successfully! Please login with your credentials.';
                            successDiv.style.marginBottom = '20px';
                            
                            loginContainer. insertBefore(successDiv, loginContainer.firstChild);
                            
                            setTimeout(() => {
                                if (successDiv.parentNode) successDiv.remove();
                            }, 4000);
                        }
                    }, 500);
                }, 3000);
            } else {
                showError('signupError', result.message);
            }
        });
    }
    
    // Navigation buttons
    document.getElementById('signUpBtn')?.addEventListener('click', () => showPage(pages.signup));
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', () => showPage(pages.forgotPassword));
    document.getElementById('backToLoginBtn')?.addEventListener('click', () => showPage(pages.login));
    document.getElementById('backToLoginFromResetBtn')?.addEventListener('click', () => showPage(pages. login));
    document.getElementById('backToDashboardBtn')?.addEventListener('click', () => showPage(pages.dashboard));
    document.getElementById('backToTypeSelectionBtn')?.addEventListener('click', () => showPage(pages. submissionType));
    document.getElementById('backToDashboardFromUpdateBtn')?.addEventListener('click', () => showPage(pages.dashboard));
    
    // Dashboard buttons
    document.getElementById('complaintBtn')?.addEventListener('click', () => {
        currentSubmissionType = 'complaint';
        showPage(pages.submissionType);
        updateHistoryDisplay();
        updateNotificationsDisplay();
    });
    
    document. getElementById('suggestionBtn')?.addEventListener('click', () => {
        currentSubmissionType = 'suggestion';
        showPage(pages.submissionType);
        updateHistoryDisplay();
        updateNotificationsDisplay();
    });
    
    // Submission form
    const submissionForm = document. getElementById('submissionForm');
    if (submissionForm) {
        submissionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const description = document.getElementById('submissionDescription').value.trim();
            const isUrgent = document.getElementById('urgentCheckbox').checked;
            const fileInput = document.getElementById('fileUpload');
            const fileName = fileInput.files. length > 0 ? fileInput.files[0].name :  null;
            
            if (!description) {
                alert('Please provide a description.');
                return;
            }
            
            const submissionData = {
                type: currentSubmissionType,
                category: currentCategory,
                description:  description,
                isUrgent: isUrgent,
                fileName: fileName
            };
            
            createSubmission(submissionData);
            
            this.reset();
            showPage(pages. submissionType);
            updateHistoryDisplay();
            
            alert(`✅ ${currentSubmissionType. charAt(0).toUpperCase() + currentSubmissionType.slice(1)} submitted successfully!`);
        });
    }
    
    // Filters
    document.getElementById('historyFilter')?.addEventListener('change', updateHistoryDisplay);
    document.getElementById('adminFilter')?.addEventListener('change', loadAdminSubmissions);
    
    // Forgot password form
    const forgotPasswordForm = document. getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            
            if (!validateEmail(email)) {
                showError('resetSuccess', 'Please enter a valid email address.');
                return;
            }
            
            showSuccess('resetSuccess', '📧 Password reset link sent to your email! ');
        });
    }
});