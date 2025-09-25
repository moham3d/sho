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
});