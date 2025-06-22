
document.querySelectorAll('.semester-tab').forEach((tab, index) => {
    tab.addEventListener('click', function () {
        // Remove active class from all tabs
        document.querySelectorAll('.semester-tab').forEach(t => {
            t.classList.remove('active');
        });
        // Add active class to clicked tab
        this.classList.add('active');

        // Get all semester content elements
        const firstSemMidterms = document.getElementById('first-semester-midterms');
        const firstSemFinals = document.getElementById('first-semester-finals');
        const secondSemMidterms = document.getElementById('second-semester-midterms');
        const secondSemFinals = document.getElementById('second-semester-finals');
        const finalGrades = document.getElementById('final-grades');
        const finalGradesHeader = document.getElementById('final-grades-header');

        // Hide all content sections first
        firstSemMidterms.style.display = 'none';
        firstSemFinals.style.display = 'none';
        secondSemMidterms.style.display = 'none';
        secondSemFinals.style.display = 'none';
        finalGrades.style.display = 'none';
        finalGradesHeader.style.display = 'none';

        // Show content based on clicked tab index
        if (index === 0) {
            firstSemMidterms.style.display = '';
        } else if (index === 1) {
            firstSemFinals.style.display = '';
        } else if (index === 2) {
            secondSemMidterms.style.display = '';
        } else if (index === 3) {
            secondSemFinals.style.display = '';
        } else if (index === 4) {
            finalGrades.style.display = '';
            finalGradesHeader.style.display = ''; // Show the final grades header
        }
    });
});

// Add this to your existing teachergrade.js file

document.addEventListener("DOMContentLoaded", () => {
    // Create the print button container and button if they don't already exist in HTML
    const finalGradesTable = document.getElementById('final-grades');
    let printButtonContainer = document.getElementById('print-grades-container');

    // If the print button container doesn't exist in HTML, create it dynamically
    if (!printButtonContainer) {
        printButtonContainer = document.createElement('div');
        printButtonContainer.id = 'print-grades-container';
        printButtonContainer.className = 'print-btn-container';
        printButtonContainer.style.textAlign = 'right';
        printButtonContainer.style.margin = '20px 0';
        printButtonContainer.style.display = 'none';

        const printButton = document.createElement('button');
        printButton.id = 'print-grades-btn';
        printButton.className = 'btn btn-info';
        printButton.innerHTML = '<i class="fas fa-print"></i> Print Grades';

        printButtonContainer.appendChild(printButton);

        // Insert the print button container after the final grades table
        finalGradesTable.parentNode.insertBefore(printButtonContainer, finalGradesTable.nextSibling);
    }

    // Reference to the print button
    const printButton = document.getElementById('print-grades-btn');

    // Show/hide print button when tab is changed
    document.querySelectorAll('.semester-tab').forEach((tab, index) => {
        const originalClickHandler = tab.onclick;

        tab.onclick = function (event) {
            // Call the original handler if it exists
            if (typeof originalClickHandler === 'function') {
                originalClickHandler.call(this, event);
            }

            // Show print button only on final grades tab (index 4)
            printButtonContainer.style.display = index === 4 ? 'block' : 'none';
        };
    });

    // Add print functionality to the button
    printButton.addEventListener('click', printFinalGrades);

    function printFinalGrades() {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');

        // Get the course and section information
        const courseSelect = document.getElementById('course-select');
        const sectionSelect = document.getElementById('section-select');
        const courseText = courseSelect.options[courseSelect.selectedIndex]?.text || 'Selected Course';
        const sectionText = sectionSelect.options[sectionSelect.selectedIndex]?.text || 'Selected Section';
        const currentDate = new Date().toLocaleDateString();

        // Get the final grades table and header
        const finalGradesTable = document.getElementById('final-grades');
        const finalGradesHeader = document.getElementById('final-grades-header');

        // Set the HTML content for the print window
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Final Grades - ${courseText}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .course-info {
                        margin-bottom: 15px;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .student-name {
                        display: flex;
                        align-items: center;
                        font-weight: bold;
                    }
                    .student-avatar {
                        margin-right: 10px;
                        font-size: 16px;
                    }
                    .final-grade-display {
                        display: flex;
                        flex-direction: column;
                    }
                    .grade-number {
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .grade-letter {
                        font-size: 16px;
                        margin-right: 10px;
                    }
                    .grade-percent {
                        font-size: 14px;
                        color: #666;
                    }
                    .grade-desc {
                        font-size: 12px;
                        color: #999;
                    }
                    .signature-line {
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .signature {
                        width: 200px;
                        text-align: center;
                    }
                    .signature-name {
                        border-top: 1px solid #000;
                        padding-top: 5px;
                        margin-top: 30px;
                    }
                    .print-date {
                        text-align: right;
                        font-size: 12px;
                        color: #666;
                        margin-top: 20px;
                    }
                    @media print {
                        .no-print {
                            display: none;
                        }
                        body {
                            margin: 0;
                            padding: 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Final Grades Report</h2>
                    <div class="course-info">
                        <strong>Course:</strong> ${courseText} | <strong>Section:</strong> ${sectionText}
                    </div>
                </div>
                
                <table>
                    ${finalGradesHeader.outerHTML}
                    <tbody>
                        ${finalGradesTable.innerHTML}
                    </tbody>
                </table>
                
                <div class="signature-line">
                    <div class="signature">
                        <div class="signature-name">Teacher's Signature</div>
                    </div>
                    <div class="signature">
                        <div class="signature-name">Department Head</div>
                    </div>
                </div>
                
                <div class="print-date">
                    Generated on: ${currentDate}
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print();" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Print
                    </button>
                    <button onclick="window.close();" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                        Close
                    </button>
                </div>
            </body>
            </html>
        `);

        // Focus on the new window and close the document for proper rendering
        printWindow.document.close();
        printWindow.focus();
    }
});


document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.querySelector('.search-input');

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();

        // Get all student rows from all semesters
        const allStudentRows = document.querySelectorAll('.grades-table tbody tr');

        allStudentRows.forEach(row => {
            const studentNameElement = row.querySelector('.student-name');
            if (!studentNameElement) return;

            const studentName = studentNameElement.textContent.trim().toLowerCase();

            // Check if the student name contains the search term
            if (studentName.includes(searchTerm)) {
                row.style.display = ''; // Show the row
            } else {
                row.style.display = 'none'; // Hide the row
            }
        });

        // If in final grades view, we need to handle this differently
        if (document.getElementById('final-grades').style.display !== 'none') {
            updateFinalGradesVisibility(searchTerm);
        }
    });

    // Function to handle visibility in final grades view
    function updateFinalGradesVisibility(searchTerm) {
        const finalGradesRows = document.querySelectorAll('#final-grades tr');

        finalGradesRows.forEach(row => {
            const studentNameElement = row.querySelector('.student-name');
            if (!studentNameElement) return;

            const studentName = studentNameElement.textContent.trim().toLowerCase();

            if (studentName.includes(searchTerm)) {
                row.style.display = ''; // Show the row
            } else {
                row.style.display = 'none'; // Hide the row
            }
        });
    }

    // Update the semester tab click handler to reset search when changing tabs
    document.querySelectorAll('.semester-tab').forEach((tab, index) => {
        const originalClickHandler = tab.onclick;

        tab.onclick = function (event) {
            // Call the original handler if it exists
            if (typeof originalClickHandler === 'function') {
                originalClickHandler.call(this, event);
            }

            // After changing tabs, reapply the current search filter
            const searchTerm = searchInput.value.toLowerCase().trim();
            if (searchTerm) {
                // Slight delay to ensure the DOM has updated
                setTimeout(() => {
                    const allStudentRows = document.querySelectorAll('.grades-table tbody tr');

                    allStudentRows.forEach(row => {
                        const studentNameElement = row.querySelector('.student-name');
                        if (!studentNameElement) return;

                        const studentName = studentNameElement.textContent.trim().toLowerCase();

                        if (studentName.includes(searchTerm)) {
                            row.style.display = ''; // Show the row
                        } else {
                            row.style.display = 'none'; // Hide the row
                        }
                    });

                    // Also handle final grades view if active
                    if (index === 4) {
                        updateFinalGradesVisibility(searchTerm);
                    }
                }, 50);
            }
        };
    });

    // Add clear search button functionality (X button)
    const searchIcon = document.querySelector('.search-icon');
    searchIcon.style.cursor = 'pointer';

    // Create a clear button next to the search input
    const searchBox = document.querySelector('.search-box');
    const clearButton = document.createElement('span');
    clearButton.className = 'clear-search';
    clearButton.textContent = '✕';
    clearButton.style.display = 'none';
    clearButton.style.cursor = 'pointer';
    clearButton.style.position = 'absolute';
    clearButton.style.right = '10px';
    clearButton.style.top = '50%';
    clearButton.style.transform = 'translateY(-50%)';
    searchBox.style.position = 'relative';
    searchBox.appendChild(clearButton);

    // Show/hide clear button based on search input
    searchInput.addEventListener('input', function () {
        clearButton.style.display = this.value ? 'block' : 'none';
    });

    // Clear search when clicking the clear button
    clearButton.addEventListener('click', function () {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        this.style.display = 'none';
        searchInput.focus();
    });


    // Hide all content sections except first semester midterms on page load
    document.getElementById('first-semester-midterms').style.display = '';
    document.getElementById('first-semester-finals').style.display = 'none';
    document.getElementById('second-semester-midterms').style.display = 'none';
    document.getElementById('second-semester-finals').style.display = 'none';
    document.getElementById('final-grades').style.display = 'none';
    document.getElementById('final-grades-header').style.display = 'none';

    // Set the first tab as active initially
    document.querySelectorAll('.semester-tab').forEach((tab, index) => {
        if (index === 0) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Define maximum scores for each assessment type
    const maxScores = {
        quiz: 50,  // Maximum score for quizzes
        lab: 50,   // Maximum score for labs
        midterm: 100, // Maximum score for midterm exam
        final: 100    // Maximum score for final project
    };

    const gradeInputs = document.querySelectorAll(".grade-input");

    // Add data attributes for input validation
    gradeInputs.forEach(input => {
        const column = input.closest('td').cellIndex;

        // Determine the type of assessment based on column index
        if (column >= 1 && column <= 3) { // Quizzes
            input.setAttribute('max', maxScores.quiz);
            input.setAttribute('data-type', 'quiz');
        } else if (column >= 4 && column <= 5) { // Labs
            input.setAttribute('max', maxScores.lab);
            input.setAttribute('data-type', 'lab');
        } else if (column === 6) { // Midterm
            input.setAttribute('max', maxScores.midterm);
            input.setAttribute('data-type', 'midterm');
        } else if (column === 7) { // Final
            input.setAttribute('max', maxScores.final);
            input.setAttribute('data-type', 'final');
        }

        // Add placeholder showing max score
        input.setAttribute('placeholder', `/${input.getAttribute('max')}`);

        // Add input validation
        input.addEventListener("input", (event) => {
            const max = parseInt(event.target.getAttribute('max'));
            let value = parseInt(event.target.value) || 0;

            if (value > max) {
                value = max;
                event.target.value = max;
            }
            if (value < 0) {
                value = 0;
                event.target.value = 0;
            }

            const row = event.target.closest("tr");
            recalculateOverallGrade(row);

            // ➡️ Add this line:
            calculateFinalGrades();
        });
    });

    // Initialize calculations for all rows on page load
    document.querySelectorAll("tbody tr").forEach(row => {
        recalculateOverallGrade(row);
    });

    // Calculate final grades across all semesters
    calculateFinalGrades();

    function recalculateOverallGrade(row) {
        const quizWeights = 0.3; // 30%
        const labWeights = 0.2;  // 20%
        const midtermWeight = 0.25; // 25%
        const finalWeight = 0.25;  // 25%

        const inputs = row.querySelectorAll("input.grade-input");

        if (inputs.length < 7) {
            console.warn("Missing inputs for row:", row);
            return; // skip calculation if not enough data
        }

        // Organize inputs manually
        const quizzes = [
            parseFloat(inputs[0].value) || 0,
            parseFloat(inputs[1].value) || 0,
            parseFloat(inputs[2].value) || 0,
        ];
        const labs = [
            parseFloat(inputs[3].value) || 0,
            parseFloat(inputs[4].value) || 0,
        ];
        const midterm = parseFloat(inputs[5].value) || 0;
        const final = parseFloat(inputs[6].value) || 0;

        // Now do the % conversion
        const quizPercentages = quizzes.map(score => (score / maxScores.quiz) * 100);
        const labPercentages = labs.map(score => (score / maxScores.lab) * 100);
        const midtermPercentage = (midterm / maxScores.midterm) * 100;
        const finalPercentage = (final / maxScores.final) * 100;

        // Average
        const quizAvg = quizPercentages.reduce((a, b) => a + b, 0) / quizzes.length;
        const labAvg = labPercentages.reduce((a, b) => a + b, 0) / labs.length;

        // Weighted grade
        const overallGrade = (quizAvg * quizWeights) +
            (labAvg * labWeights) +
            (midtermPercentage * midtermWeight) +
            (finalPercentage * finalWeight);

        // Find the Overall td
        const overallCell = row.querySelector("td:last-child"); // safer way
        const numericGrade = getNumericGrade(overallGrade);
        const letterGrade = getLetterGrade(numericGrade);

        if (overallCell) {
            overallCell.innerHTML = `<strong>${numericGrade} (${overallGrade.toFixed(1)}%)</strong>`;
            overallCell.title = `${letterGrade} - ${getGradeDescription(numericGrade)}`;

            // Colors
            if (numericGrade <= 2.0) {
                overallCell.style.color = "#28a745";
            } else if (numericGrade <= 3.0) {
                overallCell.style.color = "#17a2b8";
            } else if (numericGrade == 4.0) {
                overallCell.style.color = "#ffc107";
            } else {
                overallCell.style.color = "#dc3545";
            }
        }
    }

    function calculateFinalGrades() {
        const studentMap = new Map();

        // Helper to collect grades from a semester
        function collectSemesterGrades(tbodyId, semesterKey) {
            document.querySelectorAll(`#${tbodyId} tr`).forEach(row => {
                const studentNameElement = row.querySelector('.student-name');
                if (!studentNameElement) return;
                const studentName = studentNameElement.textContent.trim();

                if (!studentMap.has(studentName)) {
                    studentMap.set(studentName, {
                        name: studentName,
                        avatar: row.querySelector('.student-avatar')?.textContent || "",
                        semesters: {}
                    });
                }

                const overallCell = row.querySelector('td:last-child strong');
                if (overallCell) {
                    const percentageText = overallCell.textContent.match(/\((\d+(\.\d+)?)%\)/);
                    const numericText = overallCell.textContent.match(/^(\d+\.\d+)/);
                    const percentage = percentageText ? parseFloat(percentageText[1]) : 0;
                    const numericGrade = numericText ? numericText[1] : "0.0";

                    const student = studentMap.get(studentName);
                    student.semesters[semesterKey] = {
                        percentage: percentage,
                        grade: numericGrade
                    };
                }
            });
        }

        // Collect grades for each semester
        collectSemesterGrades('first-semester-midterms', 'sem1mid');
        collectSemesterGrades('first-semester-finals', 'sem1final');
        collectSemesterGrades('second-semester-midterms', 'sem2mid');
        collectSemesterGrades('second-semester-finals', 'sem2final');

        // Update final grades table
        const finalGradesBody = document.getElementById('final-grades');
        finalGradesBody.innerHTML = '';

        studentMap.forEach(student => {
            const s = student.semesters;
            const overallPercentage = (
                (s.sem1mid?.percentage || 0) * 0.25 +
                (s.sem1final?.percentage || 0) * 0.25 +
                (s.sem2mid?.percentage || 0) * 0.25 +
                (s.sem2final?.percentage || 0) * 0.25
            );

            const numericGrade = getNumericGrade(overallPercentage);
            const letterGrade = getLetterGrade(numericGrade);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="student-name">
                        ${student.name}
                    </div>
                </td>
                <td>${s.sem1mid?.grade || "0.0"} (${s.sem1mid?.percentage?.toFixed(1) || "0.0"}%)</td>
                <td>${s.sem1final?.grade || "0.0"} (${s.sem1final?.percentage?.toFixed(1) || "0.0"}%)</td>
                <td>${s.sem2mid?.grade || "0.0"} (${s.sem2mid?.percentage?.toFixed(1) || "0.0"}%)</td>
                <td>${s.sem2final?.grade || "0.0"} (${s.sem2final?.percentage?.toFixed(1) || "0.0"}%)</td>
                <td colspan="3" class="final-grade">
                    <div class="final-grade-display">
                        <span class="grade-number">${numericGrade}</span>
                        <span class="grade-letter">${letterGrade}</span>
                        <span class="grade-percent">${overallPercentage.toFixed(1)}%</span>
                        <span class="grade-desc">${getGradeDescription(numericGrade)}</span>
                    </div>
                </td>
            `;

            // Color coding based on final grade
            const finalGradeCell = row.querySelector('.final-grade');
            if (numericGrade <= 2.0) {
                finalGradeCell.style.color = "#28a745";
            } else if (numericGrade <= 3.0) {
                finalGradeCell.style.color = "#17a2b8";
            } else if (numericGrade == 4.0) {
                finalGradeCell.style.color = "#ffc107";
            } else {
                finalGradeCell.style.color = "#dc3545";
            }

            finalGradesBody.appendChild(row);
        });
    }


    // Helper function to collect grade data from a semester row
    function collectGradeData(row, semesterKey, studentMap) {
        const studentNameElement = row.querySelector('.student-name');
        if (!studentNameElement) return;

        const studentName = studentNameElement.textContent.trim();
        const gradeCell = row.querySelector('td:last-child'); // More reliable way to get the last cell

        if (studentMap.has(studentName) && gradeCell) {
            // Extract grade information
            let percentage = 0;
            let grade = "0.0";

            const gradeText = gradeCell.textContent.trim();
            if (gradeText) {
                // Try to extract grade and percentage
                const gradeMatch = gradeText.match(/(\d+\.\d+)\s*\((\d+\.?\d*)%\)/);
                if (gradeMatch) {
                    grade = gradeMatch[1];
                    percentage = parseFloat(gradeMatch[2]);
                }
            } else {
                // If no text in cell, calculate it
                const quizWeights = 0.3;
                const labWeights = 0.2;
                const midtermWeight = 0.25;
                const finalWeight = 0.25;

                const inputs = row.querySelectorAll("input.grade-input");
                if (inputs.length >= 7) {
                    const quizzes = [
                        parseFloat(inputs[0].value) || 0,
                        parseFloat(inputs[1].value) || 0,
                        parseFloat(inputs[2].value) || 0,
                    ];
                    const labs = [
                        parseFloat(inputs[3].value) || 0,
                        parseFloat(inputs[4].value) || 0,
                    ];
                    const midterm = parseFloat(inputs[5].value) || 0;
                    const final = parseFloat(inputs[6].value) || 0;

                    // Convert to percentages
                    const quizPercentages = quizzes.map(score => (score / maxScores.quiz) * 100);
                    const labPercentages = labs.map(score => (score / maxScores.lab) * 100);
                    const midtermPercentage = (midterm / maxScores.midterm) * 100;
                    const finalPercentage = (final / maxScores.final) * 100;

                    // Calculate averages
                    const quizAvg = quizPercentages.reduce((a, b) => a + b, 0) / quizzes.length;
                    const labAvg = labPercentages.reduce((a, b) => a + b, 0) / labs.length;

                    // Calculate weighted grade
                    percentage = (quizAvg * quizWeights) +
                        (labAvg * labWeights) +
                        (midtermPercentage * midtermWeight) +
                        (finalPercentage * finalWeight);

                    grade = getNumericGrade(percentage);
                }
            }

            // Store data in student map
            const student = studentMap.get(studentName);
            student.semesters[semesterKey] = {
                percentage: percentage,
                grade: grade
            };
        }
    }

    function getNumericGrade(percentage) {
        // Philippine college grading system (1.0 to 5.0 scale)
        if (percentage >= 96) return "1.0";
        if (percentage >= 91) return "1.5";
        if (percentage >= 86) return "2.0";
        if (percentage >= 81) return "2.5";
        if (percentage >= 76) return "3.0";
        if (percentage >= 70) return "4.0"; // Conditional Pass
        return "5.0"; // Fail
    }

    function getLetterGrade(numericGrade) {
        const gradeMap = {
            "1.0": "A",
            "1.5": "A-",
            "2.0": "B+",
            "2.5": "B",
            "3.0": "C",
            "4.0": "D",
            "5.0": "F"
        };
        return gradeMap[numericGrade] || "";
    }

    function getGradeDescription(numericGrade) {
        const descriptionMap = {
            "1.0": "Excellent",
            "1.5": "Very Good",
            "2.0": "Good",
            "2.5": "Satisfactory",
            "3.0": "Passing",
            "4.0": "Conditional Pass",
            "5.0": "Failing"
        };
        return descriptionMap[numericGrade] || "";
    }

    const courseSelect = document.getElementById("course-select");
    const sectionSelect = document.getElementById("section-select");

    // Retrieve courses from localStorage or use sample data if none exists
    let courses = JSON.parse(localStorage.getItem("courses")) || [];

    // If no courses in localStorage, add sample data
    if (courses.length === 0) {
        courses = [
            { id: "1", title: "Programming", code: "CC-105", meta: "BSIT-2C" },
            { id: "2", title: "PathFit4", code: "PE", meta: "BSIT-2C" },
            { id: "3", title: "Data Structures", code: "CS-201", meta: "BSCS-2A" },
            { id: "4", title: "Web Development", code: "IT-210", meta: "BSIT-3B" }
        ];
        localStorage.setItem("courses", JSON.stringify(courses));
    }

    // Populate the Course dropdown
    courses.forEach(course => {
        const option = document.createElement("option");
        option.value = course.code; // Use the course code as the value
        option.textContent = `${course.title} (${course.code})`; // Display course title and code
        courseSelect.appendChild(option);
    });

    // Handle Course selection
    courseSelect.addEventListener("change", () => {
        const selectedCourseCode = courseSelect.value;

        // Clear and enable the Section dropdown
        sectionSelect.innerHTML = '<option value="" disabled selected>Select a section</option>';
        sectionSelect.disabled = false;

        // Find the selected course and populate the Section dropdown
        const selectedCourse = courses.find(course => course.code === selectedCourseCode);
        if (selectedCourse) {
            const option = document.createElement("option");
            option.value = selectedCourse.meta; // Use the section (meta) as the value
            option.textContent = selectedCourse.meta; // Display the section
            sectionSelect.appendChild(option);
        }
    });

    // Handle Section selection (optional: you can add functionality here if needed)
    sectionSelect.addEventListener("change", () => {
        console.log(`Selected Section: ${sectionSelect.value}`);
    });

    // Add Save Changes functionality
    const saveButton = document.querySelector(".btn.btn-primary");
    saveButton.addEventListener("click", () => {
        alert("Grades have been saved successfully!");
    });

    // Add Export Grades functionality
    const exportButton = document.querySelector(".btn.btn-secondary");
    exportButton.addEventListener("click", () => {
        alert("Grades export has been initiated. Check your downloads folder.");
    });
});


// Add this function to help with consistent student name extraction
function getStudentNameFromRow(row) {
    const studentNameElement = row.querySelector('.student-name');
    if (!studentNameElement) return null;

    // If the student name is nested inside another element, get the text directly
    // This handles cases where the avatar might be affecting text extraction
    return studentNameElement.textContent.trim();
}

// Modify the collectGradeData function to better handle student name extraction
function collectGradeData(row, semesterKey, studentMap) {
    const studentName = getStudentNameFromRow(row);
    if (!studentName) return;

    const gradeCell = row.querySelector('td:last-child');

    if (studentMap.has(studentName) && gradeCell) {
        // Extract grade information
        let percentage = 0;
        let grade = "0.0";

        const gradeText = gradeCell.textContent.trim();
        if (gradeText) {
            // Improved regex to better handle different grade formats
            const gradeMatch = gradeText.match(/(\d+\.\d+)\s*\((\d+\.?\d*)%\)/);
            if (gradeMatch) {
                grade = gradeMatch[1];
                percentage = parseFloat(gradeMatch[2]);
            }
        } else {
            // If no text in cell, calculate it
            const quizWeights = 0.3;
            const labWeights = 0.2;
            const midtermWeight = 0.25;
            const finalWeight = 0.25;

            const inputs = row.querySelectorAll("input.grade-input");
            if (inputs.length >= 7) {
                const quizzes = [
                    parseFloat(inputs[0].value) || 0,
                    parseFloat(inputs[1].value) || 0,
                    parseFloat(inputs[2].value) || 0,
                ];
                const labs = [
                    parseFloat(inputs[3].value) || 0,
                    parseFloat(inputs[4].value) || 0,
                ];
                const midterm = parseFloat(inputs[5].value) || 0;
                const final = parseFloat(inputs[6].value) || 0;

                // Convert to percentages
                const quizPercentages = quizzes.map(score => (score / maxScores.quiz) * 100);
                const labPercentages = labs.map(score => (score / maxScores.lab) * 100);
                const midtermPercentage = (midterm / maxScores.midterm) * 100;
                const finalPercentage = (final / maxScores.final) * 100;

                // Calculate averages
                const quizAvg = quizPercentages.reduce((a, b) => a + b, 0) / quizzes.length;
                const labAvg = labPercentages.reduce((a, b) => a + b, 0) / labs.length;

                // Calculate weighted grade
                percentage = (quizAvg * quizWeights) +
                    (labAvg * labWeights) +
                    (midtermPercentage * midtermWeight) +
                    (finalPercentage * finalWeight);

                grade = getNumericGrade(percentage);
            }
        }

        // Store data in student map
        const student = studentMap.get(studentName);
        student.semesters[semesterKey] = {
            percentage: percentage,
            grade: grade
        };

        // Debug line to help trace Jerome Antonio's data
        if (studentName.includes("Jerome Antonio")) {
            console.log(`Updated ${semesterKey} for ${studentName}: `, student.semesters[semesterKey]);
        }
    }
}