// Detective Novel Timetable - Enhanced JavaScript Implementation
class DetectiveTimetable {
    constructor() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.table = document.querySelector('.timetable');
        this.headerRow = this.table.querySelector('thead tr');
        this.tableBody = this.table.querySelector('tbody');
        this.insertTimeSelect = document.getElementById('insert-time-select');
        this.storageKey = 'detectiveTimetableData';
        
        this.init();
    }

    init() {
        this.loadData();
        this.updateTimeSelect();
        this.setupEventListeners();
        this.setupCharacterInputListeners();
        this.setupAutoSave();
        this.addInitialAnimations();
    }

    // Show loading overlay with animation
    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
        setTimeout(() => this.hideLoading(), 800);
    }

    // Hide loading overlay
    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    // Add initial fade-in animations
    addInitialAnimations() {
        const elements = document.querySelectorAll('.control-group, .timetable-container');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // Update the time select dropdown with existing times
    updateTimeSelect() {
        const times = [];
        const timeDisplays = this.tableBody.querySelectorAll('.time-display');
        
        timeDisplays.forEach(display => {
            times.push(display.textContent.trim());
        });

        // Clear existing options
        this.insertTimeSelect.innerHTML = '';
        
        // Always add "最後に追加" as first option
        const lastOption = document.createElement('option');
        lastOption.value = 'last';
        lastOption.textContent = '最後に追加';
        this.insertTimeSelect.appendChild(lastOption);
        
        // Add existing times as options
        times.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            this.insertTimeSelect.appendChild(option);
        });
    }

    // Setup all event listeners
    setupEventListeners() {
        // Character management buttons
        document.getElementById('addButton').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => this.addCharacter(), 300);
        });

        document.getElementById('removeButton').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => this.removeCharacters(), 300);
        });

        // Time management buttons
        document.getElementById('addTimeButton').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => this.addTimeRows(), 300);
        });

        document.getElementById('removeTimeButton').addEventListener('click', () => {
            this.showLoading();
            setTimeout(() => this.removeTimeRows(), 300);
        });

        // Add hover effects to buttons
        this.addButtonHoverEffects();
    }

    // Setup auto-save functionality
    setupAutoSave() {
        // Save data when content changes
        this.table.addEventListener('input', () => {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.saveData(), 1000);
        });

        // Save data when checkboxes change
        this.table.addEventListener('change', () => {
            this.saveData();
        });
    }

    // Save data to localStorage
    saveData() {
        try {
            const data = {
                characters: [],
                rows: [],
                timestamp: Date.now()
            };

            // Save character names
            const characterInputs = this.headerRow.querySelectorAll('.character-input');
            characterInputs.forEach(input => {
                data.characters.push(input.value);
            });

            // Save row data
            const tableRows = this.tableBody.querySelectorAll('.table-row');
            tableRows.forEach(row => {
                const timeDisplay = row.querySelector('.time-display');
                const activityCells = row.querySelectorAll('.activity-cell');
                
                const rowData = {
                    time: timeDisplay.textContent.trim(),
                    activities: []
                };

                activityCells.forEach(cell => {
                    rowData.activities.push(cell.textContent);
                });

                data.rows.push(rowData);
            });

            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('データの保存に失敗しました:', error);
        }
    }

    // Load data from localStorage
    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (!savedData) return;

            const data = JSON.parse(savedData);
            
            // Restore characters
            if (data.characters && data.characters.length > 0) {
                this.restoreCharacters(data.characters);
            }

            // Restore rows
            if (data.rows && data.rows.length > 0) {
                this.restoreRows(data.rows);
            }

        } catch (error) {
            console.warn('データの読み込みに失敗しました:', error);
        }
    }

    // Restore character columns
    restoreCharacters(characters) {
        // Clear existing character columns
        const existingHeaders = this.headerRow.querySelectorAll('.character-header');
        existingHeaders.forEach(header => header.remove());

        // Add character columns
        characters.forEach(characterName => {
            const newHeader = document.createElement('th');
            newHeader.className = 'character-header';
            newHeader.innerHTML = `
                <div class="character-cell">
                    <input type="text" value="${characterName}" class="character-input">
                    <input type="checkbox" class="delete-checkbox">
                </div>
            `;
            this.headerRow.appendChild(newHeader);

            // Setup listener for character input
            const input = newHeader.querySelector('.character-input');
            this.addCharacterInputListener(input);
        });
    }

    // Restore table rows
    restoreRows(rows) {
        // Clear existing rows
        this.tableBody.innerHTML = '';

        // Add restored rows
        rows.forEach(rowData => {
            const row = this.createTimeRowWithData(rowData.time, rowData.activities);
            this.tableBody.appendChild(row);
        });
    }

    // Create a time row with existing data
    createTimeRowWithData(time, activities) {
        const row = document.createElement('tr');
        row.className = 'table-row';

        // Time cell
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.innerHTML = `
            <div class="time-cell-content">
                <input type="checkbox" class="time-delete-checkbox">
                <span class="time-display">${time}</span>
            </div>
        `;
        row.appendChild(timeCell);

        // Activity cells with data
        activities.forEach(activity => {
            const activityCell = document.createElement('td');
            activityCell.className = 'activity-cell';
            activityCell.contentEditable = 'true';
            activityCell.setAttribute('data-placeholder', '活動を記入...');
            activityCell.textContent = activity;
            row.appendChild(activityCell);
            
            this.addCellFocusEffects(activityCell);
        });

        return row;
    }

    // Add hover effects to buttons
    addButtonHoverEffects() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    }

    // Setup character input listeners for existing inputs
    setupCharacterInputListeners() {
        const existingInputs = document.querySelectorAll('.character-input');
        existingInputs.forEach(input => {
            this.addCharacterInputListener(input);
        });
    }

    // Add event listener to character input for real-time updates
    addCharacterInputListener(input) {
        input.addEventListener('input', function() {
            // Visual feedback on input
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });

        input.addEventListener('focus', function() {
            this.parentElement.style.background = 'rgba(255, 215, 0, 0.1)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.background = 'transparent';
        });
    }

    // Add new character column
    addCharacter() {
        const characterCount = this.headerRow.children.length - 1; // Exclude time column
        
        // Create new header cell
        const newHeader = document.createElement('th');
        newHeader.className = 'character-header';
        newHeader.innerHTML = `
            <div class="character-cell">
                <input type="text" value="新しい登場人物" class="character-input">
                <input type="checkbox" class="delete-checkbox">
            </div>
        `;
        
        // Add with animation
        newHeader.style.opacity = '0';
        newHeader.style.transform = 'translateX(20px)';
        this.headerRow.appendChild(newHeader);
        
        // Animate in
        setTimeout(() => {
            newHeader.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            newHeader.style.opacity = '1';
            newHeader.style.transform = 'translateX(0)';
        }, 50);

        // Add corresponding cells to all body rows
        const bodyRows = this.tableBody.querySelectorAll('tr');
        bodyRows.forEach((row, index) => {
            const newCell = document.createElement('td');
            newCell.className = 'activity-cell';
            newCell.contentEditable = 'true';
            newCell.setAttribute('data-placeholder', '活動を記入...');
            
            // Add with staggered animation
            newCell.style.opacity = '0';
            newCell.style.transform = 'translateX(20px)';
            row.appendChild(newCell);
            
            setTimeout(() => {
                newCell.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                newCell.style.opacity = '1';
                newCell.style.transform = 'translateX(0)';
            }, 100 + (index * 50));

            // Add focus effects
            this.addCellFocusEffects(newCell);
        });

        // Setup listener for new character input
        const newInput = newHeader.querySelector('.character-input');
        this.addCharacterInputListener(newInput);
        
        // Focus on new input
        setTimeout(() => {
            newInput.focus();
            newInput.select();
        }, 400);

        // Save data and update time select
        this.saveData();
    }

    // Remove selected character columns
    removeCharacters() {
        const checkboxes = this.headerRow.querySelectorAll('.delete-checkbox');
        const columnsToDelete = [];
        const bodyRows = this.tableBody.querySelectorAll('tr');

        // Find columns marked for deletion
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                columnsToDelete.push(index + 1); // +1 to account for time column
            }
        });

        if (columnsToDelete.length === 0) {
            this.showNotification('削除する登場人物を選択してください', 'warning');
            return;
        }

        // Animate out columns before deletion
        columnsToDelete.forEach(colIndex => {
            const headerCell = this.headerRow.children[colIndex];
            if (headerCell) {
                headerCell.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                headerCell.style.opacity = '0';
                headerCell.style.transform = 'translateX(-20px)';
            }

            bodyRows.forEach(row => {
                const cell = row.children[colIndex];
                if (cell) {
                    cell.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    cell.style.opacity = '0';
                    cell.style.transform = 'translateX(-20px)';
                }
            });
        });

        // Remove columns after animation
        setTimeout(() => {
            columnsToDelete.reverse().forEach(colIndex => {
                if (this.headerRow.children[colIndex]) {
                    this.headerRow.removeChild(this.headerRow.children[colIndex]);
                }
                bodyRows.forEach(row => {
                    if (row.children[colIndex]) {
                        row.removeChild(row.children[colIndex]);
                    }
                });
            });
            
            this.showNotification('登場人物を削除しました', 'success');
            this.saveData();
        }, 300);
    }

    // Add new time rows with before/after insertion logic
    addTimeRows() {
        const timeInterval = parseInt(document.getElementById('time-interval').value);
        const selectedTime = this.insertTimeSelect.value;
        const insertPosition = document.querySelector('input[name="insertPosition"]:checked').value;
        const characterCount = this.headerRow.children.length - 1;

        console.log('Adding time rows:', { timeInterval, selectedTime, insertPosition, characterCount });

        // If "最後に追加" is selected, always add at the end
        if (selectedTime === 'last') {
            this.addRowsAtEnd(timeInterval, characterCount);
            return;
        }

        // Find the target row
        const rows = Array.from(this.tableBody.querySelectorAll('tr'));
        let targetRowIndex = -1;
        
        for (let i = 0; i < rows.length; i++) {
            const timeDisplay = rows[i].querySelector('.time-display');
            if (timeDisplay && timeDisplay.textContent.trim() === selectedTime) {
                targetRowIndex = i;
                break;
            }
        }

        if (targetRowIndex === -1) {
            this.showNotification('指定された時間が見つかりません', 'warning');
            return;
        }

        console.log('Target row index:', targetRowIndex);

        // Calculate insertion point and time range
        let insertBeforeRow = null;
        let startTime = null;
        let endTime = null;
        const numRowsToAdd = 2; // Add 2 rows

        if (insertPosition === 'before') {
            // Insert before selected time
            insertBeforeRow = rows[targetRowIndex];
            endTime = this.parseTime(selectedTime);
            
            // Calculate start time based on previous time or interval
            if (targetRowIndex > 0) {
                const prevTime = rows[targetRowIndex - 1].querySelector('.time-display').textContent.trim();
                startTime = this.parseTime(prevTime);
                startTime.setMinutes(startTime.getMinutes() + timeInterval);
            } else {
                startTime = new Date(endTime);
                startTime.setMinutes(startTime.getMinutes() - (timeInterval * numRowsToAdd));
            }
        } else {
            // Insert after selected time
            startTime = this.parseTime(selectedTime);
            startTime.setMinutes(startTime.getMinutes() + timeInterval);
            
            // Set insertion point
            if (targetRowIndex < rows.length - 1) {
                insertBeforeRow = rows[targetRowIndex + 1];
                // Calculate end time based on next time
                const nextTime = rows[targetRowIndex + 1].querySelector('.time-display').textContent.trim();
                endTime = this.parseTime(nextTime);
            } else {
                insertBeforeRow = null; // Insert at end
                endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + (timeInterval * numRowsToAdd));
            }
        }

        console.log('Insert position:', insertPosition, 'Start time:', this.formatTime(startTime), 'End time:', this.formatTime(endTime));

        // Generate and insert new rows
        const newRows = [];
        const currentTime = new Date(startTime);
        let rowsGenerated = 0;
        
        while (currentTime < endTime && rowsGenerated < numRowsToAdd) {
            const formattedTime = this.formatTime(currentTime);
            
            // Check if this time already exists
            const existingTime = rows.find(row => {
                const timeDisplay = row.querySelector('.time-display');
                return timeDisplay && timeDisplay.textContent.trim() === formattedTime;
            });
            
            if (!existingTime) {
                const newRow = this.createTimeRow(formattedTime, characterCount);
                newRows.push(newRow);
                console.log('Generated row for time:', formattedTime);
            }
            
            currentTime.setMinutes(currentTime.getMinutes() + timeInterval);
            rowsGenerated++;
        }

        // If no conflicts, insert the rows
        if (newRows.length > 0) {
            this.insertRowsWithAnimation(newRows, insertBeforeRow);
            this.showNotification(`${newRows.length}行の時間を追加しました`, 'success');
            this.updateTimeSelect();
            this.saveData();
        } else {
            this.showNotification('追加できる時間がありません（重複または範囲外）', 'warning');
        }
    }

    // Add rows at the end of the table
    addRowsAtEnd(timeInterval, characterCount) {
        const rows = this.tableBody.querySelectorAll('tr');
        let lastTime;
        
        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const lastTimeDisplay = lastRow.querySelector('.time-display');
            lastTime = this.parseTime(lastTimeDisplay.textContent.trim());
        } else {
            lastTime = this.parseTime('08:00');
        }

        console.log('Adding rows at end, starting from:', this.formatTime(lastTime));

        // Generate 3 new rows after the last time
        const newRows = [];
        for (let i = 0; i < 3; i++) {
            lastTime.setMinutes(lastTime.getMinutes() + timeInterval);
            const formattedTime = this.formatTime(lastTime);
            const newRow = this.createTimeRow(formattedTime, characterCount);
            newRows.push(newRow);
            console.log('Generated end row for time:', formattedTime);
        }

        this.insertRowsWithAnimation(newRows, null);
        
        this.showNotification(`${newRows.length}行の時間を追加しました`, 'success');
        this.updateTimeSelect();
        this.saveData();
    }

    // Insert rows with animation
    insertRowsWithAnimation(newRows, insertBeforeRow) {
        console.log('Inserting', newRows.length, 'rows', insertBeforeRow ? 'before existing row' : 'at end');
        
        newRows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            if (insertBeforeRow && insertBeforeRow.parentNode === this.tableBody) {
                this.tableBody.insertBefore(row, insertBeforeRow);
            } else {
                this.tableBody.appendChild(row);
            }

            // Animate in with stagger
            setTimeout(() => {
                row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
                row.classList.add('fade-in');
            }, index * 100);
        });
    }

    // Parse time string to Date object
    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    // Format Date object to time string
    formatTime(date) {
        return date.toTimeString().slice(0, 5);
    }

    // Create a new time row
    createTimeRow(time, characterCount) {
        const row = document.createElement('tr');
        row.className = 'table-row';

        // Time cell
        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.innerHTML = `
            <div class="time-cell-content">
                <input type="checkbox" class="time-delete-checkbox">
                <span class="time-display">${time}</span>
            </div>
        `;
        row.appendChild(timeCell);

        // Activity cells
        for (let i = 0; i < characterCount; i++) {
            const activityCell = document.createElement('td');
            activityCell.className = 'activity-cell';
            activityCell.contentEditable = 'true';
            activityCell.setAttribute('data-placeholder', '活動を記入...');
            row.appendChild(activityCell);
            
            this.addCellFocusEffects(activityCell);
        }

        return row;
    }

    // Add focus effects to activity cells
    addCellFocusEffects(cell) {
        cell.addEventListener('focus', () => {
            cell.style.background = 'rgba(255, 215, 0, 0.1)';
            cell.style.transform = 'scale(1.02)';
        });

        cell.addEventListener('blur', () => {
            cell.style.background = '';
            cell.style.transform = 'scale(1)';
        });

        cell.addEventListener('input', () => {
            // Visual feedback on content change
            cell.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            setTimeout(() => {
                cell.style.borderColor = '';
            }, 1000);
        });
    }

    // Remove selected time rows
    removeTimeRows() {
        const checkboxes = this.tableBody.querySelectorAll('.time-delete-checkbox');
        const rowsToDelete = [];

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                rowsToDelete.push(checkbox.closest('tr'));
            }
        });

        if (rowsToDelete.length === 0) {
            this.showNotification('削除する時間行を選択してください', 'warning');
            return;
        }

        // Animate out rows
        rowsToDelete.forEach((row, index) => {
            setTimeout(() => {
                row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                row.style.opacity = '0';
                row.style.transform = 'translateX(-100%)';
            }, index * 50);
        });

        // Remove rows after animation
        setTimeout(() => {
            rowsToDelete.forEach(row => {
                row.remove();
            });
            this.showNotification(`${rowsToDelete.length}行を削除しました`, 'success');
            this.updateTimeSelect();
            this.saveData();
        }, 300 + (rowsToDelete.length * 50));
    }

    // Show notification message
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '500',
            fontSize: '14px',
            zIndex: '1001',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)'
        });

        // Set background based on type
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            danger: 'linear-gradient(135deg, #ef4444, #dc2626)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        
        notification.style.background = colors[type] || colors.info;

        // Add to document
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 50);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Enhanced interaction effects
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the timetable
    const timetable = new DetectiveTimetable();

    // Add enhanced interactions to existing elements
    const activityCells = document.querySelectorAll('.activity-cell');
    activityCells.forEach(cell => {
        timetable.addCellFocusEffects(cell);
    });

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .btn {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);

    // Enhanced table interactions
    const tableRows = document.querySelectorAll('.table-row');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.transform = 'translateX(5px)';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.transform = 'translateX(0)';
        });
    });

    // Smooth scroll for mobile
    if (window.innerWidth <= 768) {
        const tableWrapper = document.querySelector('.table-wrapper');
        if (tableWrapper) {
            tableWrapper.style.scrollBehavior = 'smooth';
        }
    }

    console.log('🕵️ Detective Novel Timetable initialized successfully!');
});