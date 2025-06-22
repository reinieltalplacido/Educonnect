document.getElementById('export-grades').addEventListener('click', function () {
    const confirmExport = confirm("Are you sure you want to export your grades?");

    if (!confirmExport) return; // Stop if user clicks "Cancel"

    const chartBars = document.querySelectorAll('.chart-bar');

    chartBars.forEach(bar => {
        const heightPercent = parseInt(bar.style.height);
        const pixelHeight = (heightPercent / 100) * 200; // Convert % to px
        bar.setAttribute('data-original-height', bar.style.height);
        bar.style.height = pixelHeight + 'px';
        bar.classList.add('print-visible');
    });

    // Trigger print
    window.print();

    // After print, restore original states
    window.addEventListener('afterprint', function () {
        chartBars.forEach(bar => {
            const originalHeight = bar.getAttribute('data-original-height');
            if (originalHeight) {
                bar.style.height = originalHeight;
                bar.removeAttribute('data-original-height');
            }
            bar.classList.remove('print-visible');
        });
    });
});

// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function (event) {
        const isSmallScreen = window.innerWidth <= 400;
        const clickedInsideSidebar = sidebar.contains(event.target);
        const clickedOnToggle = toggleButton.contains(event.target);

        if (isSmallScreen && sidebar.classList.contains('active') && !clickedInsideSidebar && !clickedOnToggle) {
            sidebar.classList.remove('active');
        }
    });

    // Adjust UI when window is resized
    window.addEventListener('resize', function () {
        if (window.innerWidth > 400) {
            sidebar.style.transform = '';
            toggleButton.style.display = 'none';
        } else {
            toggleButton.style.display = 'block';
        }
    });

    // Trigger resize event to set initial state
    window.dispatchEvent(new Event('resize'));
});

// Export grades functionality
document.getElementById('export-grades').addEventListener('click', function () {
    const chartBars = document.querySelectorAll('.chart-bar');

    chartBars.forEach(bar => {
        const heightPercent = parseInt(bar.style.height);
        const pixelHeight = (heightPercent / 100) * 200; // 200px max
        bar.setAttribute('data-original-height', bar.style.height);
        bar.style.height = pixelHeight + 'px';
        bar.classList.add('print-visible'); // Add a class to ensure styling
    });

    // Trigger print
    window.print();

    // Restore after print
    window.addEventListener('afterprint', function () {
        chartBars.forEach(bar => {
            const originalHeight = bar.getAttribute('data-original-height');
            if (originalHeight) {
                bar.style.height = originalHeight;
                bar.removeAttribute('data-original-height');
            }
            bar.classList.remove('print-visible');
        });
    });
});


// Make chart responsive
window.addEventListener('resize', function () {
    const chartContainer = document.querySelector('.chart-container');
    const chartPlaceholder = document.querySelector('.chart-placeholder');

    if (window.innerWidth <= 576) {
        chartPlaceholder.style.minWidth = '300px';
    } else {
        chartPlaceholder.style.minWidth = '400px';
    }

    // Ensure chart bars are properly sized
    const chartBars = document.querySelectorAll('.chart-bar');
    chartBars.forEach(bar => {
        // Make sure bars have a minimum height for visibility
        if (bar.style.height.includes('%')) {
            const percentage = parseInt(bar.style.height);
            if (percentage < 10) bar.style.height = '10%';
        }
    });
});

// Ensure chart is visible when page loads
document.addEventListener('DOMContentLoaded', function () {
    const chartBars = document.querySelectorAll('.chart-bar');
    // Apply explicit heights for chart bars to ensure they render properly
    chartBars.forEach(bar => {
        if (bar.style.height.includes('%')) {
            // Add a class to ensure visibility in print mode
            bar.classList.add('print-visible');
        }
    });
});
// Force hamburger visibility when small screen
function checkScreenSize() {
    const toggleButton = document.getElementById('mobile-menu-toggle');
    if (window.innerWidth <= 400) {
        toggleButton.style.display = 'block';
    } else {
        toggleButton.style.display = 'none';
        sidebar.classList.remove('active'); // Hide sidebar when resizing back
    }
}

window.addEventListener('resize', checkScreenSize);
window.addEventListener('load', checkScreenSize);
