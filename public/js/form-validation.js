// Form validation and enhancement for tablet compatibility

document.addEventListener('DOMContentLoaded', function() {
    // Add touch-friendly enhancements
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        // Add visual feedback for touch interactions
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });

        // Form submission with loading state
        form.addEventListener('submit', function(e) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';

                // Re-enable after 3 seconds (in case of error)
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = submitBtn.innerHTML.replace('<i class="fas fa-spinner fa-spin me-2"></i>Submitting...', '<i class="fas fa-save me-2"></i>Submit Assessment');
                }, 3000);
            }
        });
    });

    // Range input value display
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        const output = input.nextElementSibling;
        if (output && output.tagName === 'OUTPUT') {
            input.addEventListener('input', function() {
                output.value = this.value;
            });
        }
    });

    // Checkbox group handling
    const allergyCheckboxes = document.querySelectorAll('input[name="has_allergies"]');
    allergyCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const allergyInputs = document.querySelectorAll('input[name*="allergies"]');
            allergyInputs.forEach(input => {
                if (input.type !== 'checkbox') {
                    input.disabled = !this.checked;
                }
            });
        });
    });

    // Responsive table adjustments for tablets
    function adjustForTablet() {
        const isTablet = window.innerWidth <= 768 && window.innerWidth > 576;
        document.body.classList.toggle('tablet-view', isTablet);
    }

    window.addEventListener('resize', adjustForTablet);
    adjustForTablet();

    // Add swipe gestures for form navigation (basic implementation)
    let startX, startY;
    document.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', function(e) {
        if (!startX || !startY) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = startX - endX;
        const diffY = startY - endY;

        // Horizontal swipe detection
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swipe left - could navigate to next section
                console.log('Swipe left detected');
            } else {
                // Swipe right - could navigate to previous section
                console.log('Swipe right detected');
            }
        }
    });

    // Form progress tracking
    function updateFormProgress() {
        const nurseForm = document.getElementById('nurseForm');
        const radiologyForm = document.getElementById('radiologyForm');

        [nurseForm, radiologyForm].forEach(form => {
            if (!form) return;

            const progressBar = form.querySelector('#formProgress');
            const progressText = progressBar ? progressBar.querySelector('.progress-text') : null;

            if (!progressBar || !progressText) return;

            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            let filledCount = 0;
            let totalCount = inputs.length;

            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    if (input.checked) filledCount++;
                } else if (input.value.trim() !== '') {
                    filledCount++;
                }
            });

            const percentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
            progressBar.style.width = percentage + '%';
            progressText.textContent = percentage + '% Complete';

            // Update progress bar color based on completion
            progressBar.className = 'progress-bar';
            if (percentage < 25) {
                progressBar.classList.add('bg-danger');
            } else if (percentage < 50) {
                progressBar.classList.add('bg-warning');
            } else if (percentage < 75) {
                progressBar.classList.add('bg-info');
            } else {
                progressBar.classList.add('bg-success');
            }
        });
    }

    // Initialize progress tracking for forms with progress bars
    const progressForms = [document.getElementById('nurseForm'), document.getElementById('radiologyForm')];
    progressForms.forEach(form => {
        if (form) {
            // Update progress on input changes
            form.addEventListener('input', updateFormProgress);
            form.addEventListener('change', updateFormProgress);

            // Initial progress calculation
            updateFormProgress();
        }
    });

    // Auto-save functionality
    let autoSaveTimer;
    const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

    function autoSaveForm(form) {
        if (!form) return;

        const formId = form.id;
        const formData = new FormData(form);
        const data = {};

        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        // Add timestamp
        data._autoSaveTimestamp = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem(`form_${formId}_autosave`, JSON.stringify(data));

        // Show save indicator
        showAutoSaveIndicator(form);
    }

    function showAutoSaveIndicator(form) {
        // Remove existing indicator
        const existingIndicator = form.querySelector('.auto-save-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator alert alert-success position-fixed';
        indicator.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 300px;';
        indicator.innerHTML = '<i class="fas fa-save me-2"></i>Data auto-saved successfully';
        document.body.appendChild(indicator);

        // Remove after 3 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 3000);
    }

    function loadAutoSavedData(form) {
        if (!form) return;

        const formId = form.id;
        const savedData = localStorage.getItem(`form_${formId}_autosave`);

        if (!savedData) return;

        try {
            const data = JSON.parse(savedData);
            const timestamp = new Date(data._autoSaveTimestamp);

            // Check if data is less than 24 hours old
            const now = new Date();
            const hoursDiff = (now - timestamp) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                localStorage.removeItem(`form_${formId}_autosave`);
                return;
            }

            // Show recovery prompt
            if (confirm(`Found auto-saved data from ${timestamp.toLocaleString()}. Would you like to restore it?`)) {
                // Populate form with saved data
                Object.keys(data).forEach(key => {
                    if (key === '_autoSaveTimestamp') return;

                    const inputs = form.querySelectorAll(`[name="${key}"]`);
                    inputs.forEach(input => {
                        if (input.type === 'checkbox') {
                            if (Array.isArray(data[key])) {
                                input.checked = data[key].includes(input.value);
                            } else {
                                input.checked = data[key] === input.value;
                            }
                        } else if (input.type === 'radio') {
                            input.checked = data[key] === input.value;
                        } else {
                            input.value = data[key];
                        }
                    });
                });

                // Update progress after loading
                updateFormProgress();
            } else {
                // Clear auto-saved data if user declines
                localStorage.removeItem(`form_${formId}_autosave`);
            }
        } catch (e) {
            console.error('Error loading auto-saved data:', e);
            localStorage.removeItem(`form_${formId}_autosave`);
        }
    }

    function startAutoSave(form) {
        if (!form) return;

        // Load any existing auto-saved data
        loadAutoSavedData(form);

        // Clear existing timer
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }

        // Start auto-save timer
        autoSaveTimer = setInterval(() => {
            autoSaveForm(form);
        }, AUTO_SAVE_INTERVAL);

        // Also save on form changes (debounced)
        let saveTimeout;
        form.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                autoSaveForm(form);
            }, 2000); // Save 2 seconds after user stops typing
        });
    }

    // Initialize auto-save for supported forms
    const autoSaveForms = [document.getElementById('nurseForm'), document.getElementById('radiologyForm')];
    autoSaveForms.forEach(form => {
        if (form) {
            startAutoSave(form);
        }
    });

    // Unsaved changes warning
    let hasUnsavedChanges = false;

    function markFormChanged() {
        hasUnsavedChanges = true;
    }

    function clearUnsavedChangesFlag() {
        hasUnsavedChanges = false;
    }

    // Track changes on forms
    const trackableForms = [document.getElementById('nurseForm'), document.getElementById('radiologyForm'), document.getElementById('addPatientForm')];
    trackableForms.forEach(form => {
        if (form) {
            form.addEventListener('input', markFormChanged);
            form.addEventListener('change', markFormChanged);

            // Clear flag on successful submission
            form.addEventListener('submit', clearUnsavedChangesFlag);
        }
    });

    // Warn before navigating away with unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
});