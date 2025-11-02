// StudyPlanner Pro - Enhanced Version
class StudyPlanner {
    constructor() {
        this.subjects = [];
        this.currentPlan = [];
        this.user = null;
        
        this.initializeApp();
    }

    initializeApp() {
        // Initialize Firebase services
        this.auth = window.auth;
        this.db = window.db;
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load saved data
        this.loadSavedData();
        
        // Initialize confetti
        this.initializeConfetti();
        
        // Hide loading screen after 2 seconds
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 2000);

        console.log('StudyPlanner Pro initialized successfully!');
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.closest('.nav-btn').dataset.target);
            });
        });

        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Auth
        document.getElementById('btn-google').addEventListener('click', () => {
            this.signInWithGoogle();
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            this.signOut();
        });

        // Subject form
        document.getElementById('subject-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSubject();
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectDifficulty(e.target.closest('.difficulty-btn'));
            });
        });

        // Actions
        document.getElementById('generate-plan').addEventListener('click', () => {
            this.generateStudyPlan();
        });

        document.getElementById('export-pdf').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('save-cloud').addEventListener('click', () => {
            this.saveToCloud();
        });

        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAllData();
        });

        // Firebase auth state listener
        this.auth.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });
    }

    initializeConfetti() {
        this.confettiCanvas = document.getElementById('confetti-canvas');
        this.confettiCtx = this.confettiCanvas.getContext('2d');
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.confettiCanvas.width = window.innerWidth;
            this.confettiCanvas.height = window.innerHeight;
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    switchSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Update profile stats if switching to profile
        if (sectionId === 'profile') {
            this.updateProfileStats();
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        const icon = document.querySelector('.theme-toggle i');
        icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        
        // Save theme preference
        localStorage.setItem('studyplanner-theme', newTheme);
    }

    selectDifficulty(button) {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        const level = button.dataset.level;
        document.getElementById('subject-difficulty').value = level;
    }

    addSubject() {
        const name = document.getElementById('subject-name').value.trim();
        const date = document.getElementById('subject-date').value;
        const difficulty = parseInt(document.getElementById('subject-difficulty').value);
        const note = document.getElementById('subject-note').value.trim();

        if (!name || !date) {
            this.showNotification('Vui lòng điền đầy đủ tên môn và ngày thi!', 'error');
            return;
        }

        // Check if date is in the past
        const examDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (examDate < today) {
            this.showNotification('Ngày thi không được ở trong quá khứ!', 'error');
            return;
        }

        const subject = {
            id: Date.now() + Math.random(),
            name,
            date,
            difficulty,
            note,
            createdAt: new Date().toISOString()
        };

        this.subjects.push(subject);
        this.saveSubjects();
        this.renderSubjects();
        this.updateStats();
        
        // Reset form
        document.getElementById('subject-form').reset();
        document.querySelector('.difficulty-btn[data-level="2"]').click();
        
        this.showNotification(`Đã thêm môn "${name}" thành công!`, 'success');
        this.animateAddSubject(subject);
    }

    animateAddSubject(subject) {
        const subjectItem = document.querySelector(`[data-id="${subject.id}"]`);
        if (subjectItem) {
            subjectItem.style.animation = 'slideInLeft 0.5s ease';
        }
    }

    editSubject(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        // Fill form with subject data
        document.getElementById('subject-name').value = subject.name;
        document.getElementById('subject-date').value = subject.date;
        document.getElementById('subject-difficulty').value = subject.difficulty;
        document.getElementById('subject-note').value = subject.note || '';
        
        // Update difficulty button
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.difficulty-btn[data-level="${subject.difficulty}"]`).classList.add('active');

        // Remove subject
        this.subjects = this.subjects.filter(s => s.id !== subjectId);
        this.saveSubjects();
        this.renderSubjects();
        this.updateStats();

        this.showNotification(`Đang chỉnh sửa môn "${subject.name}"`, 'info');
    }

    deleteSubject(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        if (confirm(`Bạn có chắc muốn xóa môn "${subject.name}"?`)) {
            this.subjects = this.subjects.filter(s => s.id !== subjectId);
            this.saveSubjects();
            this.renderSubjects();
            this.updateStats();
            
            this.showNotification(`Đã xóa môn "${subject.name}"`, 'success');
        }
    }

    renderSubjects() {
        const container = document.getElementById('subjects-list');
        const countElement = document.getElementById('subjects-count');

        if (this.subjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>Chưa có môn học nào</p>
                    <small>Thêm môn học để bắt đầu lên kế hoạch</small>
                </div>
            `;
            countElement.textContent = '0';
            return;
        }

        // Sort by exam date
        this.subjects.sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = this.subjects.map(subject => `
            <div class="subject-item" data-id="${subject.id}">
                <div class="subject-info">
                    <h4>${subject.name}</h4>
                    <div class="subject-meta">
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(subject.date)}</span>
                        <span class="difficulty-badge difficulty-${subject.difficulty}">
                            ${this.getDifficultyText(subject.difficulty)}
                        </span>
                        ${subject.note ? `<span><i class="fas fa-sticky-note"></i> ${subject.note}</span>` : ''}
                    </div>
                </div>
                <div class="subject-actions">
                    <button class="btn-edit" onclick="studyPlanner.editSubject(${subject.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="studyPlanner.deleteSubject(${subject.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        countElement.textContent = this.subjects.length;
    }

generateStudyPlan() {
    if (this.subjects.length === 0) {
        this.showNotification('Vui lòng thêm ít nhất một môn học!', 'error');
        return;
    }

    console.log('Bắt đầu tạo kế hoạch với', this.subjects.length, 'môn học');
    
    this.currentPlan = this.createStudyPlan(this.subjects);
    console.log('Kế hoạch đã tạo:', this.currentPlan);
    
    this.renderStudyPlan();
    this.updateStats();
    
    if (this.currentPlan.length > 0) {
        this.showNotification('Đã tạo kế hoạch ôn tập thành công!', 'success');
        this.showConfetti();
    } else {
        this.showNotification('Không thể tạo kế hoạch. Kiểm tra ngày thi!', 'error');
    }
}

createStudyPlan(subjects) {
    console.log('Tạo kế hoạch từ subjects:', subjects);
    
    const plan = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Ngày bắt đầu:', today);

    // Kiểm tra và sắp xếp môn học theo ngày thi
    const validSubjects = subjects.filter(subject => {
        const examDate = new Date(subject.date);
        return examDate >= today;
    });

    if (validSubjects.length === 0) {
        console.log('Không có môn học nào có ngày thi hợp lệ');
        return [];
    }

    // Tính số ngày học cần thiết cho mỗi môn
    const subjectRequirements = validSubjects.map(subject => {
        const daysNeeded = subject.difficulty * 2; // Dễ: 2 ngày, TB: 4 ngày, Khó: 6 ngày
        return {
            ...subject,
            daysNeeded,
            daysAssigned: 0,
            dueDate: new Date(subject.date)
        };
    });

    // Tìm ngày thi xa nhất
    const latestDate = new Date(Math.max(...validSubjects.map(s => new Date(s.date).getTime())));
    console.log('Ngày thi cuối cùng:', latestDate);

    // Tạo danh sách ngày học (chỉ thứ 2-6)
    const studyDays = [];
    const currentDate = new Date(today);
    
    while (currentDate <= latestDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Không thứ 7, CN
            studyDays.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Tổng số ngày học:', studyDays.length);

    if (studyDays.length === 0) {
        console.log('Không có ngày học nào trong khoảng thời gian này');
        return [];
    }

    // Phân bổ môn học vào các ngày
    let dayIndex = 0;
    let totalAssignments = subjectRequirements.reduce((sum, subj) => sum + subj.daysNeeded, 0);
    
    console.log('Tổng số buổi học cần phân bổ:', totalAssignments);

    // Thuật toán phân bổ đơn giản
    while (dayIndex < Math.min(studyDays.length, totalAssignments)) {
        const currentDay = studyDays[dayIndex];
        
        // Tìm môn học cần được học vào ngày này
        for (const subjectReq of subjectRequirements) {
            if (subjectReq.daysAssigned < subjectReq.daysNeeded && 
                currentDay < subjectReq.dueDate) {
                
                plan.push({
                    date: new Date(currentDay),
                    subject: subjectReq.name,
                    difficulty: subjectReq.difficulty,
                    note: subjectReq.note || `Buổi ${subjectReq.daysAssigned + 1}`
                });
                
                subjectReq.daysAssigned++;
                break;
            }
        }
        
        dayIndex++;
    }

    console.log('Kế hoạch chi tiết sau khi phân bổ:', plan);

    // Nhóm theo ngày
    const groupedPlan = [];
    const planByDate = {};

    plan.forEach(item => {
        const dateKey = item.date.toDateString();
        if (!planByDate[dateKey]) {
            planByDate[dateKey] = {
                date: new Date(item.date),
                subjects: []
            };
        }
        planByDate[dateKey].subjects.push(item);
    });

    // Chuyển thành mảng và sắp xếp
    for (const dateKey in planByDate) {
        groupedPlan.push(planByDate[dateKey]);
    }

    groupedPlan.sort((a, b) => a.date - b.date);

    console.log('Kế hoạch đã nhóm:', groupedPlan);
    return groupedPlan;
}

renderStudyPlan() {
    const container = document.getElementById('plan-list');
    const emptyPlan = document.getElementById('empty-plan');

    console.log('Render study plan:', this.currentPlan);

    if (!this.currentPlan || this.currentPlan.length === 0) {
        container.style.display = 'none';
        emptyPlan.style.display = 'block';
        return;
    }

    emptyPlan.style.display = 'none';
    container.style.display = 'block';

    container.innerHTML = this.currentPlan.map(dayPlan => `
        <div class="plan-day">
            <div class="plan-date">
                <i class="fas fa-calendar-day"></i>
                ${this.formatDate(dayPlan.date)} - ${this.getDayName(dayPlan.date)}
            </div>
            <div class="plan-subjects">
                ${dayPlan.subjects.map(subject => `
                    <div class="plan-subject difficulty-${subject.difficulty}">
                        <div class="subject-icon">
                            ${subject.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="plan-subject-info">
                            <div class="plan-subject-name">${subject.name}</div>
                            ${subject.note ? `<div class="plan-subject-note">${subject.note}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Thêm hàm lấy tên thứ trong tuần
getDayName(date) {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[new Date(date).getDay()];
}
    exportToPDF() {
    if (this.currentPlan.length === 0) {
        this.showNotification('Vui lòng tạo kế hoạch trước khi xuất PDF!', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Thêm font hỗ trợ tiếng Việt
    doc.setLanguage('vi-VN');
    
    // Header với màu đẹp
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDYPLANNER PRO - KẾ HOẠCH ÔN TẬP', 105, 15, { align: 'center' });
    
    // Thông tin học sinh
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Học sinh: ${this.user ? this.user.displayName : 'Khách'}`, 20, 45);
    doc.text(`Ngày xuất: ${this.formatDate(new Date())}`, 20, 55);
    
    // Tiêu đề kế hoạch
    let yPosition = 75;
    doc.setFontSize(16);
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.text('KẾ HOẠCH ÔN TẬP CHI TIẾT', 20, yPosition);
    
    // Nội dung kế hoạch
    yPosition += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    this.currentPlan.forEach(dayPlan => {
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Ngày học
        doc.setFont('helvetica', 'bold');
        doc.text(`${this.formatDate(dayPlan.date)}:`, 20, yPosition);
        yPosition += 7;
        
        // Các môn học trong ngày
        dayPlan.subjects.forEach(subject => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFont('helvetica', 'normal');
            const subjectText = `• ${subject.name} ${subject.note ? `- ${subject.note}` : ''}`;
            
            // Xử lý text dài
            const lines = doc.splitTextToSize(subjectText, 170);
            lines.forEach(line => {
                doc.text(line, 25, yPosition);
                yPosition += 5;
            });
        });
        
        yPosition += 5;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated by StudyPlanner Pro - studyplanner-firebase.web.app', 105, 290, { align: 'center' });
    
    // Lưu file
    const fileName = `studyplanner-plan-${this.formatDate(new Date(), 'file')}.pdf`;
    doc.save(fileName);
    this.showNotification('Đã xuất PDF thành công!', 'success');
}

    async saveToCloud() {
        if (!this.user) {
            this.showNotification('Vui lòng đăng nhập để lưu lên cloud!', 'error');
            return;
        }

        if (this.subjects.length === 0) {
            this.showNotification('Vui lòng thêm môn học trước khi lưu!', 'error');
            return;
        }

        try {
            const userData = {
                uid: this.user.uid,
                subjects: this.subjects,
                plan: this.currentPlan,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                stats: this.calculateStats()
            };

            await this.db.collection('userData').doc(this.user.uid).set(userData);
            this.showNotification('Đã lưu dữ liệu lên cloud thành công!', 'success');
        } catch (error) {
            console.error('Lỗi khi lưu lên cloud:', error);
            this.showNotification('Lỗi khi lưu lên cloud!', 'error');
        }
    }

    async loadFromCloud() {
        if (!this.user) return;

        try {
            const doc = await this.db.collection('userData').doc(this.user.uid).get();
            
            if (doc.exists) {
                const userData = doc.data();
                this.subjects = userData.subjects || [];
                this.currentPlan = userData.plan || [];
                
                this.saveSubjects();
                this.renderSubjects();
                this.renderStudyPlan();
                this.updateStats();
                
                this.showNotification('Đã tải dữ liệu từ cloud!', 'success');
            }
        } catch (error) {
            console.error('Lỗi khi tải từ cloud:', error);
        }
    }

    clearAllData() {
        if (this.subjects.length === 0) return;

        if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu? Hành động này không thể hoàn tác.')) {
            this.subjects = [];
            this.currentPlan = [];
            
            this.saveSubjects();
            this.renderSubjects();
            this.renderStudyPlan();
            this.updateStats();
            
            this.showNotification('Đã xóa tất cả dữ liệu!', 'success');
        }
    }

    // Auth Methods
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await this.auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            this.showNotification('Lỗi đăng nhập!', 'error');
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            this.showNotification('Đã đăng xuất!', 'success');
        } catch (error) {
            console.error('Lỗi đăng xuất:', error);
        }
    }

    handleAuthStateChange(user) {
        const authSection = document.getElementById('auth-section');
        const btnGoogle = document.getElementById('btn-google');
        const userInfo = document.getElementById('user-info');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');

        if (user) {
            this.user = user;
            btnGoogle.classList.add('hidden');
            userInfo.classList.remove('hidden');
            
            userAvatar.src = user.photoURL || '';
            userName.textContent = user.displayName || 'Người dùng';
            
            // Load data from cloud
            this.loadFromCloud();
        } else {
            this.user = null;
            btnGoogle.classList.remove('hidden');
            userInfo.classList.add('hidden');
        }
    }

    // Data Management
    saveSubjects() {
        localStorage.setItem('studyplanner-subjects', JSON.stringify(this.subjects));
        localStorage.setItem('studyplanner-plan', JSON.stringify(this.currentPlan));
    }

    loadSavedData() {
        // Load theme
        const savedTheme = localStorage.getItem('studyplanner-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            const icon = document.querySelector('.theme-toggle i');
            icon.className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }

        // Load subjects and plan
        try {
            const savedSubjects = localStorage.getItem('studyplanner-subjects');
            const savedPlan = localStorage.getItem('studyplanner-plan');
            
            if (savedSubjects) {
                this.subjects = JSON.parse(savedSubjects);
            }
            
            if (savedPlan) {
                this.currentPlan = JSON.parse(savedPlan);
            }
            
            this.renderSubjects();
            this.renderStudyPlan();
            this.updateStats();
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
        }
    }

    // Stats and Updates
    updateStats() {
        const totalSubjects = this.subjects.length;
        const totalDays = this.currentPlan.length;
        const completionRate = totalSubjects > 0 ? Math.round((this.currentPlan.length / (totalSubjects * 3)) * 100) : 0;

        document.getElementById('total-subjects').textContent = totalSubjects;
        document.getElementById('total-days').textContent = totalDays;
        document.getElementById('completion-rate').textContent = `${Math.min(completionRate, 100)}%`;
    }

    updateProfileStats() {
        const totalSubjects = this.subjects.length;
        const completed = this.subjects.filter(s => new Date(s.date) < new Date()).length;
        const pending = totalSubjects - completed;

        document.getElementById('profile-total-subjects').textContent = totalSubjects;
        document.getElementById('profile-completed').textContent = completed;
        document.getElementById('profile-pending').textContent = pending;
    }

    calculateStats() {
        return {
            totalSubjects: this.subjects.length,
            totalStudyDays: this.currentPlan.length,
            completedExams: this.subjects.filter(s => new Date(s.date) < new Date()).length,
            upcomingExams: this.subjects.filter(s => new Date(s.date) >= new Date()).length
        };
    }

    // Utility Methods
    formatDate(date, format = 'display') {
        const d = new Date(date);
        if (format === 'file') {
            return d.toISOString().split('T')[0];
        }
        return d.toLocaleDateString('vi-VN');
    }

    getDifficultyText(level) {
        const levels = {
            1: 'Dễ',
            2: 'Trung bình', 
            3: 'Khó'
        };
        return levels[level] || 'Không xác định';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#6366f1'
        };
        return colors[type] || '#6366f1';
    }

    showConfetti() {
        const confettiCount = 200;
        const colors = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                this.createConfettiPiece(colors);
            }, i * 10);
        }
    }

    createConfettiPiece(colors) {
        const piece = {
            x: Math.random() * this.confettiCanvas.width,
            y: -10,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 3 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        };

        const animate = () => {
            piece.y += piece.speed;
            piece.rotation += piece.rotationSpeed;
            
            this.confettiCtx.save();
            this.confettiCtx.translate(piece.x, piece.y);
            this.confettiCtx.rotate(piece.rotation * Math.PI / 180);
            this.confettiCtx.fillStyle = piece.color;
            this.confettiCtx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
            this.confettiCtx.restore();
            
            if (piece.y < this.confettiCanvas.height) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
}

// Initialize the application
const studyPlanner = new StudyPlanner();

// Make studyPlanner globally available for HTML onclick handlers
window.studyPlanner = studyPlanner;